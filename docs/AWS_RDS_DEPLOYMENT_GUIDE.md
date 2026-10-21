# AWS Cloud Deployment & Amazon RDS PostgreSQL Integration Guide

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Target Cloud:** Amazon Web Services (AWS)  
**Database Service:** Amazon Relational Database Service (RDS) for PostgreSQL  
**Compute Service:** Amazon Elastic Compute Cloud (EC2) with Docker Compose  
**Student:** Adarsh Paul . T (24MIS0564)  
**Subject:** Agile Development Process and DevOps  

---

## 1. Cloud Architecture Overview

The platform uses an industry-standard, decoupled AWS Free Tier architecture:
- **Compute Layer:** Amazon EC2 (`t3.micro` or `t2.micro` running Ubuntu 24.04 LTS), hosting Dockerized Frontend (React on Nginx :80) and Backend (Node.js/Express API :5000).
- **Database Layer:** Amazon RDS for PostgreSQL (`db.t3.micro` / `db.t4g.micro`), managed relational storage with automated backup and encryption.
- **Observability:** Health check endpoint (`/api/health`), request logging, and CloudWatch metrics.

---

## 2. Environment Variables & Security Isolation

All database credentials, endpoints, and secrets are strictly loaded via environment variables (`backend/.env`). No secrets or `.pem` keys are tracked in Git.

| Variable | Required | Example | Purpose |
|---|:---:|---|---|
| `DATABASE_URL` | Yes (or discrete) | `postgresql://postgres:Password123!@appointment-rds-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/appointment_db` | Connection string to RDS |
| `DB_HOST` | Alternative | `appointment-rds-db.xxxxxx.us-east-1.rds.amazonaws.com` | RDS Endpoint |
| `DB_PORT` | Alternative | `5432` | RDS PostgreSQL Port |
| `DB_NAME` | Alternative | `appointment_db` | Initial Database Name |
| `DB_USER` | Alternative | `postgres` | RDS Master Username |
| `DB_PASSWORD` | Alternative | `Password123!` | RDS Master Password |
| `DB_SSL` | Optional | `true` | Enforces SSL (auto-enabled when `rds.amazonaws.com` detected) |
| `DB_TIMEOUT_MS` | Optional | `10000` | Connection timeout in ms (default 10s for RDS) |
| `NOTIFICATION_PROVIDER` | Optional | `mock` | `mock` for zero-cost demo or `aws` for SNS/SES |
| `JWT_SECRET` | Yes | `<random-secret>` | Secret for signing JWT tokens |

---

## 3. Resilient In-Memory Dual-Mode Engine

The backend database layer (`backend/src/db/index.js`) supports dual-mode operation:
- **Amazon RDS Mode:** When connected to an active RDS instance, it verifies the connection with SSL, applies schema idempotently (`CREATE TABLE IF NOT EXISTS`), and automatically seeds initial accounts and slots if the database is newly initialized.
- **In-Memory Fallback Mode:** When RDS is not configured or offline, it activates the in-memory transactional store with realistic demo data so the app can be run locally anytime.

---

## 4. Step-by-Step Instructions: Once You Have an Authorized AWS Account

### Step 1: Provision Amazon RDS PostgreSQL Database
1. Open **AWS Management Console** $\rightarrow$ Navigate to **RDS** $\rightarrow$ **Databases** $\rightarrow$ **Create database**.
2. Select **Standard create** $\rightarrow$ **PostgreSQL** (version 15.x or 16.x).
3. Select **Free tier** template (locks instance type to `db.t3.micro`).
4. Settings:
   - **DB instance identifier:** `appointment-rds-db`
   - **Master username:** `postgres`
   - **Master password:** Set your password (e.g., `AppointmentPass2026!`).
5. Storage: 20 GiB gp3 (within Free Tier limits), disable storage autoscaling.
6. Connectivity:
   - **Public access:** Select **Yes** (to allow direct testing from laptop or EC2).
   - **VPC security group:** Select **Create new** $\rightarrow$ name it `rds-appointment-sg`.
7. Additional configuration:
   - **Initial database name:** `appointment_db`.
8. Click **Create database**. Once available, copy the **Endpoint** URL.

### Step 2: Configure VPC Security Groups
1. Go to **AWS Console > EC2 > Security Groups**.
2. Open `rds-appointment-sg`:
   - Add Inbound Rule: Type: **PostgreSQL (5432)** $\rightarrow$ Source: **My IP** (and the EC2 Security Group).
3. Create `ec2-appointment-sg`:
   - Inbound Rules:
     - SSH (Port 22) $\rightarrow$ Source: My IP
     - HTTP (Port 80) $\rightarrow$ Source: Anywhere-IPv4 (`0.0.0.0/0`)
     - Custom TCP (Port 3000) $\rightarrow$ Source: Anywhere-IPv4 (`0.0.0.0/0`)
     - Custom TCP (Port 5000) $\rightarrow$ Source: Anywhere-IPv4 (`0.0.0.0/0`)

### Step 3: Fast Laptop Verification with Live RDS
1. Set in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:AppointmentPass2026!@<YOUR-RDS-ENDPOINT>:5432/appointment_db
   DB_SSL=true
   ```
2. Run `node src/server.js` in `backend/`.
3. Check `http://localhost:5000/api/health` $\rightarrow$ `"databaseFallback": false`.

### Step 4: Launch Amazon EC2 Instance
1. Go to **AWS Console > EC2 > Launch instances**.
2. Name: `smart-appointment-app-server`.
3. OS: **Ubuntu Server 24.04 LTS (x86_64)**.
4. Instance type: `t3.micro` or `t2.micro` (Free tier).
5. Key pair: Create and download `appointment-key.pem`.
6. Security group: Select `ec2-appointment-sg`.
7. Launch and copy Public IP address.

### Step 5: Deploy via Docker Compose on EC2
SSH into the EC2 instance:
```bash
ssh -i "appointment-key.pem" ubuntu@<EC2-PUBLIC-IP>
```
Run inside EC2:
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu
newgrp docker

git clone https://github.com/adarshpaul/smart-appointment-platform.git
cd smart-appointment-platform

cat <<EOF > backend/.env
NODE_ENV=production
PORT=5000
JWT_SECRET=super_secret_jwt_production_key_2026
DATABASE_URL=postgresql://postgres:AppointmentPass2026!@<YOUR-RDS-ENDPOINT>:5432/appointment_db
DB_SSL=true
NOTIFICATION_PROVIDER=mock
REMINDER_CHECK_INTERVAL_MINUTES=5
EOF

docker compose -f docker-compose.prod.yml up -d --build
```
Open `http://<EC2-PUBLIC-IP>` to view the live running application!

---

## 5. CI/CD Automated Deployment

In your GitHub repository **Settings > Secrets and variables > Actions**, add:
- `EC2_HOST`: `<EC2-PUBLIC-IP>`
- `EC2_USER`: `ubuntu`
- `EC2_SSH_KEY`: Content of `appointment-key.pem`
- `AWS_REGION`: `us-east-1`

Every push to `main` will automatically test the application, build Docker images, and deploy to your EC2 instance.
