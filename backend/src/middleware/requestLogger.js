/**
 * CloudWatch-Ready Structured Request Logger
 * 
 * Logs API requests and responses with latency, status code,
 * and user context for local console and AWS CloudWatch ingestion.
 */

const cloudwatchService = require('../services/cloudwatchService');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      userId: req.user ? req.user.id : null,
      ip: req.ip || req.connection.remoteAddress
    };

    const statusBadge = res.statusCode >= 400 ? '❌' : '✅';
    console.log(
      `${statusBadge} [HTTP] ${logEntry.method} ${logEntry.url} ${logEntry.status} - ${logEntry.durationMs}ms (User: ${logEntry.userId || 'anon'})`
    );

    // Stream latency and error telemetry to CloudWatch
    cloudwatchService.recordHttpRequest(req.method, req.originalUrl || req.url, res.statusCode, duration);
  });

  next();
}

module.exports = requestLogger;
