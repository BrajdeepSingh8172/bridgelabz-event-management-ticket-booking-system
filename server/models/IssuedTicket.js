const mongoose = require('mongoose');

/**
 * IssuedTicket — one document per individual ticket issued to an attendee.
 * Distinct from the Ticket model (which tracks ticket-type pools / capacity).
 * Created during payment verification when a booking is confirmed.
 */
const issuedTicketSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Booking',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
    },
    /** Human-readable unique ID printed on the ticket (e.g. "EVT-a1b2c3d4") */
    ticketCode: {
      type:   String,
      unique: true,
      required: true,
    },
    /** JWT-signed compact token that gets encoded into the QR image */
    qrToken: {
      type:   String,
      unique: true,
      sparse: true,
    },
    /** Base64 data-URL of the QR code PNG (stored for email & profile display) */
    qrImage: {
      type: String,
    },
    /** Ticket tier name, e.g. "Early Bird", "VIP" */
    tierName: {
      type:    String,
      default: 'General',
      trim:    true,
    },
    /** Payment status — ticket is only valid for entry if 'completed' */
    paymentStatus: {
      type:    String,
      enum:    ['pending', 'completed', 'refunded', 'failed'],
      default: 'pending',
    },
    /** Entry validation state */
    isUsed:       { type: Boolean, default: false,  index: true },
    usedAt:       { type: Date,    default: null },
    usedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    scanAttempts: { type: Number,  default: 0 },
    scanLog: [
      {
        scannedAt: { type: Date },
        scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ipAddress: { type: String },
        result: {
          type: String,
          enum: ['valid', 'already_used', 'expired', 'invalid', 'unpaid'],
        },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

issuedTicketSchema.index({ booking: 1 });
issuedTicketSchema.index({ event:   1 });
issuedTicketSchema.index({ user:    1 });
// ticketCode index is implicit from unique:true on the field
issuedTicketSchema.index({ event: 1, isUsed: 1 });
issuedTicketSchema.index({ event: 1, scanAttempts: 1 }); // for fraud report

const IssuedTicket = mongoose.model('IssuedTicket', issuedTicketSchema);
module.exports = IssuedTicket;
