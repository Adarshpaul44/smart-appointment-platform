# ==============================================================================
# AWS CloudWatch Alarms & Dashboard Provisioning Script (PowerShell)
# Project: Smart Appointment Platform
# Author: Adarsh Paul . T (24MIS0564) - Agile Development Process & DevOps
# ==============================================================================

param(
    [string]$Region = "ap-south-2",
    [string]$Profile = "devops-agent"
)

$Namespace = "SmartAppointment/Application"
$AwsCli = "C:\Users\T Adarsh Paul\AppData\Local\Programs\Amazon\AWSCLIV2\aws.exe"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "🚨 Provisioning Amazon CloudWatch Alarms and Operational Dashboard" -ForegroundColor Cyan
Write-Host "Region: $Region | Profile: $Profile | Namespace: $Namespace" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Alarm: High 5xx Server Errors
Write-Host "Creating Alarm: SmartAppointment-High5xxErrors..." -ForegroundColor Yellow
& $AwsCli cloudwatch put-metric-alarm `
    --profile $Profile `
    --region $Region `
    --alarm-name "SmartAppointment-High5xxErrors" `
    --alarm-description "Triggers when backend encounters 5 or more 5xx internal server errors within 5 minutes" `
    --metric-name "Http5xxErrors" `
    --namespace $Namespace `
    --statistic "Sum" `
    --period 300 `
    --threshold 5 `
    --comparison-operator "GreaterThanOrEqualToThreshold" `
    --evaluation-periods 1 `
    --treat-missing-data "notBreaching"

# 2. Alarm: High API Latency
Write-Host "Creating Alarm: SmartAppointment-HighApiLatency..." -ForegroundColor Yellow
& $AwsCli cloudwatch put-metric-alarm `
    --profile $Profile `
    --region $Region `
    --alarm-name "SmartAppointment-HighApiLatency" `
    --alarm-description "Triggers when average API request response time exceeds 1000ms" `
    --metric-name "ApiLatency" `
    --namespace $Namespace `
    --statistic "Average" `
    --period 300 `
    --threshold 1000 `
    --comparison-operator "GreaterThanThreshold" `
    --evaluation-periods 2 `
    --treat-missing-data "notBreaching"

Write-Host "==========================================================================" -ForegroundColor Green
Write-Host "✅ CloudWatch Alarms commands generated and provisioned." -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
