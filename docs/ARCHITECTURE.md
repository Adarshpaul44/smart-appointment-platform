# System Architecture & Technical Design

**Project:** Smart Appointment Optimization & No-Show Prevention Platform  
**Author:** Adarsh Paul . T (24MIS0564)  
**Course:** Agile Development Process and DevOps  

---

## 1. High-Level Architecture Overview

The system follows a modern decoupled 3-tier cloud-ready web architecture:
1. **Client Tier:** React.js Single Page Application (SPA) served via Nginx.
2. **Application Tier:** Node.js + Express.js REST API with layered Controller-Service architecture.
3. **Data Tier:** Normalized PostgreSQL Relational Database (Amazon RDS / Docker).

```mermaid
flowchart TD
    User["Customer / Patient"] -->|HTTPS / Port 3000| Nginx["Frontend (React + Nginx)"]
    Admin["Administrator"] -->|HTTPS / Port 3000| Nginx
    
    Nginx -->|Reverse Proxy /api| Express["Backend API (Node.js + Express)"]
    
    subgraph ExpressApp ["Express Backend Application"]
        AuthMiddleware["JWT & RBAC Middleware"]
        ApptCtrl["Appointment Controller"]
        RiskService["Explainable Risk Engine"]
        AutoService["Automation & Scheduler Service"]
        NotifService["Notification Service"]
    end
    
    Express --> AuthMiddleware
    AuthMiddleware --> ApptCtrl
    ApptCtrl --> RiskService
    ApptCtrl --> NotifService
    AutoService --> RiskService
    AutoService --> NotifService
    
    Express -->|SQL Queries| DB[("PostgreSQL Database (Amazon RDS)")]
    NotifService -.->|Cloud Readiness| SNS["AWS SNS / SES (Mock / Prod)"]
    Express -.->|Logs & Metrics| CloudWatch["Amazon CloudWatch Logs"]
```

---

## 2. Component Design & Layering

### 2.1 Frontend Architecture (React)
- **Framework:** React 18 with Vite build tooling for fast HMR and optimized production bundles.
- **State Management:** React Context API (`AuthContext`) managing user session tokens and live state.
- **Routing & Views:** Modular views (`LandingPage`, `CustomerDashboard`, `AdminDashboard`, `AuthModal`).
- **Design System:** Pure modern CSS custom properties with responsive flexbox/grid layout and distinct status/risk badges:
  - `badge-low`: Emerald green (`#10b981`)
  - `badge-medium`: Amber yellow (`#f59e0b`)
  - `badge-high`: Crimson red (`#ef4444`)

### 2.2 Backend Architecture (Node.js & Express)
The backend follows strict separation of concerns:
- **Routes (`src/routes/`):** Pure URL routing and middleware registration.
- **Controllers (`src/controllers/`):** HTTP request validation, parameter parsing, and response status formulation.
- **Services (`src/services/`):** Business logic encapsulation:
  - `RiskService`: Pure mathematical and heuristic rule evaluation.
  - `AutomationService`: Background scheduled tasks and interval checks.
  - `NotificationService`: Channel abstraction (In-App, Mock Console, AWS SNS/SES).
- **Database Abstraction (`src/db/`):** Resilient dual-mode database connector. Connects to PostgreSQL when present, and seamlessly activates a transactional in-memory store for local zero-dependency testing.
- **Middleware (`src/middleware/`):** JWT verification, admin access control, and CloudWatch-compatible structured request logging.

---

## 3. Database Schema (Normalized PostgreSQL)

