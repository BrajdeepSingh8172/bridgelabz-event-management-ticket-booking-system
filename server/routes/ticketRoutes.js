const express = require('express');
const {
  createTicket,
  getTicketsByEvent,
  updateTicket,
  deleteTicket,
} = require('../controllers/ticketController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public — anyone can browse tickets for an event
router.get('/event/:eventId', getTicketsByEvent);

// Organizer / Admin protected
router.post('/',     verifyToken, requireRole('organizer', 'admin'), createTicket);
router.patch('/:id', verifyToken, requireRole('organizer', 'admin'), updateTicket);
router.delete('/:id',verifyToken, requireRole('organizer', 'admin'), deleteTicket);

module.exports = router;
