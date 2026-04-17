const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city:    { type: String, required: true, trim: true },
    state:   { type: String, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'conference',
        'concert',
        'festival',
        'sports',
        'workshop',
        'networking',
        'exhibition',
        'other',
      ],
    },
    bannerImage: {
      type: String,
      default: null,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    venue: {
      type: venueSchema,
      required: [true, 'Venue details are required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      // Not required — some events are single-day or open-ended
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'published',  // default published so events are immediately visible
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String, trim: true }],
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// ── Compound indexes for common filter queries ────────────────────────────────
eventSchema.index({ startDate: 1, category: 1, status: 1 });
eventSchema.index({ 'venue.city': 1 });
eventSchema.index({ isFeatured: 1 });
eventSchema.index({ organizer: 1 });

const Event = mongoose.model('Event', eventSchema);// For testing purposes, we export the schema as well
module.exports = Event;
