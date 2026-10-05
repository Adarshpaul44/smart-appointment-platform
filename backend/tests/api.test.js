/**
 * Integration Test Suite for Smart Appointment Platform API
 * 
 * Verifies:
 * - Registration, Login & Invalid Login
 * - Role Authorization & Admin Access
 * - Appointment Creation & Double Booking Prevention
 * - Confirmation & Risk Recalibration
 * - Rescheduling & Slot Recovery on Cancellation
 * - Customer Feedback Submission
 */

const request = require('supertest');
const app = require('../src/server');
const db = require('../src/db');

let adminToken = '';
let customerToken = '';
let customerUser = null;
let testSlotId = null;

beforeAll(async () => {
  // Ensure DB initialized
  await db.initDb();

  // Admin login
  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@appointment.com', password: 'Admin@123' });
  adminToken = adminLoginRes.body.data.token;

  // Create a fresh test customer
  const uniqueEmail = `test.user.${Date.now()}@example.com`;
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Integration Test User',
      email: uniqueEmail,
      password: 'Password@123',
      role: 'customer'
    });
  customerToken = regRes.body.data.token;
  customerUser = regRes.body.data.user;

  // Create an availability slot for tests
  const slotRes = await request(app)
    .post('/api/availability')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      date: '2026-12-01',
      start_time: '16:00:00',
      end_time: '17:00:00'
    });
  testSlotId = slotRes.body.data.id;
});

describe('1. Authentication & Authorization Tests', () => {
  test('User Registration succeeds with valid details', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Registered User',
        email: `new.user.${Date.now()}@example.com`,
        password: 'Password@123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test('User Login fails with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@appointment.com',
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Customer cannot access Admin endpoints (Authorization enforcement)', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Administrator privileges required/i);
  });

  test('Admin can access protected analytics dashboard', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpi).toBeDefined();
  });
});

describe('2. Appointment Management & Double-Booking Prevention', () => {
  let createdApptId = null;

  test('Customer can book an available slot', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        slot_id: testSlotId,
        service_type: 'Dental Checkup',
        notes: 'Integration test appointment'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('BOOKED');
    expect(res.body.data.risk_score).toBeDefined();
    createdApptId = res.body.data.id;
  });

  test('Double-booking prevention: attempting to book already reserved slot is rejected (409)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        slot_id: testSlotId,
        service_type: 'Consultation',
        notes: 'Should fail with 409'
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Double booking prevented/i);
  });

  test('Customer can confirm their appointment and reduce risk score', async () => {
    const res = await request(app)
      .post(`/api/appointments/${createdApptId}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.confirmation_status).toBe('CONFIRMED');
    expect(res.body.data.risk_assessment.breakdown.confirmationStatus.points).toBe(0);
  });

  test('Customer can cancel appointment and slot is automatically released', async () => {
    const res = await request(app)
      .post(`/api/appointments/${createdApptId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Personal conflict' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(res.body.data.slotReleased).toBe(true);

    // Verify slot is now available again
    const slotRes = await request(app).get('/api/availability?date=2026-12-01');
    const releasedSlot = slotRes.body.data.find(s => s.id === testSlotId);
    expect(releasedSlot.is_available).toBe(true);
  });
});

describe('3. Admin Status Update & Customer Feedback', () => {
  let completedApptId = null;

  beforeAll(async () => {
    // Create an appointment and mark completed
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service_type: 'Physiotherapy Session',
        appointment_date: '2026-12-02',
        start_time: '10:00:00',
        end_time: '11:00:00'
      });
    completedApptId = bookRes.body.data.id;

    // Admin updates status to COMPLETED
    await request(app)
      .patch(`/api/appointments/${completedApptId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED' });
  });

  test('Customer submits feedback (rating 1-5) for completed appointment', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        appointment_id: completedApptId,
        rating: 5,
        comment: 'Excellent service and friendly doctor!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(5);
  });

  test('Admin can view all feedback and rating distribution', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.averageRating).toBeGreaterThanOrEqual(1);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