```mermaid
erDiagram
    USERS ||--o{ APPOINTMENTS : books
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ FEEDBACK : writes
    AVAILABILITY_SLOTS ||--o{ APPOINTMENTS : allocates
    APPOINTMENTS ||--o{ APPOINTMENT_HISTORY : audits
    APPOINTMENTS ||--o| FEEDBACK : receives

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        string phone
        timestamp created_at
    }

    AVAILABILITY_SLOTS {
        int id PK
        date date
        time start_time
        time end_time
        boolean is_available
        timestamp created_at
    }

    APPOINTMENTS {
        int id PK
        int user_id FK
        int slot_id FK
        string service_type
        date appointment_date
        time start_time
        time end_time
        string status
        string confirmation_status
        int risk_score
        string risk_level
        jsonb risk_reasons
        timestamp created_at
    }

    APPOINTMENT_HISTORY {
        int id PK
        int appointment_id FK
        string old_status
        string new_status
        int changed_by_user_id FK
        string note
        timestamp changed_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        int appointment_id FK
        string type
        text message
        string status
        timestamp sent_at
    }

    FEEDBACK {
        int id PK
        int appointment_id FK
        int user_id FK
        int rating
        text comment
        timestamp created_at
    }
```

---

## 4. Explainable Rule-Based Risk Engine Architecture

The risk scoring model evaluates four transparent operational factors to produce a score between 0 and 100:

$$\text{Risk Score} = \min(100, P_{\text{no-shows}} + P_{\text{cancellations}} + P_{\text{confirmation}} + P_{\text{attendance}})$$

### Factor Breakdown:
1. **Previous No-Shows:**
   - 0 past no-shows: $+0$ points
   - 1 past no-show: $+20$ points
   - 2 past no-shows: $+35$ points
   - 3 or more past no-shows: $+45$ points
2. **Previous Cancellations:**
   - 0 past cancellations: $+0$ points
   - 1–2 past cancellations: $+10$ points
   - 3 or more past cancellations: $+15$ points
3. **Current Confirmation Status:**
   - `CONFIRMED`: $+0$ points
   - `UNCONFIRMED`: $+20$ points
4. **Historical Attendance Rate:**
   - $\ge 90\%$: $+0$ points
   - $70\% - 89\%$: $+10$ points
   - $< 70\%$: $+20$ points

### Risk Level Bands:
- **0 – 30:** `LOW RISK` (Green)
- **31 – 60:** `MEDIUM RISK` (Amber/Orange)
- **61 – 100:** `HIGH RISK` (Red)

Each factor that adds penalty points appends an explicit, human-readable reason string (e.g., *"2 past no-shows on record"*, *"Current appointment is not yet confirmed by customer"*), ensuring total transparency for administrators.

---

## 5. Automation Architecture & Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend
    participant Backend as Express API
    participant AutoEngine as Automation Engine
    participant DB as PostgreSQL

    Customer->>Frontend: Select Slot & Book Appointment
    Frontend->>Backend: POST /api/appointments
    Backend->>DB: Check slot availability & Lock (is_available = false)
    Backend->>Backend: Calculate initial Risk Score (UNCONFIRMED)
    Backend->>DB: INSERT appointment record & audit history
    Backend-->>Frontend: 201 Created (Appointment + Risk Assessment)

    loop Recurring Background Check
        AutoEngine->>DB: Query active upcoming appointments
        alt 24 Hours Before Appointment
            AutoEngine->>DB: Dispatch REMINDER_24H Notification
        else 2 Hours Before Appointment
            AutoEngine->>DB: Dispatch REMINDER_2H Notification
        else High Risk & Unconfirmed
            AutoEngine->>DB: Dispatch HIGH_RISK_ALERT Escalation
        end
    end

    alt Customer Confirms
        Customer->>Frontend: Click "Confirm Attendance"
        Frontend->>Backend: POST /api/appointments/:id/confirm
        Backend->>Backend: Deduct unconfirmed penalty (-20 pts)
        Backend->>DB: Update confirmation_status = CONFIRMED, update risk_score
        Backend-->>Frontend: 200 OK (Updated Low Risk)
    else Customer Cancels
        Customer->>Frontend: Click "Cancel Appointment"
        Frontend->>Backend: POST /api/appointments/:id/cancel
        Backend->>DB: Set status = CANCELLED
        Backend->>DB: Restore slot (UPDATE is_available = true)
        Backend-->>Frontend: 200 OK (Slot Recovered)
    end
```
