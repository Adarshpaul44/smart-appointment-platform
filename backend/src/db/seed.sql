-- Seed Data for Smart Appointment Platform
-- Default Passwords are all hashed with bcrypt (rounds = 10) for: "Password@123"
-- Admin password hash corresponds to: "Admin@123" ($2a$10$wO0K.f2n5v21rU0nS4a6h.5i958f0k3P4t/yO02K6G.bHh8.vX7mK or dynamically seeded)

-- Insert Users
-- 1. Admin
INSERT INTO users (id, name, email, password_hash, role, phone)
VALUES 
(1, 'Administrator', 'admin@appointment.com', '$2a$10$eA0tqWpQ8W96f5P1wM5Wbu9fD5G0W7eU.qQ1n6/i5W6kC8r1dM7iW', 'admin', '+1-555-0100')
ON CONFLICT (email) DO NOTHING;

-- 2. Reliable Customer (Alice - Low Risk)
INSERT INTO users (id, name, email, password_hash, role, phone)
VALUES 
(2, 'Alice Smith', 'alice.smith@example.com', '$2a$10$eA0tqWpQ8W96f5P1wM5Wbu9fD5G0W7eU.qQ1n6/i5W6kC8r1dM7iW', 'customer', '+1-555-0101')
ON CONFLICT (email) DO NOTHING;

-- 3. Repeat Offender Customer (John - High Risk)
INSERT INTO users (id, name, email, password_hash, role, phone)
VALUES 
(3, 'John Davis', 'john.davis@example.com', '$2a$10$eA0tqWpQ8W96f5P1wM5Wbu9fD5G0W7eU.qQ1n6/i5W6kC8r1dM7iW', 'customer', '+1-555-0102')
ON CONFLICT (email) DO NOTHING;

-- 4. Moderate Customer (Bob - Medium Risk)
INSERT INTO users (id, name, email, password_hash, role, phone)
VALUES 
(4, 'Bob Brown', 'bob.brown@example.com', '$2a$10$eA0tqWpQ8W96f5P1wM5Wbu9fD5G0W7eU.qQ1n6/i5W6kC8r1dM7iW', 'customer', '+1-555-0103')
ON CONFLICT (email) DO NOTHING;

-- 5. Student Account
INSERT INTO users (id, name, email, password_hash, role, phone)
VALUES 
(5, 'Adarsh Paul . T', 'adarsh@vitstudent.ac.in', '$2a$10$eA0tqWpQ8W96f5P1wM5Wbu9fD5G0W7eU.qQ1n6/i5W6kC8r1dM7iW', 'customer', '+91-9876543210')
ON CONFLICT (email) DO NOTHING;
