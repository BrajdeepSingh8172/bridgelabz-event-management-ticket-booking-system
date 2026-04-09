require('dotenv').config();
require('express-async-errors');

const http = require('http');
const { Server: SocketServer } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 5000;

// ── HTTP server + Socket.IO ───────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`🔌  Socket connected: ${socket.id}`);

  socket.on('joinEvent', (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`   Socket ${socket.id} joined room event:${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌  Socket disconnected: ${socket.id}`);
  });
});

// Attach io instance to app so controllers can emit events
app.set('io', io);

// ── Bootstrap ────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  connectRedis(); // non-blocking — server starts even if Redis is down

  httpServer.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
  });
};

start();

// ── Graceful shutdown ────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('💥  Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋  SIGTERM received — shutting down gracefully');
  httpServer.close(() => process.exit(0));
});
