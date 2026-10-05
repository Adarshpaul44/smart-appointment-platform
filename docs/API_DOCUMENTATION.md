# REST API Documentation

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Author:** Adarsh Paul . T (24MIS0564)  
**Base URL:** `http://localhost:5000/api`  

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method:** `POST`
- **Endpoint:** `/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Alice Smith",
    "email": "alice.smith@example.com",
    "password": "Password@123",
    "phone": "+1-555-0101",
    "role": "customer"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration successful!",
    "data": {
      "user": { "id": 2, "name": "Alice Smith", "email": "alice.smith@example.com", "role": "customer" },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 1.2 User Login
- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@appointment.com",
    "password": "Admin@123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful!",
    "data": {
      "user": { "id": 1, "name": "Administrator", "email": "admin@appointment.com", "role": "admin" },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 1.3 Get Current User Profile
- **Method:** `GET`
- **Endpoint:** `/auth/me`
- **Access:** Authenticated (Bearer Token)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": { "id": 1, "name": "Administrator", "email": "admin@appointment.com", "role": "admin" }
  }
  ```

---

## 2. Appointment Endpoints

### 2.1 Get My Appointments
- **Method:** `GET`
- **Endpoint:** `/appointments/my`
- **Access:** Authenticated (Customer/Admin)
- **Response (200 OK):** Returns array of user's appointments with risk scores and confirmation status.

### 2.2 Book an Appointment
- **Method:** `POST`
- **Endpoint:** `/appointments`
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "slot_id": 6,
    "service_type": "Dental Checkup",
    "notes": "Routine examination"
  }
  ```
- **Response (201 Created):** Returns booked appointment with initial rule-based risk score and triggers booking notification.
- **Error Response (409 Conflict):** Double-booking prevented if slot was already reserved.

### 2.3 Confirm Appointment
- **Method:** `POST`
- **Endpoint:** `/appointments/:id/confirm`
- **Access:** Authenticated (Owner or Admin)
- **Response (200 OK):** Transitions `confirmation_status` to `CONFIRMED` and drops risk score.

### 2.4 Cancel Appointment (Auto Slot Recovery)
- **Method:** `POST`
- **Endpoint:** `/appointments/:id/cancel`
- **Access:** Authenticated (Owner or Admin)
- **Request Body:** `{ "reason": "Conflict with work schedule" }`
- **Response (200 OK):** Transitions status to `CANCELLED` and sets `availability_slots.is_available = true`.

### 2.5 Reschedule Appointment
- **Method:** `POST`
- **Endpoint:** `/appointments/:id/reschedule`
- **Access:** Authenticated (Owner or Admin)
- **Request Body:** `{ "new_slot_id": 12 }`
- **Response (200 OK):** Frees previous slot and reserves new slot.

### 2.6 Admin: List All Appointments
- **Method:** `GET`
- **Endpoint:** `/appointments?status=BOOKED&risk_level=HIGH&search=John`
- **Access:** Admin Only

### 2.7 Admin: Update Appointment Status
- **Method:** `PATCH`
- **Endpoint:** `/appointments/:id/status`
- **Access:** Admin Only
- **Request Body:** `{ "status": "COMPLETED" }`

### 2.8 Admin: Send Urgent Follow-Up Reminder
- **Method:** `POST`
- **Endpoint:** `/appointments/:id/remind`
- **Access:** Admin Only

---

## 3. Availability Slots Endpoints

- `GET /api/availability?date=YYYY-MM-DD`: List available slots.
- `POST /api/availability`: Create new slot (Admin Only).
- `PATCH /api/availability/:id/toggle`: Toggle slot status (Admin Only).

---

## 4. Analytics & Risk Endpoints

- `GET /api/analytics/dashboard`: Real-time operational KPIs, charts data, and high-risk count (Admin Only).
- `GET /api/analytics/customers`: Customer directory with attendance reliability percentages (Admin Only).
- `GET /api/risk/rules`: View transparent rule weights and thresholds.
- `POST /api/risk/simulate`: Interactive simulator calculating score and reasons for arbitrary parameters.
- `POST /api/risk/recalculate-all`: Refresh risk scores across all active bookings (Admin Only).

---

## 5. Feedback & Notifications Endpoints

- `POST /api/feedback`: Submit 1–5 star rating and comment on completed visit.
- `GET /api/feedback`: View all feedback, average rating, and rating distribution (Admin Only).
- `GET /api/notifications`: Retrieve user's in-app reminder notices.
- `POST /api/automation/run`: Manually trigger automation cycle (Admin Only).
- `GET /api/health`: CloudWatch and load balancer healthcheck endpoint.
