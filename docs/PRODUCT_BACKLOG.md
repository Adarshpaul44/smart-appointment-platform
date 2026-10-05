# Product Backlog & Epics

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Product Owner:** Adarsh Paul . T (24MIS0564)  
**Methodology:** Agile Scrum  

---

## 1. Product Vision
To empower appointment-based businesses to eliminate lost revenue and schedule disruption caused by no-shows through transparent, explainable risk intelligence, automated reminders, and instant slot recovery.

---

## 2. Epics Hierarchy

```
EPIC-01: Identity, Security & Role-Based Access Control (RBAC)
EPIC-02: Core Appointment Lifecycle & Real-Time Slot Inventory
EPIC-03: Explainable Rule-Based No-Show Risk Intelligence Engine
EPIC-04: Multi-Tier Background Automation & Notification Architecture
EPIC-05: Executive Operational Analytics & Quality Feedback Loop
EPIC-06: Containerization, CI/CD Pipeline & AWS Cloud Architecture
```

---

## 3. Prioritized Product Backlog

| Backlog ID | Epic | User Story / Feature Summary | Priority (MoSCoW) | Story Points | Status |
|---|---|---|---|---|---|
| **PB-01** | EPIC-01 | Customer Registration with Email Validation & Password Hashing | Must Have | 3 | Done |
| **PB-02** | EPIC-01 | JWT Authentication & Role-Based Middleware (Customer / Admin) | Must Have | 3 | Done |
| **PB-03** | EPIC-02 | Availability Slots Management & Date-wise Slot Querying | Must Have | 3 | Done |
| **PB-04** | EPIC-02 | Appointment Booking with Double-Booking Prevention Lock | Must Have | 5 | Done |
| **PB-05** | EPIC-02 | Customer Attendance Confirmation & Instant Status Transition | Must Have | 3 | Done |
| **PB-06** | EPIC-02 | Appointment Cancellation & Instant Automatic Slot Release | Must Have | 5 | Done |
| **PB-07** | EPIC-02 | Appointment Rescheduling with Slot Re-allocation | Should Have | 3 | Done |
| **PB-08** | EPIC-03 | Explainable Rule-Based Risk Engine with Configurable Weights | Must Have | 5 | Done |
| **PB-09** | EPIC-03 | Dynamic Risk Recalibration upon Attendance Confirmation | Must Have | 3 | Done |
| **PB-10** | EPIC-03 | Interactive Risk Simulator for Evaluation & Parameter Tuning | Should Have | 3 | Done |
| **PB-11** | EPIC-04 | Background Automated 24h & 2h Milestone Reminders | Must Have | 5 | Done |
| **PB-12** | EPIC-04 | High-Risk Unconfirmed Follow-Up Escalation Alerts | Must Have | 3 | Done |
| **PB-13** | EPIC-04 | Multi-Channel Notification Dispatcher (Mock & AWS SNS/SES) | Should Have | 3 | Done |
| **PB-14** | EPIC-05 | Executive Admin Dashboard with Operational KPIs & Charts | Must Have | 5 | Done |
| **PB-15** | EPIC-05 | Dedicated High-Risk Appointments Management Center | Must Have | 5 | Done |
| **PB-16** | EPIC-05 | Customer Attendance Directory with Attendance Reliability % | Should Have | 3 | Done |
| **PB-17** | EPIC-05 | Post-Visit 1–5 Star Customer Feedback & Reviews Loop | Should Have | 3 | Done |
| **PB-18** | EPIC-06 | Automated Test Suite (Jest & Supertest Integration Tests) | Must Have | 5 | Done |
| **PB-19** | EPIC-06 | Multi-Stage Dockerfile (Backend & Frontend) & Docker Compose | Must Have | 5 | Done |
| **PB-20** | EPIC-06 | GitHub Actions Automated CI/CD Workflow Pipeline | Must Have | 5 | Done |
| **PB-21** | EPIC-06 | AWS Cloud Architecture Specification (EC2, RDS, CloudWatch) | Must Have | 3 | Done |

---

## 4. Definition of Done (DoD)
A backlog item is declared **Done** only when:
1. Source code is implemented according to modular coding guidelines.
2. Unit and integration tests pass successfully in the automated test suite.
3. Code is reviewed and merged into the primary Git branch (`main`).
4. Container build succeeds without errors.
5. Corresponding API and user documentation is updated.
