# Software Requirements Specification (SRS)

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Author:** Adarsh Paul . T (24MIS0564)  
**Course:** Agile Development Process and DevOps  

---

## 1. Functional Requirements (FR)

### Module 1: Authentication & User Management
- **FR-01 (Registration):** The system shall allow new customers to register with full name, unique email address, password (minimum 6 characters), and optional phone number.
- **FR-02 (Login & Session):** The system shall authenticate users via bcrypt password verification and issue a signed JSON Web Token (JWT) with configurable expiration (e.g., 24 hours).
- **FR-03 (Role-Based Authorization):** The system shall enforce role-based access control (RBAC), distinguishing between `customer` and `admin` roles across all private routes.

### Module 2: Appointment Management & Availability
- **FR-04 (Slot Querying):** The system shall allow customers and administrators to view available time slots by date.
- **FR-05 (Booking & Double-Booking Prevention):** The system shall prevent multiple bookings for the same time slot by verifying `is_available = true` atomically before creating an appointment and toggling `is_available = false`.
- **FR-06 (Confirmation Tracking):** The system shall allow customers to confirm their attendance, transitioning the appointment status to `CONFIRMED` and confirmation status to `CONFIRMED`.
- **FR-07 (Automatic Slot Release on Cancellation):** When an appointment is cancelled by a customer or admin, the system shall immediately return the associated time slot to open inventory (`is_available = true`).
- **FR-08 (Rescheduling):** The system shall allow customers to reschedule an existing appointment to a new available slot, releasing the old slot.
- **FR-09 (Status Lifecycle Audit):** The system shall log every status transition (`BOOKED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO-SHOW`) in the `appointment_history` table.

### Module 3: Explainable Rule-Based No-Show Risk Engine
- **FR-10 (Risk Calculation):** The system shall compute a deterministic risk score from 0 to 100 based on:
  - Previous no-shows count (0 = 0 pts, 1 = 20 pts, 2 = 35 pts, 3+ = 45 pts).
  - Previous cancellations count (0 = 0 pts, 1-2 = 10 pts, 3+ = 15 pts).
  - Current confirmation status (UNCONFIRMED = 20 pts, CONFIRMED = 0 pts).
  - Historical attendance rate (≥90% = 0 pts, 70–89% = 10 pts, <70% = 20 pts).
- **FR-11 (Risk Categorization):** The system shall classify appointments into `LOW` (0–30), `MEDIUM` (31–60), and `HIGH` (61–100) risk levels.
- **FR-12 (Explainability):** The system shall store and display human-readable bulleted reasons explaining the points assigned to each risk factor.
- **FR-13 (Dynamic Recalibration):** When an appointment is confirmed, the system shall automatically re-evaluate and lower its risk score.

### Module 4: Automation Engine
- **FR-14 (24-Hour & 2-Hour Reminders):** The system background scheduler shall detect upcoming appointments and dispatch automated reminders.
- **FR-15 (High-Risk Follow-Up):** If an upcoming appointment has `HIGH` risk and remains `UNCONFIRMED`, the system shall trigger an escalation alert.
- **FR-16 (Automated Analytics Calculation):** Operational metrics shall compute dynamically from the database.

### Module 5: Customer Feedback & Reviews
- **FR-17 (Feedback Submission):** After an appointment is marked `COMPLETED`, the customer shall be able to submit a 1–5 star rating and optional textual review.
- **FR-18 (Feedback Review):** Administrators shall be able to view average ratings, star distributions, and customer comments.

---

## 2. Non-Functional Requirements (NFR)

- **NFR-01 (Security):** Passwords shall never be stored in plain text (bcrypt hashing with 10 salt rounds mandatory). API keys and credentials shall be read from environment variables.
- **NFR-02 (Performance & Latency):** REST API endpoints shall respond in under 200ms under standard operational loads.
- **NFR-03 (Reliability & Dual-Mode Database):** The application shall connect to PostgreSQL in containerized/cloud environments and gracefully fall back to an in-memory transactional store for immediate local zero-dependency testing.
- **NFR-04 (Portability & Containerization):** Both frontend and backend services shall be packaged into reproducible multi-stage Docker containers with health checks.
- **NFR-05 (Observability):** Structured logging shall format request method, URL, status code, latency, and user identifiers compatible with AWS CloudWatch Logs.
- **NFR-06 (Maintainability):** Codebase shall follow modular MVC separation of concerns (controllers, routes, services, middleware, db).
