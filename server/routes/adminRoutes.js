const express = require('express');
const { getAdminStats } = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(verifyToken, requireRole('admin'));

router.get('/stats', getAdminStats);

module.exports = router;
