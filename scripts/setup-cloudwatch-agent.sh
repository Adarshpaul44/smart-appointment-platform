#!/bin/bash
# ==============================================================================
# CloudWatch Agent Installation and Configuration Script for AWS EC2
# Project: Smart Appointment Platform
# Author: Adarsh Paul . T (24MIS0564) - Agile Development Process and DevOps
# ==============================================================================

set -e

echo "=========================================================================="
echo "📡 Installing and Configuring Amazon CloudWatch Agent on EC2"
echo "=========================================================================="

# 1. Update packages and install prerequisites
sudo apt-get update -y
sudo apt-get install -y wget curl unzip

# 2. Download and install Amazon CloudWatch Agent package for Ubuntu
ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ]; then
    DEB_URL="https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/arm64/latest/amazon-cloudwatch-agent.deb"
else
    DEB_URL="https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb"
fi

echo "Downloading CloudWatch Agent from: $DEB_URL"
wget -q "$DEB_URL" -O /tmp/amazon-cloudwatch-agent.deb
sudo dpkg -i -E /tmp/amazon-cloudwatch-agent.deb
rm -f /tmp/amazon-cloudwatch-agent.deb

# 3. Create log directory for application
sudo mkdir -p /var/log/smart-appointment
sudo chmod 755 /var/log/smart-appointment
sudo touch /var/log/smart-appointment/backend.log

# 4. Copy configuration file to CloudWatch directory
CONFIG_SOURCE="$(dirname "$0")/../amazon-cloudwatch-agent.json"
sudo cp "$CONFIG_SOURCE" /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# 5. Start and enable Amazon CloudWatch Agent
echo "Starting Amazon CloudWatch Agent service..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl status amazon-cloudwatch-agent --no-pager

echo "=========================================================================="
echo "✅ Amazon CloudWatch Agent successfully installed and running!"
echo "System metrics and logs are now streaming to CloudWatch."
echo "=========================================================================="
