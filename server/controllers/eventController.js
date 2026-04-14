const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ── POST /api/events ──────────────────────────────────────────────────────────
const createEvent = async (req, res) => {
  const body = { 
    ...req.body, 
    organizer: req.user.id,
    // Default to 'published' so events are immediately visible
    status: req.body.status || 'published',
    venue: {
      name: req.body.venueName || req.body.venue,
      address: req.body.address || 'TBD',
      city: req.body.city || 'TBD',
      country: req.body.country || 'India',
    },
    totalCapacity: Number(req.body.totalCapacity) || 100
  };

  console.log('📸 Upload check - req.file:', req.file);
  if (req.file?.path) body.bannerImage = req.file.path; // Cloudinary URL

  const event = await Event.create(body);
  res.status(201).json(new ApiResponse(201, event, 'Event created successfully'));
};

// ── GET /api/events ───────────────────────────────────────────────────────────
const getEvents = async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    city,
    status,
    startDate,
    endDate,
    search,
    sortBy = 'startDate',
    order = 'asc',
    organizer,
  } = req.query;

  const filter = {};

  // If filtering by organizer 'me', resolve to the logged-in user's id
  // and show ALL their events regardless of status
  if (organizer === 'me') {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    filter.organizer = req.user.id;
    // Do NOT apply a default status filter for the organizer's own events
  } else {
    // For the public listing, default to showing only published events
    filter.status = status || 'published';
  }

  if (category) filter.category = category;
  if (city)     filter['venue.city'] = { $regex: city, $options: 'i' };
  if (search)   filter.title = { $regex: search, $options: 'i' };
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate)   filter.startDate.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('organizer', 'name email avatar')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Event.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(200, {
      events,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Events fetched successfully')
  );
};

// ── GET /api/events/featured ──────────────────────────────────────────────────
const getFeaturedEvents = async (_req, res) => {
  const events = await Event.find({ isFeatured: true, status: 'published' })
    .populate('organizer', 'name email avatar')
    .sort({ startDate: 1 })
    .limit(8)
    .lean();

  res.json(new ApiResponse(200, events, 'Featured events fetched'));
};

// ── GET /api/events/:id ───────────────────────────────────────────────────────
const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'name email avatar');

  if (!event) throw new ApiError(404, 'Event not found');

  // Fetch tickets for this event
  const Ticket = require('../models/Ticket');
  const ticketTypes = await Ticket.find({ event: req.params.id }).lean();

  const eventData = {
    ...event.toObject(),
    ticketTypes
  };

  res.json(new ApiResponse(200, eventData, 'Event fetched successfully'));
};

// ── PUT /api/events/:id ───────────────────────────────────────────────────────
const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  // Only organizer who created it or admin can update
  if (
    event.organizer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to update this event');
  }

  if (req.file?.path) req.body.bannerImage = req.file.path;

  const updates = { ...req.body };
  if (req.body.venue || req.body.city) {
    updates.venue = {
      name: req.body.venueName || req.body.venue || event.venue.name,
      address: req.body.address || event.venue.address || 'TBD',
      city: req.body.city || event.venue.city || 'TBD',
      country: req.body.country || event.venue.country || 'India',
    };
  }
  if (req.body.totalCapacity) updates.totalCapacity = Number(req.body.totalCapacity);

  const updated = await Event.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('organizer', 'name email avatar');

  res.json(new ApiResponse(200, updated, 'Event updated successfully'));
};

// ── DELETE /api/events/:id ────────────────────────────────────────────────────
const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  if (
    event.organizer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to delete this event');
  }

  await event.deleteOne();
  res.json(new ApiResponse(200, null, 'Event deleted successfully'));
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
};
