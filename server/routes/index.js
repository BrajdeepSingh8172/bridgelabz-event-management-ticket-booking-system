const express = require('express');

const authRoutes    = require('./authRoutes');
const eventRoutes   = require('./eventRoutes');
const ticketRoutes  = require('./ticketRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const userRoutes    = require('./userRoutes');

const router = express.Router();

router.use('/auth',     authRoutes);
router.use('/events',   eventRoutes);
router.use('/tickets',  ticketRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/users',    userRoutes);

module.exports = router;
