#!/bin/bash
# ==============================================================================
# AWS CloudWatch Alarms & Dashboard Provisioning Script
# Project: Smart Appointment Platform
# Author: Adarsh Paul . T (24MIS0564) - Agile Development Process & DevOps
# ==============================================================================

REGION=${AWS_REGION:-"ap-south-2"}
NAMESPACE="SmartAppointment/Application"

echo "=========================================================================="
echo "🚨 Provisioning Amazon CloudWatch Alarms and Operational Dashboard"
echo "Region: $REGION | Namespace: $NAMESPACE"
echo "=========================================================================="

# 1. Alarm: High HTTP 5xx Server Errors (SLA Violation)
echo "Creating Alarm: SmartAppointment-High5xxErrors..."
aws cloudwatch put-metric-alarm \
    --region "$REGION" \
    --alarm-name "SmartAppointment-High5xxErrors" \
    --alarm-description "Triggers when backend encounters 5 or more 5xx internal server errors within 5 minutes" \
    --metric-name "Http5xxErrors" \
    --namespace "$NAMESPACE" \
    --statistic "Sum" \
    --period 300 \
    --threshold 5 \
    --comparison-operator "GreaterThanOrEqualToThreshold" \
    --evaluation-periods 1 \
    --treat-missing-data "notBreaching"

# 2. Alarm: High API Latency (Performance Degraded)
echo "Creating Alarm: SmartAppointment-HighApiLatency..."
aws cloudwatch put-metric-alarm \
    --region "$REGION" \
    --alarm-name "SmartAppointment-HighApiLatency" \
    --alarm-description "Triggers when average API request response time exceeds 1000ms" \
    --metric-name "ApiLatency" \
    --namespace "$NAMESPACE" \
    --statistic "Average" \
    --period 300 \
    --threshold 1000 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --treat-missing-data "notBreaching"

# 3. Alarm: High EC2 Memory Utilization (from CloudWatch Agent)
echo "Creating Alarm: SmartAppointment-HighMemoryUtilization..."
aws cloudwatch put-metric-alarm \
    --region "$REGION" \
    --alarm-name "SmartAppointment-HighMemoryUtilization" \
    --alarm-description "Triggers when EC2 host memory exceeds 85%" \
    --metric-name "mem_used_percent" \
    --namespace "SmartAppointment/System" \
    --statistic "Average" \
    --period 300 \
    --threshold 85 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --treat-missing-data "missing"

# 4. Create CloudWatch Dashboard
echo "Creating CloudWatch Dashboard: SmartAppointment-DevOps-Console..."
DASHBOARD_BODY=$(cat <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "$NAMESPACE", "AppointmentsBooked", { "stat": "Sum", "label": "Bookings" } ],
          [ ".", "AppointmentsConfirmed", { "stat": "Sum", "label": "Confirmations" } ],
          [ ".", "AppointmentsCancelled", { "stat": "Sum", "label": "Cancellations" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "Appointment Lifecycle Telemetry (Real-Time)"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "$NAMESPACE", "ApiLatency", { "stat": "Average", "label": "Avg Latency (ms)" } ],
          [ ".", "ApiLatency", { "stat": "p95", "label": "p95 Latency (ms)" } ]
        ],
        "view": "timeSeries",
        "region": "$REGION",
        "title": "API Request Latency (Service Level Objective)"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "$NAMESPACE", "HighRiskAppointmentDetected", { "stat": "Sum", "label": "High-Risk Appointments" } ]
        ],
        "view": "timeSeries",
        "color": "#e53e3e",
        "region": "$REGION",
        "title": "No-Show Prevention - High Risk Flag Rate"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "$NAMESPACE", "Http5xxErrors", { "stat": "Sum", "label": "5xx Errors" } ]
        ],
        "view": "timeSeries",
        "color": "#d69e2e",
        "region": "$REGION",
        "title": "Application Errors (5xx Failures)"
      }
    }
  ]
}
EOF
)

aws cloudwatch put-dashboard \
    --region "$REGION" \
    --dashboard-name "SmartAppointment-DevOps-Console" \
    --dashboard-body "$DASHBOARD_BODY"

echo "=========================================================================="
echo "✅ CloudWatch Alarms and Operational Dashboard provisioned successfully!"
echo "=========================================================================="
