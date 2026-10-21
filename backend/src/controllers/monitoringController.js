/**
 * Monitoring and Health Check Controller
 * CloudWatch Metrics, System Health & Telemetry Reporting
 */

const db = require('../db');
const cloudwatchService = require('../services/cloudwatchService');

class MonitoringController {
  /**
   * Health check endpoint (for AWS ALB / Docker / Kubernetes healthchecks)
   * GET /api/health
   */
  static async getHealth(req, res) {
    let dbStatus = 'HEALTHY';
    let dbError = null;

    try {
      await db.query('SELECT 1');
    } catch (err) {
      dbStatus = 'DEGRADED';
      dbError = err.message;
    }

    const memory = process.memoryUsage();
    const uptime = Math.floor(process.uptime());

    const isHealthy = dbStatus === 'HEALTHY';

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'UP' : 'DOWN',
      service: 'smart-appointment-platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptime,
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
      database: {
        status: dbStatus,
        mode: db.isInMemory ? 'InMemory (Fallback Mode)' : 'PostgreSQL Database',
        error: dbError
      },
      system: {
        nodeVersion: process.version,
        memoryRssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024)
      },
      cloudwatch: {
        region: cloudwatchService.region,
        namespace: cloudwatchService.namespace,
        enabled: cloudwatchService.isEnabled
      }
    });
  }

  /**
   * Operational metrics endpoint
   * GET /api/metrics
   */
  static async getMetrics(req, res) {
    const telemetry = cloudwatchService.getTelemetryStatus();
    
    // Calculate appointment counts from DB
    let apptStats = { total: 0, booked: 0, confirmed: 0, cancelled: 0, completed: 0, highRisk: 0 };
    try {
      const resAppts = await db.query('SELECT status, risk_level FROM appointments');
      const rows = resAppts.rows || [];
      apptStats.total = rows.length;
      apptStats.booked = rows.filter(r => r.status === 'BOOKED').length;
      apptStats.confirmed = rows.filter(r => r.status === 'CONFIRMED').length;
      apptStats.cancelled = rows.filter(r => r.status === 'CANCELLED').length;
      apptStats.completed = rows.filter(r => r.status === 'COMPLETED').length;
      apptStats.highRisk = rows.filter(r => r.risk_level === 'HIGH').length;
    } catch (e) {
      // Ignore query errors in metrics aggregator
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      application: {
        service: 'smart-appointment-backend',
        environment: process.env.NODE_ENV || 'production'
      },
      telemetry: {
        http: telemetry.counters,
        appointmentMetrics: apptStats
      },
      system: telemetry.system,
      cloudwatch: telemetry.cloudwatch
    });
  }

  /**
   * Live telemetry feed for Admin Dashboard
   * GET /api/monitoring/stream
   */
  static async getTelemetryFeed(req, res) {
    const telemetry = cloudwatchService.getTelemetryStatus();
    return res.status(200).json({
      success: true,
      data: telemetry
    });
  }
}

module.exports = MonitoringController;
