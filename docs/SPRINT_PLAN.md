# Agile Sprint Planning, Review & Retrospective

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Scrum Master & Developer:** Adarsh Paul . T (24MIS0564)  
**Academic Subject:** Agile Development Process and DevOps  

---

## Sprint Overview Summary

| Sprint | Focus Area | Committed Points | Completed Points | Velocity |
|---|---|---|---|---|
| **Sprint 1** | Foundation, Database Schema & Authentication (JWT/RBAC) | 14 SP | 14 SP | 14 SP |
| **Sprint 2** | Appointment Lifecycle, Double Booking Prevention & Slot Release | 16 SP | 16 SP | 16 SP |
| **Sprint 3** | Explainable Risk Scoring Engine & Multi-Tier Automation | 16 SP | 16 SP | 16 SP |
| **Sprint 4** | Admin Dashboard, Executive Analytics, Feedback & Automated Testing | 16 SP | 16 SP | 16 SP |
| **Sprint 5** | Docker Containerization, CI/CD GitHub Actions & AWS Cloud Readiness | 18 SP | 18 SP | 18 SP |

---

## Sprint 1: Foundation, Database & Authentication
- **Sprint Goal:** Establish clean repository structure, relational PostgreSQL database schema with local fallback resilience, and JWT authentication.
- **Backlog Items Completed:**
  - PB-01: User registration with input validation and bcrypt password hashing.
  - PB-02: JWT token issuance and role-based access middleware (`authenticateToken`, `requireAdmin`).
  - PB-03: Relational tables definition (`users`, `appointments`, `availability_slots`, `appointment_history`, `notifications`, `feedback`).
- **Sprint Review:** Registration and login endpoints verified. Dual-mode database successfully connects to PostgreSQL or activates resilient in-memory development store.
- **Sprint Retrospective:**
  - *What went well:* Clean separation of controllers, routes, and middleware.
  - *What could be improved:* Windows PowerShell environment variable path persistence needed adjustment.
  - *Action item:* Added permanent environment configuration for Node and Git.

---

## Sprint 2: Core Appointment Booking & Slot Recovery
- **Sprint Goal:** Implement appointment scheduling, double-booking prevention, attendance confirmation, and automatic slot release.
- **Backlog Items Completed:**
  - PB-04: Booking endpoint with strict verification of slot availability (`is_available = true`).
  - PB-05: Customer attendance confirmation workflow with audit logging.
  - PB-06: Cancellation workflow with **automatic slot recovery** (`is_available = true`).
  - PB-07: Rescheduling workflow freeing previous slot and reserving new slot.
- **Sprint Review:** Double-booking tests confirmed that concurrent reservation attempts return HTTP 409 Conflict. Slot recovery verified on cancellation.
- **Sprint Retrospective:**
  - *What went well:* Audit history table captured every lifecycle change accurately.
  - *What could be improved:* Ensure slot times match between frontend picker and database constraints.

---

## Sprint 3: Explainable Risk Intelligence & Automation
- **Sprint Goal:** Build the transparent rule-based risk scoring model (0–100) and background automation service for reminders and follow-ups.
- **Backlog Items Completed:**
  - PB-08: Deterministic scoring based on 4 factors (no-shows, cancellations, confirmation, attendance rate).
  - PB-09: Dynamic risk score recalculation upon appointment confirmation.
  - PB-10: Interactive risk simulator for parameter adjustment and viva demonstration.
  - PB-11: Background automated reminder checks (24h & 2h milestones).
  - PB-12: High-risk unconfirmed follow-up escalation alerts.
- **Sprint Review:** Tested risk engine against various patient scenarios: low-risk (0 pts), medium-risk (40 pts), and repeat-offender high-risk (85 pts).
- **Sprint Retrospective:**
  - *What went well:* Transparent reason strings directly explain every assigned point.
  - *Key decision:* Maintained prototype rule-based heuristics rather than unverified black-box ML for academic clarity and explainability.

---

## Sprint 4: Admin Dashboard, Analytics & Quality Assurance
- **Sprint Goal:** Build the React SaaS interface, executive analytics, feedback review system, and write automated tests.
- **Backlog Items Completed:**
  - PB-14: Executive Admin Dashboard with real-time KPI metrics and visual charts.
  - PB-15: Dedicated High-Risk Appointments Management Center with 1-click urgent reminder buttons.
  - PB-16: Customer attendance directory with reliability percentages.
  - PB-17: Post-visit 1–5 star customer feedback submission and rating distribution.
  - PB-18: 14 automated unit and integration tests using Jest and Supertest.
- **Sprint Review:** All 14 automated test cases passed with 100% test success rate. Frontend built cleanly using Vite and modern SaaS design system.
- **Sprint Retrospective:**
  - *What went well:* Single unified interface switching seamlessly between Customer and Admin modes.

---

## Sprint 5: Containerization, DevOps & AWS Cloud
- **Sprint Goal:** Package the application into Docker containers, create a GitHub Actions CI/CD workflow, and document AWS cloud architecture.
- **Backlog Items Completed:**
  - PB-19: Multi-stage Dockerfiles for backend (Node 20) and frontend (Nginx), orchestrated via `docker-compose.yml`.
  - PB-20: GitHub Actions CI/CD pipeline (`.github/workflows/ci-cd.yml`) with automated test quality gates.
  - PB-21: AWS Cloud infrastructure design (EC2, RDS PostgreSQL, SNS/SES, CloudWatch).
- **Sprint Review:** Container images built and tested. CI/CD workflow runs tests and stops deployment if any test fails.
- **Sprint Retrospective:**
  - *Overall project outcome:* Fully working, polished, and beginner-friendly college software project satisfying all Agile and DevOps criteria.
