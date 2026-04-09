const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ── POST /api/events ──────────────────────────────────────────────────────────
const createEvent = async (req, res) => {
  const body = { ...req.body, organizer: req.user.id };

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
    status = 'published',
    startDate,
    endDate,
    search,
    sortBy = 'startDate',
    order = 'asc',
  } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (status)   filter.status = status;
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
  res.json(new ApiResponse(200, event, 'Event fetched successfully'));
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

  const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
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
