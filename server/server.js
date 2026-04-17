require('dotenv').config();
require('express-async-errors');

const http = require('http');
const { Server: SocketServer } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 5000;

// HTTP server
const httpServer = http.createServer(app);

// Socket.IO setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('joinEvent', (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`Socket ${socket.id} joined event:${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// attach io
app.set('io', io);

// start server
const start = async () => {
  await connectDB();

  try {
    connectRedis();
  } catch (err) {
    console.log("Redis not connected (optional)");
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
};

start();

// graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received — shutting down');
  httpServer.close(() => process.exit(0));
});