# AWS Cloud Deployment & Infrastructure Guide

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Author:** Adarsh Paul . T (24MIS0564)  
**Target Cloud:** Amazon Web Services (AWS)  

---

## 1. Cloud Architecture Blueprint

The platform is designed to be deployed across standard AWS Managed Services to achieve high availability, reliability, and security:

```
                      +------------------------------------------+
                      |               AWS Cloud                  |
                      |                                          |
                      |    [ Route 53 (DNS) ]                    |
                      |            |                             |
                      |            v                             |
                      |    [ Amazon CloudFront (CDN) ]           |
                      |            |                             |
                      |            v                             |
                      |    +-------------------------------+     |
                      |    |   Amazon EC2 (t3.micro/small) |     |
                      |    |   - Docker Container Frontend |     |
                      |    |     (React on Nginx :80)      |     |
                      |    |   - Docker Container Backend  |     |
                      |    |     (Node/Express API :5000)  |     |
                      |    +---------------+---------------+     |
                      |                    |                     |
                      |      +-------------+-------------+       |
                      |      |                           |       |
                      |      v                           v       |
                      | [ Amazon RDS ]             [ Amazon SNS/SES ]
                      | PostgreSQL 15              Automated Reminders
                      | Multi-AZ Relational        SMS & Email Alerts
                      |                                          |
                      |            |                             |
                      |            v                             |
                      | [ Amazon CloudWatch ]                    |
                      | Logs, Alarms & Metrics                   |
                      +------------------------------------------+
```

---

## 2. AWS Services Breakdown & Purpose

| Service | Role in Platform | Justification |
|---|---|---|
| **Amazon EC2** | Application Compute Host | Hosts Dockerized Frontend and Backend containers orchestrated via `docker-compose`. |
| **Amazon RDS (PostgreSQL)** | Managed Database | Provides automated daily backups, high-availability replication, and persistent data storage. |
| **Amazon S3** | Object Storage | Stores static assets, practitioner profile imagery, and exported audit reports. |
| **Amazon SNS & SES** | Multi-Channel Notifications | Dispatches SMS reminders via Amazon SNS and email confirmations via Amazon SES. |
| **Amazon CloudWatch** | Monitoring & Observability | Collects application access logs, server metrics (CPU, RAM), and alert triggers for unhandled errors. |
| **AWS IAM** | Identity & Access Management | Enforces principle of least privilege for EC2 service roles and CI/CD deployment tokens. |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Provision Amazon RDS PostgreSQL
1. Navigate to **AWS Console > RDS > Databases > Create Database**.
2. Select **PostgreSQL 15**, Free Tier / Dev template (`db.t3.micro`).
3. Set Database Identifier: `appointment-rds-db`.
4. Set Master Username: `postgres`, Master Password: `StrongProductionPassword123!`.
5. Under Connectivity, attach to Default VPC and configure a Security Group allowing inbound traffic on Port `5432` from your EC2 Security Group only.
6. Note the Endpoint URL: `appointment-rds-db.xxxxxx.us-east-1.rds.amazonaws.com`.

### Step 2: Provision Amazon EC2 Instance
1. Navigate to **AWS Console > EC2 > Launch Instance**.
2. Name: `smart-appointment-app-server`.
3. OS: **Ubuntu Server 24.04 LTS (x86_64)**, Instance Type: `t3.micro` or `t3.small`.
4. Key Pair: Select or generate your `.pem` key pair for SSH access.
5. Configure Security Group Rules:
   - Inbound `SSH` (Port 22) - Restrict to your IP.
   - Inbound `HTTP` (Port 80) - Allow from anywhere (`0.0.0.0/0`).
   - Inbound `HTTPS` (Port 443) - Allow from anywhere (`0.0.0.0/0`).
   - Inbound `Custom TCP` (Port 3000 & 5000) - For testing/direct access.

### Step 3: Configure EC2 Server Environment
SSH into the EC2 instance:
```bash
ssh -i "your-key.pem" ubuntu@ec2-your-instance-ip.compute-1.amazonaws.com

# Update package repository
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker & Docker Compose Plugin
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker

# Verify Docker installation
docker --version
docker compose version
```

### Step 4: Clone Codebase & Configure Environment Variables
```bash
# Clone Git repository
git clone https://github.com/adarshpaul/smart-appointment-platform.git
cd smart-appointment-platform

# Create production .env file
cat <<EOF > backend/.env
NODE_ENV=production
PORT=5000
JWT_SECRET=super_secret_jwt_production_key_2026
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://postgres:StrongProductionPassword123!@appointment-rds-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/appointment_db
NOTIFICATION_PROVIDER=mock
REMINDER_CHECK_INTERVAL_MINUTES=5
EOF
```

### Step 5: Launch Containers via Docker Compose
```bash
# Build and run containers in detached background mode
docker compose up -d --build

# Verify running containers
docker ps
```

### Step 6: Verify Deployment & CloudWatch Health Check
1. Open your browser and navigate to `http://<EC2-PUBLIC-IP>:3000`.
2. Check backend healthcheck at `http://<EC2-PUBLIC-IP>:5000/api/health`.
3. Response:
   ```json
   {
     "status": "HEALTHY",
     "service": "Smart Appointment Optimization & No-Show Prevention Platform API",
     "student": "Adarsh Paul . T (24MIS0564)",
     "uptimeSeconds": 142
   }
   ```
