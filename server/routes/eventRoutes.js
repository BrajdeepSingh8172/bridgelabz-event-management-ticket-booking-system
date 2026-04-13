const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
} = require('../controllers/eventController');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');
const { uploadEventBanner } = require('../middleware/upload');

const router = express.Router();

// Public routes (optionalAuth so organizer=me still works when logged in)
router.get('/',          optionalAuth, getEvents);
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
