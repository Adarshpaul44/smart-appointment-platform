/**
 * CloudWatch Telemetry & Metrics Service
 * Smart Appointment Optimization & No-Show Prevention Platform
 * Academic Context: Agile Development Process & DevOps (Adarsh Paul . T - 24MIS0564)
 */

const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } = require('@aws-sdk/client-cloudwatch-logs');

class CloudWatchService {
  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-2';
    this.namespace = 'SmartAppointment/Application';
    this.logGroupName = '/aws/smart-appointment/backend';
    this.logStreamName = 'api-runtime';
    this.isEnabled = process.env.ENABLE_CLOUDWATCH === 'true' && !!process.env.AWS_ACCESS_KEY_ID;

    // Rolling telemetry buffers for local UI monitoring & Prometheus-style endpoints
    this.recentMetrics = [];
    this.recentLogs = [];
    this.metricCounters = {
      totalRequests: 0,
      totalBookings: 0,
      totalConfirmations: 0,
      totalCancellations: 0,
      highRiskFlags: 0,
      errors4xx: 0,
      errors5xx: 0,
      averageLatencyMs: 0,
      latencySum: 0,
      latencyCount: 0
    };

    if (this.isEnabled) {
      try {
        this.cwClient = new CloudWatchClient({ region: this.region });
        this.logsClient = new CloudWatchLogsClient({ region: this.region });
        console.log(`📡 [CLOUDWATCH] Initialized in AWS region: ${this.region}`);
      } catch (err) {
        console.warn(`⚠️ [CLOUDWATCH] Initialization warning: ${err.message}. Operating in local buffer mode.`);
        this.isEnabled = false;
      }
    } else {
      console.log(`📊 [MONITORING] Running in Telemetry Dry-Run/DevOps mode (Region: ${this.region})`);
    }
  }

  /**
   * Publish a custom metric to Amazon CloudWatch and local telemetry buffer
   */
  async putMetric(metricName, value, unit = 'Count', dimensions = []) {
    const timestamp = new Date();
    const metricRecord = {
      MetricName: metricName,
      Value: Number(value),
      Unit: unit,
      Timestamp: timestamp.toISOString(),
      Dimensions: dimensions
    };

    // Keep last 60 metric data points in-memory for the Admin Monitoring Console
    this.recentMetrics.unshift(metricRecord);
    if (this.recentMetrics.length > 60) this.recentMetrics.pop();

    if (!this.isEnabled || !this.cwClient) {
      return { status: 'buffered_locally', metric: metricRecord };
    }

    try {
      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: metricName,
            Value: Number(value),
            Unit: unit,
            Timestamp: timestamp,
            Dimensions: dimensions.map(d => ({ Name: d.name, Value: String(d.value) }))
          }
        ]
      });

      await this.cwClient.send(command);
      return { status: 'published_aws', metric: metricRecord };
    } catch (error) {
      // Graceful degradation: never crash app if cloud metrics fail
      console.warn(`[CLOUDWATCH] Metric publication failed (${metricName}):`, error.message);
      return { status: 'failed_aws_buffered', error: error.message };
    }
  }

  /**
   * Publish structured application log event to CloudWatch Logs
   */
  async logEvent(level, message, metadata = {}) {
    const timestamp = new Date();
    const entry = {
      timestamp: timestamp.toISOString(),
      epoch: timestamp.getTime(),
      level: level.toUpperCase(),
      message,
      metadata
    };

    // In-memory rolling buffer for admin monitoring UI
    this.recentLogs.unshift(entry);
    if (this.recentLogs.length > 100) this.recentLogs.pop();

    if (!this.isEnabled || !this.logsClient) {
      return;
    }

    try {
      const command = new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [
          {
            timestamp: entry.epoch,
            message: JSON.stringify({ level: entry.level, message: entry.message, metadata: entry.metadata })
          }
        ]
      });
      await this.logsClient.send(command);
    } catch (err) {
      // In development or if log group isn't created yet, suppress CloudWatch write exceptions
    }
  }

  /**
   * Telemetry tracker for HTTP requests
   */
  recordHttpRequest(method, route, statusCode, durationMs) {
    this.metricCounters.totalRequests++;
    this.metricCounters.latencySum += durationMs;
    this.metricCounters.latencyCount++;
    this.metricCounters.averageLatencyMs = Math.round(this.metricCounters.latencySum / this.metricCounters.latencyCount);

    if (statusCode >= 500) {
      this.metricCounters.errors5xx++;
      this.putMetric('Http5xxErrors', 1, 'Count', [{ name: 'Route', value: route }]);
    } else if (statusCode >= 400) {
      this.metricCounters.errors4xx++;
    }

    this.putMetric('ApiLatency', durationMs, 'Milliseconds', [
      { name: 'Route', value: route },
      { name: 'Method', value: method }
    ]);
  }

  recordBooking(serviceType) {
    this.metricCounters.totalBookings++;
    this.putMetric('AppointmentsBooked', 1, 'Count', [{ name: 'ServiceType', value: serviceType }]);
    this.logEvent('INFO', `New appointment booked for ${serviceType}`, { serviceType });
  }

  recordConfirmation() {
    this.metricCounters.totalConfirmations++;
    this.putMetric('AppointmentsConfirmed', 1, 'Count');
    this.logEvent('INFO', 'Customer confirmed appointment attendance');
  }

  recordCancellation(reason = 'Customer Requested') {
    this.metricCounters.totalCancellations++;
    this.putMetric('AppointmentsCancelled', 1, 'Count');
    this.logEvent('WARN', 'Appointment cancelled and slot released', { reason });
  }

  recordRiskScore(score, riskLevel) {
    this.putMetric('RiskScoreCalculated', score, 'None');
    if (riskLevel === 'HIGH') {
      this.metricCounters.highRiskFlags++;
      this.putMetric('HighRiskAppointmentDetected', 1, 'Count');
      this.logEvent('WARN', `High-Risk Appointment Detected (Score: ${score})`, { score, riskLevel });
    }
  }

  /**
   * Returns current health, telemetry counters, and live buffer
   */
  getTelemetryStatus() {
    const memory = process.memoryUsage();
    return {
      service: 'smart-appointment-backend',
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      cloudwatch: {
        enabled: this.isEnabled,
        region: this.region,
        namespace: this.namespace,
        logGroup: this.logGroupName
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: {
          rssMb: Math.round(memory.rss / 1024 / 1024),
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024)
        }
      },
      counters: this.metricCounters,
      recentMetrics: this.recentMetrics.slice(0, 15),
      recentLogs: this.recentLogs.slice(0, 20)
    };
  }
}

// Export singleton instance
module.exports = new CloudWatchService();
