const express = require('express');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All booking routes require authentication
router.use(verifyToken);

router.post('/',               createBooking);
router.get('/my',              getUserBookings);
router.get('/:id',             getBookingById);
router.patch('/:id/cancel',    cancelBooking);

module.exports = router;
