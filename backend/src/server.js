/**
 * Smart Appointment Platform - Express Backend Server
 * Student: Adarsh Paul . T (24MIS0564)
 * Subject: Agile Development Process and DevOps
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const requestLogger = require('./middleware/requestLogger');
const AutomationService = require('./services/automationService');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const riskRoutes = require('./routes/riskRoutes');
const automationRoutes = require('./routes/automationRoutes');
const monitoringRoutes = require('./routes/monitoring');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend during development
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(requestLogger);

// Health Check & CloudWatch Monitoring Routes
app.use('/api', monitoringRoutes);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/automation', automationRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start Server Function
async function startServer() {
  try {
    // 1. Initialize Database
    await db.initDb();

    // 2. Start Automation Scheduler (runs every 5 mins or as configured)
    if (process.env.NODE_ENV !== 'test') {
      const interval = Number(process.env.REMINDER_CHECK_INTERVAL_MINUTES) || 5;
      AutomationService.startScheduler(interval);
    }

    // 3. Listen on PORT
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 Smart Appointment Backend Server running on port ${PORT}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
        console.log(`👥 Author: Adarsh Paul . T (24MIS0564)`);
        console.log(`======================================================\n`);
      });
    }
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
