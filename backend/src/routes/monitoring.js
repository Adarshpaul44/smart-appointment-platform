/**
 * Monitoring Routes
 * Endpoints for health checks, CloudWatch telemetry, and system metrics
 */

const express = require('express');
const router = express.Router();
const MonitoringController = require('../controllers/monitoringController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public health check and Prometheus/CloudWatch metrics (unauthenticated for ALB / Prometheus scraping)
router.get('/health', MonitoringController.getHealth);
router.get('/metrics', MonitoringController.getMetrics);

// Protected telemetry stream for Admin Dashboard
router.get('/monitoring/stream', authenticateToken, requireAdmin, MonitoringController.getTelemetryFeed);

module.exports = router;
