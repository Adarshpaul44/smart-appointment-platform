-- PostgreSQL Database Schema
-- Project: Smart Appointment Optimization & No-Show Prevention Platform
-- Student: Adarsh Paul . T (24MIS0564)

-- Drop existing tables (Optional manual reset - commented out to protect persistent RDS databases)
-- DROP TABLE IF EXISTS feedback CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS appointment_history CASCADE;
-- DROP TABLE IF EXISTS appointments CASCADE;
-- DROP TABLE IF EXISTS availability_slots CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
-- Stores both Customers and Administrators with role-based access
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. AVAILABILITY_SLOTS TABLE
-- Admin-configured time windows available for appointments
CREATE TABLE IF NOT EXISTS availability_slots (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_slot_time UNIQUE (date, start_time, end_time)
);

-- 3. APPOINTMENTS TABLE
-- Central appointments with status tracking and explainable risk scores
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_id INT REFERENCES availability_slots(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED' 
        CHECK (status IN ('BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO-SHOW')),
    confirmation_status VARCHAR(20) NOT NULL DEFAULT 'UNCONFIRMED'
        CHECK (confirmation_status IN ('UNCONFIRMED', 'CONFIRMED')),
    risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(10) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    risk_reasons JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. APPOINTMENT_HISTORY TABLE
-- Audit log of status transitions (e.g., BOOKED -> CONFIRMED, or CANCELLED)
CREATE TABLE IF NOT EXISTS appointment_history (
    id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    note VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. NOTIFICATIONS TABLE
-- Stores reminders, confirmation notices, and high-risk follow-up alerts
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'BOOKING_CONFIRMATION', 'REMINDER_24H', 'REMINDER_2H', 'HIGH_RISK_ALERT', 'CANCELLATION'
    message TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'IN_APP', -- 'IN_APP', 'EMAIL', 'SMS'
    status VARCHAR(20) DEFAULT 'SENT' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. FEEDBACK TABLE
-- Post-appointment ratings and reviews from customers
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    appointment_id INT UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for Query Optimization & High-Performance Lookups
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_risk_level ON appointments(risk_level);
CREATE INDEX IF NOT EXISTS idx_slots_date_availability ON availability_slots(date, is_available);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
