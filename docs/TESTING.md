# Quality Assurance & Testing Guide

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Author:** Adarsh Paul . T (24MIS0564)  
**Testing Frameworks:** Jest, Supertest  

---

## 1. Automated Testing Strategy

The project employs automated testing as an integral quality gate in the development process and CI/CD pipeline:
- **Unit Testing (`backend/tests/risk.test.js`):** Validates deterministic scoring rules, threshold boundaries, penalty point additions, and explainable reason strings across edge cases.
- **Integration Testing (`backend/tests/api.test.js`):** Tests full HTTP request/response flows, database operations, role authorization, slot reservation locks, automatic slot release on cancellation, and post-appointment feedback.

### How to Run Automated Tests:
```powershell
# Navigate to backend directory
cd backend

# Execute test suite
npm test
```

### Test Suite Execution Output (14/14 Passed):
```
PASS tests/api.test.js
  1. Authentication & Authorization Tests
    ✓ User Registration succeeds with valid details
    ✓ User Login fails with incorrect password
    ✓ Customer cannot access Admin endpoints (Authorization enforcement)
    ✓ Admin can access protected analytics dashboard
  2. Appointment Management & Double-Booking Prevention
    ✓ Customer can book an available slot
    ✓ Double-booking prevention: attempting to book already reserved slot is rejected (409)
    ✓ Customer can confirm their appointment and reduce risk score
    ✓ Customer can cancel appointment and slot is automatically released
  3. Admin Status Update & Customer Feedback
    ✓ Customer submits feedback (rating 1-5) for completed appointment
    ✓ Admin can view all feedback and rating distribution

PASS tests/risk.test.js
  No-Show Risk Engine (Explainable Rule-Based)
    ✓ Low Risk Scenario: Perfect attendance customer with confirmed appointment
    ✓ High Risk Scenario: Repeat no-shows, low attendance rate, unconfirmed appointment
    ✓ Medium Risk Scenario: 1 past no-show with confirmed appointment
    ✓ First-time customer scenario has neutral attendance penalty

Test Suites: 2 passed, 2 total
Tests:       14 passed, 14 total
```

---

## 2. Interactive Manual Testing Checklist (For Evaluators)

Follow this step-by-step checklist during live project evaluation:

| Step # | Test Objective | Action to Perform | Expected Outcome |
|---|---|---|---|
| **1** | **User Registration & Login** | Click "Sign In" on navbar, choose "Register here", fill in details, or click any **1-Click Demo Profile** button. | Account is authenticated, JWT is issued, and respective dashboard renders. |
| **2** | **Slot Booking** | In Customer Dashboard, click "Quick Book Appointment", choose service and open time slot. | Appointment is created in `BOOKED` status; slot is locked. |
| **3** | **Double-Booking Prevention** | Open an incognito browser window or test customer and try to book the exact same slot. | System displays error: *"Slot already booked. Double booking prevented."* (HTTP 409). |
| **4** | **Explainable Risk Scoring** | Sign in as **John Davis** (High Risk Demo). Notice his upcoming appointment. | Marked **HIGH RISK (85%)** with explainable reasons: past no-shows, unconfirmed status, attendance < 70%. |
| **5** | **Confirmation & Risk Recalibration** | Click **"Confirm Attendance"** on the upcoming appointment card. | Status changes to `CONFIRMED`; unconfirmed penalty (20 pts) is deducted immediately; risk level drops. |
| **6** | **Automatic Slot Recovery** | Click **"Cancel Appointment"** on any active appointment. | Status becomes `CANCELLED`. Check available slots: the time slot is instantly open again for other users! |
| **7** | **Admin High-Risk Control** | Switch to **Administrator** account (`admin@appointment.com`). Open "High-Risk Control" tab. | Displays high-risk appointments. Click **"Send Urgent Reminder"** to dispatch immediate follow-up alert. |
| **8** | **Interactive Risk Simulator** | In Admin Dashboard, open "Risk Engine Simulator" tab. Adjust sliders for no-shows and cancellations. | Risk percentage updates live with exact transparent rationale for viva demonstration. |
| **9** | **Customer Review & Ratings** | Complete an appointment, switch to customer, and click "Review" to submit a 1–5 star rating with comment. | Feedback appears under Admin "Customer Feedback" with recalculated average star rating. |
| **10** | **On-Demand Automation Cycle** | Click **"Run Automation Cycle"** in top navbar. | Executes background reminder scanner, checks 24h & 2h milestones, and recalibrates risk scores. |
