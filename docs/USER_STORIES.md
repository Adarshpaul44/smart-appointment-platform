# User Stories & Acceptance Criteria

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Author:** Adarsh Paul . T (24MIS0564)  
**Methodology:** Agile Scrum  

---

### US01: Customer Registration
- **User Story:** As a customer, I want to register for an account so that I can securely book and manage appointments.
- **Story Points:** 3
- **Acceptance Criteria:**
  - Given valid name, email, and password (≥6 chars), when I submit the registration form, an account is created and a JWT is issued.
  - Given an email that already exists in the system, registration is rejected with HTTP 409 and a user-friendly message.

### US02: Secure User Authentication
- **User Story:** As a user (customer or admin), I want to log in securely so that my personal appointments and operational data are protected.
- **Story Points:** 2
- **Acceptance Criteria:**
  - Given correct email and password, system returns HTTP 200, JWT token, and profile data.
  - Given incorrect credentials, system returns HTTP 401 without exposing whether the email or password was wrong.

### US03: View Available Time Slots
- **User Story:** As a customer, I want to view available slots by date so that I can select a convenient time for my appointment.
- **Story Points:** 3
- **Acceptance Criteria:**
  - Given a selected date, the system lists only slots where `is_available = true` sorted by start time.
  - Slots already reserved by other customers are excluded from selection.

### US04: Book Appointment & Prevent Double-Booking
- **User Story:** As a customer, I want to book an appointment so that I can reserve a service while guaranteeing no double bookings occur.
- **Story Points:** 5
- **Acceptance Criteria:**
  - When a slot is successfully booked, its status becomes `is_available = false` and the appointment status is initialized to `BOOKED`.
  - If two users simultaneously attempt to book the same slot, the second request is rejected with HTTP 409 Conflict.

### US05: Appointment Confirmation
- **User Story:** As a customer, I want to confirm my appointment so that the provider knows I will attend and my risk score decreases.
- **Story Points:** 3
- **Acceptance Criteria:**
  - When I click "Confirm Attendance", `confirmation_status` changes to `CONFIRMED`.
  - The explainable risk score immediately recalculates, deducting the 20-point unconfirmed penalty.

### US06: Cancellation & Automatic Slot Release
- **User Story:** As a customer, I want to cancel an appointment if my schedule changes so that the slot can be reused by others.
- **Story Points:** 5
- **Acceptance Criteria:**
  - When cancelled, appointment status transitions to `CANCELLED`.
  - The associated availability slot is automatically restored to `is_available = true`.
  - The status transition is recorded in the `appointment_history` table.

### US07: Automated Reminders
- **User Story:** As a system, I want to automatically remind customers 24h and 2h before appointments so that forgotten visits are reduced.
- **Story Points:** 5
- **Acceptance Criteria:**
  - Background scheduler checks appointments and logs/dispatches `REMINDER_24H` and `REMINDER_2H` notifications.
  - Reminders are not duplicated if already dispatched for that milestone.

### US08: Explainable No-Show Risk Calculation
- **User Story:** As a system, I want to calculate an explainable risk score (0–100) so that high-risk appointments are clearly identified with reasons.
- **Story Points:** 5
- **Acceptance Criteria:**
  - Risk engine evaluates no-shows, cancellations, confirmation, and attendance rate according to configurable weights.
  - Output includes numerical score, risk band (`LOW`, `MEDIUM`, `HIGH`), and human-readable reason strings.

### US09: High-Risk Management & Follow-Up
- **User Story:** As an admin, I want to view all high-risk appointments and send urgent follow-up reminders to prevent missed slots.
- **Story Points:** 5
- **Acceptance Criteria:**
  - Dedicated admin view displays appointments with risk ≥ 61.
  - Clicking "Send Urgent Reminder" dispatches a high-priority alert and updates notification history.

### US10: Admin Availability Management
- **User Story:** As an admin, I want to configure working hours and add/toggle availability slots so that our schedule matches capacity.
- **Story Points:** 3
- **Acceptance Criteria:**
  - Admin can add time slots (date, start time, end time).
  - Admin can toggle an existing slot between open and closed.

### US11: Operational Analytics Dashboard
- **User Story:** As an admin, I want an executive dashboard with charts and KPIs so that I can understand appointment performance and no-show rates.
- **Story Points:** 5
- **Acceptance Criteria:**
  - Dashboard presents metrics: Total, Confirmed %, Unconfirmed, Completed, Cancelled %, No-Shows, No-Show Rate %.
  - Visual charts render appointments by day, status distribution, and risk distribution.

### US12: Customer Feedback & Rating
- **User Story:** As a customer, I want to provide a 1–5 star rating and comment after a completed appointment so that service quality is measured.
- **Story Points:** 3
- **Acceptance Criteria:**
  - Only `COMPLETED` appointments are eligible for feedback submission.
  - Admin dashboard displays average ratings, rating distribution, and written reviews.
