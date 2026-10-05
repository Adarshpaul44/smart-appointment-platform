# Smart Appointment Optimization & No-Show Prevention Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)](https://www.docker.com/)
[![AWS Ready](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS%20%7C%20CloudWatch-FF9900.svg)](https://aws.amazon.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)](https://github.com/features/actions)

---

### Academic Information
- **Student Name:** Adarsh Paul . T
- **Registration Number:** 24MIS0564
- **Subject:** Agile Development Process and DevOps
- **Project Type:** Software-only Cloud-Based Web Application

---

## 1. Project Purpose & Solution Concept

### Problem
Service businesses (clinics, salons, consultants, diagnostic labs) frequently suffer from **no-show rates between 15% and 30%**. When clients forget or abandon appointments without notice, staff sits idle, revenue is forfeited, and urgent patients on waitlists are turned away.

### Solution
This platform goes beyond a simple appointment booking website. It integrates:
- **Appointment Management** (real-time slot reservation with double-booking prevention)
- **Explainable Rule-Based No-Show Risk Scoring** (0–100 score with human-readable rationale)
- **Multi-Tier Background Automation** (scheduled 24h & 2h reminders, unconfirmed high-risk follow-up alerts)
- **Instant Slot Recovery** (cancelled appointments immediately release their slots for other users)
- **Executive Operational Analytics** (KPIs, no-show rates, confirmation rates, and customer attendance profiles)
- **DevOps & Cloud Deployment** (Docker, GitHub Actions CI/CD pipeline, and AWS architecture)

---

## 2. System Architecture

```
                      +------------------------------------+
                      |     Client Layer (React.js SPA)     |
                      |     - Customer Dashboard           |
                      |     - Admin Operational Center     |
                      |     - Interactive Risk Simulator   |
                      +-----------------+------------------+
                                        | HTTP / Port 3000
                                        v
                      +-----------------+------------------+
                      |   Reverse Proxy (Nginx Container)  |
                      +-----------------+------------------+
                                        | /api Reverse Proxy
                                        v
                      +-----------------+------------------+
                      |    API Layer (Node/Express API)    |
                      |    - JWT Auth & RBAC               |
                      |    - Explainable Risk Engine       |
                      |    - Multi-Tier Automation Service |
                      +--------+------------------+--------+
                               |                  |
           SQL Queries / Pool  |                  | Logs & Metrics
                               v                  v
                 +-------------+----+      +------+---------------+
                 | PostgreSQL DB    |      | Amazon CloudWatch    |
                 | (Docker / RDS)   |      | Structured Logs      |
                 +------------------+      +----------------------+
```

---

## 3. Explainable Rule-Based Risk Scoring Model

> **Academic Notice:** This is an explainable, transparent prototype scoring model. It uses deterministic heuristics rather than an unverified black-box ML model.

$$\text{Risk Score} = \min(100, P_{\text{no-shows}} + P_{\text{cancellations}} + P_{\text{confirmation}} + P_{\text{attendance}})$$

### Factors & Configurable Weights:
1. **Previous No-Shows:** 0 = 0 pts | 1 = 20 pts | 2 = 35 pts | 3+ = 45 pts
2. **Previous Cancellations:** 0 = 0 pts | 1–2 = 10 pts | 3+ = 15 pts
3. **Current Confirmation Status:** `CONFIRMED` = 0 pts | `UNCONFIRMED` = 20 pts
4. **Historical Attendance Rate:** $\ge 90\%$ = 0 pts | $70\% - 89\%$ = 10 pts | $< 70\%$ = 20 pts

### Classification:
- **0 – 30:** `LOW RISK` (Green)
- **31 – 60:** `MEDIUM RISK` (Orange)
- **61 – 100:** `HIGH RISK` (Red)

---

## 4. Quick Start (Run Locally)

The application features a **dual-mode database**: it connects to PostgreSQL if available, and automatically activates an in-memory transactional store for immediate local zero-dependency testing!

### Step 1: Start Backend Server
```powershell
# Open terminal in project root
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`)*

### Step 2: Start Frontend Application
```powershell
# In a second terminal window
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 5. 1-Click Evaluation Credentials

Use the **1-Click Demo Profile** buttons in the sign-in modal, or log in with:

| Role / Scenario | Email Address | Password | Features to Observe |
|---|---|---|---|
| **Administrator** | `admin@appointment.com` | `Admin@123` | KPI Dashboard, High-Risk Center, Slot Manager, Risk Simulator |
| **Alice Smith (Low Risk)** | `alice.smith@example.com` | `Password@123` | 100% past attendance, confirmed visit, 0% Low Risk score |
| **John Davis (High Risk)** | `john.davis@example.com` | `Password@123` | 2 past no-shows, unconfirmed visit, **85% High Risk score** |
| **Adarsh Paul (Student)** | `adarsh@vitstudent.ac.in` | `Password@123` | Book, confirm attendance, cancel (auto slot release), review |

---

## 6. Docker Containerization

To run the full stack (PostgreSQL + Express Backend + React Nginx Frontend) with a single command:

```powershell
docker compose up -d --build
```
- Access application: `http://localhost:3000`
- Access backend health: `http://localhost:5000/api/health`
- Stop containers: `docker compose down`

---

## 7. Automated Testing Suite

The repository includes automated unit and integration tests (Jest + Supertest):

```powershell
cd backend
npm test
```
**Test Coverage Includes:**
- User registration & login validation
- Role authorization & route protection
- Slot reservation & **Double-booking prevention lock (HTTP 409)**
- Appointment confirmation & risk score reduction
- Cancellation & **Automatic slot inventory recovery**
- Post-visit 1–5 star rating submission
- Explainable risk calculation for all boundary conditions

---

## 8. GitHub Actions CI/CD Pipeline

The `.github/workflows/ci-cd.yml` workflow enforces a 4-stage quality gate:
1. **🧪 Automated Tests:** Runs Jest test suite. Deployment stops if tests fail!
2. **🏗️ Frontend Build:** Verifies production JSX compilation.
3. **🐳 Docker Build:** Packages backend and frontend images.
4. **🚀 AWS Cloud Deploy:** Deploys containers to AWS EC2 and logs metrics to Amazon CloudWatch.

---

## 9. Comprehensive Documentation Index

Full academic documentation is organized under the [`docs/`](docs/) directory:
- [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) - Executive overview, problem statement & value proposition.
- [REQUIREMENTS.md](docs/REQUIREMENTS.md) - Software Requirements Specification (SRS).
- [USER_STORIES.md](docs/USER_STORIES.md) - Agile user stories with acceptance criteria.
- [PRODUCT_BACKLOG.md](docs/PRODUCT_BACKLOG.md) - Prioritized product backlog & Epics.
- [SPRINT_PLAN.md](docs/SPRINT_PLAN.md) - Sprint planning (Sprints 1 to 5), reviews & retrospectives.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - 3-tier architecture, ER diagram & sequence diagrams.
- [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) - Complete REST API specification.
- [TESTING.md](docs/TESTING.md) - Automated test results & evaluator testing checklist.
- [AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) - AWS cloud infrastructure guide (EC2, RDS, CloudWatch).
- [DEVOPS.md](docs/DEVOPS.md) - DevOps principles, Git branching & CI/CD workflow.

---

## 10. Student Declaration
This project is submitted by **Adarsh Paul . T (24MIS0564)** for the **Agile Development Process and DevOps** subject. All code, architectural artifacts, and documentation were constructed following standard academic and professional engineering practices.
