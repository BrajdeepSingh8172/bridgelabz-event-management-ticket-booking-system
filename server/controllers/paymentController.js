const crypto   = require('crypto');
const mongoose  = require('mongoose');
const Razorpay  = require('razorpay');
const Payment   = require('../models/Payment');
const Booking   = require('../models/Booking');
const Ticket    = require('../models/Ticket');
const Event     = require('../models/Event');
const User      = require('../models/User');
const ApiError  = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getRazorpay = () =>
  new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
  });

/** Undo stock decrements when payment order creation fails after DB commit. */
const rollbackBooking = async (bookingId, ticketLines) => {
  try {
    // Restore ticket stock
    for (const { ticket, quantity } of ticketLines) {
      await Ticket.findByIdAndUpdate(ticket, { $inc: { soldQuantity: -quantity } });
    }
    const totalQty = ticketLines.reduce((s, l) => s + l.quantity, 0);
    const booking  = await Booking.findById(bookingId);
    if (booking) {
      await Event.findByIdAndUpdate(booking.event, { $inc: { soldCount: -totalQty } });
      booking.status = 'cancelled';
      await booking.save();
    }
  } catch (rbErr) {
    console.error('⚠️  Rollback error (manual intervention may be needed):', rbErr.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-order
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Single endpoint that:
 *  1. Atomically validates stock, creates Booking (pending), decrements stock
 *  2. For free events → confirms booking immediately, returns { isFree: true }
 *  3. For paid events → creates Razorpay order, returns orderId + bookingId
 */
const createOrder = async (req, res) => {
  const { eventId, tickets: ticketLines, attendee } = req.body;

  if (!eventId) throw new ApiError(400, 'eventId is required');
  if (!ticketLines || ticketLines.length === 0)
    throw new ApiError(400, 'At least one ticket must be selected');

  // ── Step 1: Atomic transaction ─────────────────────────────────────────────
  const session = await mongoose.startSession();
  session.startTransaction();

  let booking;
  let totalAmount   = 0;
  let savedTicketLines = [];

  try {
    const event = await Event.findById(eventId).session(session);
    if (!event)                     throw new ApiError(404, 'Event not found');
    if (event.status !== 'published') throw new ApiError(400, 'Event is not open for booking');

    let totalQtyBooked = 0;

    for (const { ticketId, quantity } of ticketLines) {
      if (!ticketId || !quantity || quantity < 1)
        throw new ApiError(400, 'Each ticket entry needs a valid ticketId and quantity ≥ 1');

      const ticket = await Ticket.findById(ticketId).session(session);
      if (!ticket)        throw new ApiError(404, `Ticket not found`);
      if (!ticket.isActive) throw new ApiError(400, `Ticket "${ticket.name}" is no longer available`);

      const remaining = ticket.totalQuantity - ticket.soldQuantity;
      if (quantity > remaining)
        throw new ApiError(400, `Only ${remaining} "${ticket.name}" ticket(s) left`);
      if (quantity > ticket.perUserLimit)
        throw new ApiError(400, `Max ${ticket.perUserLimit} "${ticket.name}" per person`);

      await Ticket.findByIdAndUpdate(
        ticketId,
        { $inc: { soldQuantity: quantity } },
        { session }
      );

      savedTicketLines.push({ ticket: ticket._id, quantity, unitPrice: ticket.price });
      totalAmount    += ticket.price * quantity;
      totalQtyBooked += quantity;
    }

    await Event.findByIdAndUpdate(
      eventId,
      { $inc: { soldCount: totalQtyBooked } },
      { session }
    );

    // Normalise attendee fields (form sends attendeeName / attendeeEmail / attendeePhone)
    const attendeeInfo = {
      name:  (attendee?.attendeeName  || attendee?.name  || '').trim(),
      email: (attendee?.attendeeEmail || attendee?.email || '').trim().toLowerCase(),
      phone: (attendee?.attendeePhone || attendee?.phone || '').trim(),
    };

    const [created] = await Booking.create(
      [{ user: req.user.id, event: eventId, tickets: savedTicketLines, totalAmount,
         status: 'pending', attendeeInfo }],
      { session }
    );
    booking = created;

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err; // forwarded to Express errorHandler → JSON error response
  }

  // ── Step 2: Post-commit side-effects (non-critical) ─────────────────────────
  try {
    const { generateQR } = require('../services/qrService');
    const qrCode = await generateQR(booking.bookingRef);
    booking.qrCode = qrCode;
    await booking.save();

    const { sendBookingConfirmation } = require('../services/emailService');
    const [userDoc, eventDoc] = await Promise.all([
      User.findById(req.user.id).lean(),
      Event.findById(eventId).lean(),
    ]);
    await sendBookingConfirmation({
      to:           booking.attendeeInfo?.email || userDoc?.email || '',
      attendeeName: booking.attendeeInfo?.name  || userDoc?.name  || 'Guest',
      bookingRef:   booking.bookingRef,
      eventTitle:   eventDoc?.title || 'Event',
      eventDate:    eventDoc?.startDate ? new Date(eventDoc.startDate).toDateString() : 'TBD',
      venueName:    eventDoc?.venue?.name || 'TBD',
      totalAmount,
      qrCode,
    });
  } catch (e) {
    console.error('⚠️  Post-booking side-effect error (booking saved OK):', e.message);
  }

  // ── Step 3: Free event → confirm immediately ──────────────────────────────
  if (totalAmount === 0) {
    booking.status = 'confirmed';
    await booking.save();
    return res.status(201).json(
      new ApiResponse(201, {
        isFree:    true,
        bookingId: booking._id,
        bookingRef: booking.bookingRef,
        amount:    0,
      }, 'Free booking confirmed')
    );
  }

  // ── Step 4: Paid event → create Razorpay order ────────────────────────────
  let razorpayOrder;
  try {
    const rz = getRazorpay();
    razorpayOrder = await rz.orders.create({
      amount:   Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt:  booking.bookingRef,
      notes:    { bookingId: booking._id.toString(), userId: req.user.id },
    });
  } catch (rzErr) {
    // Razorpay failed → roll back the booking to avoid ghost reservations
    console.error('❌ Razorpay order creation failed:', rzErr.message || rzErr);
    await rollbackBooking(booking._id, savedTicketLines);
    throw new ApiError(502, 'Payment gateway error — please try again shortly');
  }

  // Persist the payment record in pending state
  const payment = await Payment.create({
    booking:         booking._id,
    user:            req.user.id,
    razorpayOrderId: razorpayOrder.id,
    amount:          totalAmount,
    currency:        'INR',
    status:          'pending',
  });

  booking.paymentId = payment._id;
  await booking.save();

  return res.status(201).json(
    new ApiResponse(201, {
      orderId:    razorpayOrder.id,
      amount:     razorpayOrder.amount,
      currency:   razorpayOrder.currency,
      keyId:      process.env.RAZORPAY_KEY_ID,
      bookingId:  booking._id,
      bookingRef: booking.bookingRef,
      paymentId:  payment._id,
    }, 'Razorpay order created')
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  // Accept both snake_case (Razorpay callback) and camelCase (our convention)
  const razorpayOrderId   = req.body.razorpay_order_id   || req.body.razorpayOrderId;
  const razorpayPaymentId = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpaySignature = req.body.razorpay_signature  || req.body.razorpaySignature;
  const { bookingId }     = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId)
    throw new ApiError(400, 'Missing required payment verification fields');

  // Validate Razorpay HMAC signature
  const expectedSig = crypto
    .createHmac('sha256', (process.env.RAZORPAY_KEY_SECRET || '').trim())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSig !== razorpaySignature)
    throw new ApiError(400, 'Payment signature verification failed');

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { razorpayPaymentId, razorpaySignature, status: 'completed' },
    { new: true }
  );
  if (!payment) throw new ApiError(404, 'Payment record not found');

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: 'confirmed' },
    { new: true }
  );
  if (!booking) throw new ApiError(404, 'Booking not found');

  res.json(new ApiResponse(200, { payment, booking }, 'Payment verified — booking confirmed'));
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/:id
// ─────────────────────────────────────────────────────────────────────────────
const getPaymentById = async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('booking', 'bookingRef status totalAmount')
    .populate('user',    'name email');

  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin')
    throw new ApiError(403, 'Not authorized to view this payment');

  res.json(new ApiResponse(200, payment, 'Payment details fetched'));
};

module.exports = { createOrder, verifyPayment, getPaymentById };
