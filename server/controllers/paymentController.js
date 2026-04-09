const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const getRazorpayInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// ── POST /api/payments/create-order ──────────────────────────────────────────
const createOrder = async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.user.toString() !== req.user.id)
    throw new ApiError(403, 'Not authorized');

  if (booking.status !== 'pending')
    throw new ApiError(400, `Booking is already ${booking.status}`);

  const razorpay = getRazorpayInstance();

  const order = await razorpay.orders.create({
    amount: Math.round(booking.totalAmount * 100), // paise
    currency: 'INR',
    receipt: booking.bookingRef,
    notes: { bookingId: booking._id.toString(), userId: req.user.id },
  });

  // Persist payment record in pending state
  const payment = await Payment.create({
    booking: booking._id,
    user: req.user.id,
    razorpayOrderId: order.id,
    amount: booking.totalAmount,
    currency: 'INR',
    status: 'pending',
  });

  booking.paymentId = payment._id;
  await booking.save();

  res.status(201).json(
    new ApiResponse(201, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingRef: booking.bookingRef,
      paymentId: payment._id,
    }, 'Razorpay order created')
  );
};

// ── POST /api/payments/verify ─────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

  // ── Validate Razorpay signature ───────────────────────────────────────────
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, 'Payment signature verification failed');
  }

  // ── Update payment record ─────────────────────────────────────────────────
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'completed',
    },
    { new: true }
  );

  if (!payment) throw new ApiError(404, 'Payment record not found');

  // ── Confirm booking ───────────────────────────────────────────────────────
  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: 'confirmed' },
    { new: true }
  );

  if (!booking) throw new ApiError(404, 'Booking not found');

  res.json(new ApiResponse(200, { payment, booking }, 'Payment verified and booking confirmed'));
};

// ── GET /api/payments/:id ─────────────────────────────────────────────────────
const getPaymentById = async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('booking', 'bookingRef status totalAmount')
    .populate('user', 'name email');

  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin')
    throw new ApiError(403, 'Not authorized to view this payment');

  res.json(new ApiResponse(200, payment, 'Payment details fetched'));
};

module.exports = { createOrder, verifyPayment, getPaymentById };
