const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
} = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { uploadEventBanner } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/',          getEvents);
router.get('/featured',  getFeaturedEvents);
router.get('/:id',       getEventById);

// Organizer / Admin protected
router.post(
  '/',
  verifyToken,
  requireRole('organizer', 'admin'),
  uploadEventBanner,
  createEvent
);

router.put(
  '/:id',
  verifyToken,
  requireRole('organizer', 'admin'),
  uploadEventBanner,
  updateEvent
);

router.delete('/:id', verifyToken, requireRole('organizer', 'admin'), deleteEvent);

module.exports = router;
