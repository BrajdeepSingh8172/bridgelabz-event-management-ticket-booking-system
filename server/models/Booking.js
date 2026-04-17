const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketLineSchema = new mongoose.Schema(
  {
    ticket:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    quantity:  { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const attendeeInfoSchema = new mongoose.Schema(
  {
    name:  { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      unique: true,
      uppercase: true,
      // Auto-generated in pre-validate hook below
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    tickets: {
      type: [ticketLineSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one ticket line is required',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    qrCode: {
      type: String, // base64 PNG data URL
      default: null,
    },
    attendeeInfo: {
      type: attendeeInfoSchema,
      default: {},
    },

    // ── Cancellation & Refund Fields ────────────────────────────────────────────
    cancellationStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected'],
      default: 'none',
    },
    cancellationRequestedAt: { type: Date, default: null },
    cancellationReason:      { type: String, default: '' },
    cancellationApprovedAt:  { type: Date, default: null },
    cancellationApprovedBy:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    refundAmount:  { type: Number, default: 0 },
    refundPercent: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed'],
      default: 'none',
    },
    refundInitiatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ event: 1 });

// ── Auto-generate 8-char uppercase booking reference ──────────────────────────
bookingSchema.pre('validate', function (next) {
  if (!this.bookingRef) {
    this.bookingRef = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);// For testing purposes, we export the schema as well
module.exports = Booking;
