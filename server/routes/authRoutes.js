const express = require('express');
const passport = require('passport');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  refreshToken,
  googleCallback,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── Validation chains ─────────────────────────────────────────────────────────
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Google OAuth ──────────────────────────────────────────────────────────────
// GET /api/auth/google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
  googleCallback
);

// ── Email + Password ──────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, login);

// POST /api/auth/logout
router.post('/logout', verifyToken, logout);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

module.exports = router;
