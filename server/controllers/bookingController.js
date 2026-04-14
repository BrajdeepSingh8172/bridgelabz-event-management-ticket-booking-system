const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Ticket  = require('../models/Ticket');
const IssuedTicket = require('../models/IssuedTicket');
const Event   = require('../models/Event');
const User    = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateQR } = require('../services/qrService');
const { sendBookingConfirmation } = require('../services/emailService');

// ── POST /api/bookings ────────────────────────────────────────────────────────
/**
 * Atomically:
 *  1. Validate per-user limit and stock for every ticket line
 *  2. Decrement soldQuantity on Ticket docs + increment soldCount on Event
 *  3. Create Booking with status:'pending'
 *  4. Generate QR code and persist it
 *  5. Send confirmation email
 *  6. Emit 'ticketUpdate' via Socket.IO
 */
const createBooking = async (req, res) => {
  const { eventId, tickets: ticketLines, attendeeInfo } = req.body;

  if (!ticketLines || ticketLines.length === 0) {
    throw new ApiError(400, 'At least one ticket must be selected');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ── Validate event ───────────────────────────────────────────────────────
    const event = await Event.findById(eventId).session(session);
    if (!event) throw new ApiError(404, 'Event not found');
    if (event.status !== 'published') throw new ApiError(400, 'Event is not available for booking');

    const bookingTicketLines = [];
    let totalAmount = 0;
    let totalQtyBooked = 0;

    for (const { ticketId, quantity } of ticketLines) {
      const ticket = await Ticket.findById(ticketId).session(session);
      if (!ticket) throw new ApiError(404, `Ticket ${ticketId} not found`);
      if (!ticket.isActive) throw new ApiError(400, `Ticket "${ticket.name}" is no longer active`);

      const now = new Date();
      if (ticket.saleStartDate && now < ticket.saleStartDate)
        throw new ApiError(400, `Ticket "${ticket.name}" sale has not started yet`);
      if (ticket.saleEndDate && now > ticket.saleEndDate)
        throw new ApiError(400, `Ticket "${ticket.name}" sale has ended`);

      const remaining = ticket.totalQuantity - ticket.soldQuantity;
      if (quantity > remaining)
        throw new ApiError(400, `Only ${remaining} "${ticket.name}" tickets remaining`);

      if (quantity > ticket.perUserLimit)
        throw new ApiError(400, `Maximum ${ticket.perUserLimit} "${ticket.name}" tickets per user`);

      // Atomic decrement
      await Ticket.findByIdAndUpdate(
        ticketId,
        { $inc: { soldQuantity: quantity } },
        { session }
      );

      bookingTicketLines.push({
        ticket: ticket._id,
        quantity,
        unitPrice: ticket.price,
      });

      totalAmount += ticket.price * quantity;
      totalQtyBooked += quantity;
    }

    // Increment event soldCount
    await Event.findByIdAndUpdate(
      eventId,
      { $inc: { soldCount: totalQtyBooked } },
      { session }
    );

    // ── Create booking ───────────────────────────────────────────────────────
    const [booking] = await Booking.create(
      [
        {
          user: req.user.id,
          event: eventId,
          tickets: bookingTicketLines,
          totalAmount,
          status: 'pending',
          attendeeInfo: attendeeInfo || {},
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // ── Post-commit: email (non-critical, do not roll back) ──
    try {
      const userDoc = attendeeInfo?.email ? null : await User.findById(req.user.id).lean();
      await sendBookingConfirmation({
        to: attendeeInfo?.email || userDoc?.email || '',
        attendeeName: attendeeInfo?.name || userDoc?.name || 'Guest',
        bookingRef: booking.bookingRef,
        eventTitle: event.title,
        eventDate: event.startDate.toDateString(),
        venueName:    event.venue?.name || '',
        totalAmount,
        eventId:      event._id,
      });
    } catch (emailOrQrErr) {
      console.error('⚠️   Post-booking email/QR error (booking is still saved):', emailOrQrErr.message);
    }

    // ── Socket.IO — emit ticketUpdate for every ticket line ──────────────────
    const io = req.app.get('io');
    if (io) {
      for (const line of bookingTicketLines) {
        const ticket = await Ticket.findById(line.ticket).lean();
        io.to(`event:${eventId}`).emit('ticketUpdate', {
          eventId,
          ticketTypeId: line.ticket,
          soldQuantity: ticket.soldQuantity,
        });
      }
    }

    res.status(201).json(new ApiResponse(201, booking, 'Booking created successfully'));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// ── GET /api/bookings/my ──────────────────────────────────────────────────────
const getUserBookings = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    Booking.find({ user: req.user.id })
      .populate('event', 'title startDate venue bannerImage status')
      .populate('tickets.ticket', 'name type price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments({ user: req.user.id }),
  ]);

  // Attach issuedTicket (qrImage + ticketCode) to each booking
  const bookingIds = bookings.map((b) => b._id);
  const issuedTickets = await IssuedTicket.find({ booking: { $in: bookingIds } })
    .select('booking ticketCode qrImage tierName isUsed usedAt')
    .lean();

  const issuedMap = {};
  for (const it of issuedTickets) issuedMap[it.booking.toString()] = it;

  const enriched = bookings.map((b) => ({
    ...b,
    issuedTicket: issuedMap[b._id.toString()] ?? null,
  }));

  res.json(
    new ApiResponse(200, {
      bookings: enriched,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }, 'Your bookings fetched')
  );
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('event', 'title startDate endDate venue bannerImage organizer')
    .populate('tickets.ticket', 'name type price')
    .populate('user', 'name email avatar')
    .lean();

  if (!booking) throw new ApiError(404, 'Booking not found');

  // User can only view their own booking; admin can view any
  if (
    booking.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'Not authorized to view this booking');
  }

  // Attach real IssuedTicket (contains JWT-signed qrImage for gate scanning)
  const issuedTicket = await IssuedTicket.findOne({ booking: booking._id })
    .select('ticketCode qrImage tierName isUsed usedAt paymentStatus')
    .lean();

  res.json(new ApiResponse(200, { ...booking, issuedTicket: issuedTicket ?? null }, 'Booking fetched successfully'));
};

// ── PATCH /api/bookings/:id/cancel ───────────────────────────────────────────
const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin')
    throw new ApiError(403, 'Not authorized to cancel this booking');

  if (['cancelled', 'refunded'].includes(booking.status))
    throw new ApiError(400, `Booking is already ${booking.status}`);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Restore ticket quantities
    for (const line of booking.tickets) {
      await Ticket.findByIdAndUpdate(
        line.ticket,
        { $inc: { soldQuantity: -line.quantity } },
        { session }
      );
    }

    const totalQty = booking.tickets.reduce((s, l) => s + l.quantity, 0);
    await Event.findByIdAndUpdate(booking.event, { $inc: { soldCount: -totalQty } }, { session });

    booking.status = 'cancelled';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Emit ticketUpdate
    const io = req.app.get('io');
    if (io) {
      for (const line of booking.tickets) {
        const ticket = await Ticket.findById(line.ticket).lean();
        if (ticket) {
          io.to(`event:${booking.event}`).emit('ticketUpdate', {
            eventId: booking.event,
            ticketTypeId: line.ticket,
            soldQuantity: ticket.soldQuantity,
          });
        }
      }
    }

    res.json(new ApiResponse(200, booking, 'Booking cancelled successfully'));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking };
