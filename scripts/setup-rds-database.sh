#!/bin/bash
# ==============================================================================
# Amazon RDS PostgreSQL Automated Setup Script (Bash)
# Project: Smart Appointment Platform
# Author: Adarsh Paul . T (24MIS0564) - Agile Development Process & DevOps
# ==============================================================================

set -e

REGION=${AWS_REGION:-"ap-south-2"}
PROFILE=${AWS_PROFILE:-"devops-agent"}
DB_IDENTIFIER="smart-appointment-db"
MASTER_USER="postgres"
MASTER_PASSWORD="SmartAppointment2026!"
DB_NAME="appointment_db"

echo "=========================================================================="
echo "🚀 Automated Amazon RDS PostgreSQL Provisioning Pipeline"
echo "Region: $REGION | DB Identifier: $DB_IDENTIFIER"
echo "=========================================================================="

# 1. Provision RDS Instance
echo "Creating Amazon RDS instance: $DB_IDENTIFIER..."
aws rds create-db-instance \
    --profile "$PROFILE" \
    --region "$REGION" \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version "16.3" \
    --master-username "$MASTER_USER" \
    --master-user-password "$MASTER_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --publicly-accessible \
    --db-name "$DB_NAME" \
    --backup-retention-period 1 \
    --no-multi-az || true

echo "Waiting for RDS instance to become available..."
aws rds wait db-instance-available --profile "$PROFILE" --region "$REGION" --db-instance-identifier "$DB_IDENTIFIER"

ENDPOINT=$(aws rds describe-db-instances --profile "$PROFILE" --region "$REGION" --db-instance-identifier "$DB_IDENTIFIER" --query "DBInstances[0].Endpoint.Address" --output text)
echo "RDS Endpoint: $ENDPOINT"

# Write backend/.env
cat <<EOF > backend/.env
PORT=5000
NODE_ENV=development
JWT_SECRET=adarsh_college_project_secret_2026_dev
DATABASE_URL=postgresql://${MASTER_USER}:${MASTER_PASSWORD}@${ENDPOINT}:5432/${DB_NAME}?sslmode=require
DB_HOST=${ENDPOINT}
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${MASTER_USER}
DB_PASSWORD=${MASTER_PASSWORD}
DB_SSL=true
ENABLE_CLOUDWATCH=false
AWS_REGION=${REGION}
EOF

echo "=========================================================================="
echo "✅ RDS PostgreSQL Database setup is complete!"
echo "=========================================================================="
