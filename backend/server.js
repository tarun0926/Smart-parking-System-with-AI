import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Explicitly allow Vite dev-server origin so the browser does not get blocked
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'Operational',
    message: 'SmartPark AI REST API Server',
    version: '1.0.0',
    dbStatus: states[mongoose.connection.readyState] || 'unknown',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `API Endpoint Not Found - ${req.originalUrl}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('[Server] Starting SmartPark AI backend...');

  // Start listening first — health-check is available immediately
  await new Promise((resolve) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] ✅ Express server running on http://127.0.0.1:${PORT} and http://localhost:${PORT}`);
      resolve();
    });
  });

  // Now connect to DB — this may take a moment if MongoMemoryServer downloads binaries
  console.log('[Server] Connecting to database...');
  await connectDB();
  console.log('[Server] ✅ All systems operational. Register/Login APIs ready.');
};

startServer().catch((err) => {
  console.error('[Server] FATAL startup error:', err);
  process.exit(1);
});
