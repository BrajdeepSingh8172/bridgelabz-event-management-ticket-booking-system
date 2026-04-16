require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const { connectCloudinary } = require('./config/cloudinary');
connectCloudinary();

require('./config/passport'); // registers GoogleStrategy side-effects

const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const apiRouter = require('./routes/index');

const app = express();

// ── Security / Infra middleware ───────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Passport (strategy only — no sessions)
app.use(passport.initialize());

// Rate-limit all /api/* requests
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// Health-check
app.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() })
);

// 404 for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
