const Ticket = require('../models/Ticket');
const Event  = require('../models/Event');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ── POST /api/tickets ─────────────────────────────────────────────────────────
const createTicket = async (req, res) => {
  const { event: eventId } = req.body;

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found');

  // Only the event organizer or admin may add tickets
  if (
    event.organizer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'Only the event organizer can add tickets');
  }

  const ticket = await Ticket.create(req.body);
  res.status(201).json(new ApiResponse(201, ticket, 'Ticket created successfully'));
};

// ── GET /api/tickets/event/:eventId ───────────────────────────────────────────
const getTicketsByEvent = async (req, res) => {
  const tickets = await Ticket.find({ event: req.params.eventId })
    .sort({ price: 1 })
    .lean();

  res.json(new ApiResponse(200, tickets, 'Tickets fetched successfully'));
};

// ── PATCH /api/tickets/:id ────────────────────────────────────────────────────
const updateTicket = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('event');
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  if (
    ticket.event.organizer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'Only the event organizer can update tickets');
  }

  // Prevent decreasing totalQuantity below soldQuantity
  if (
    req.body.totalQuantity !== undefined &&
    Number(req.body.totalQuantity) < ticket.soldQuantity
  ) {
    throw new ApiError(
      400,
      `Cannot set totalQuantity (${req.body.totalQuantity}) below already sold quantity (${ticket.soldQuantity})`
    );
  }

  const updated = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json(new ApiResponse(200, updated, 'Ticket updated successfully'));
};

module.exports = { createTicket, getTicketsByEvent, updateTicket };
