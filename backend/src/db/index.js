/**
 * Database Module with Dual-Mode Resilience
 * 
 * 1. Primary: PostgreSQL (via pg.Pool) for Docker, RDS, and production.
 * 2. Fallback: In-memory relational mock store for immediate local zero-setup development,
 *    so students and evaluators can run the full system without needing a local PostgreSQL daemon.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool = null;
let useFallback = false;

// In-Memory Database Store (Used if PostgreSQL is not active)
const memoryStore = {
  users: [],
  availability_slots: [],
  appointments: [],
  appointment_history: [],
  notifications: [],
  feedback: [],
  sequences: {
    users: 1,
    availability_slots: 1,
    appointments: 1,
    appointment_history: 1,
    notifications: 1,
    feedback: 1
  }
};

/**
 * Seed initial mock data into memoryStore
 */
async function seedMemoryStore() {
  const hashAdmin = await bcrypt.hash('Admin@123', 10);
  const hashUser = await bcrypt.hash('Password@123', 10);

  // Users
  memoryStore.users = [
    {
      id: 1,
      name: 'Dr. Sarah Connor (Admin)',
      email: 'admin@appointment.com',
      password_hash: hashAdmin,
      role: 'admin',
      phone: '+1-555-0100',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 2,
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      password_hash: hashUser,
      role: 'customer',
      phone: '+1-555-0101',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 3,
      name: 'John Davis',
      email: 'john.davis@example.com',
      password_hash: hashUser,
      role: 'customer',
      phone: '+1-555-0102',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 4,
      name: 'Bob Brown',
      email: 'bob.brown@example.com',
      password_hash: hashUser,
      role: 'customer',
      phone: '+1-555-0103',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: 5,
      name: 'Adarsh Paul . T',
      email: 'adarsh@vitstudent.ac.in',
      password_hash: hashUser,
      role: 'customer',
      phone: '+91-9876543210',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    }
  ];
  memoryStore.sequences.users = 6;

  // Helper date generators
  const today = new Date();
  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  // Availability Slots for tomorrow and upcoming days
  const slotDates = [formatDate(0), formatDate(1), formatDate(2), formatDate(3)];
  const times = [
    { start: '09:00:00', end: '10:00:00' },
    { start: '10:00:00', end: '11:00:00' },
    { start: '11:30:00', end: '12:30:00' },
    { start: '14:00:00', end: '15:00:00' },
    { start: '15:30:00', end: '16:30:00' }
  ];

  let slotId = 1;
  for (const date of slotDates) {
    for (const time of times) {
      memoryStore.availability_slots.push({
        id: slotId++,
        date,
        start_time: time.start,
        end_time: time.end,
        is_available: true,
        created_at: new Date().toISOString()
      });
    }
  }
  memoryStore.sequences.availability_slots = slotId;

  // Historical Appointments for Risk Profiles:
  // Alice: 3 Completed, 0 No-Shows, 0 Cancelled (100% attendance -> LOW RISK)
  // John: 1 Completed, 2 No-Shows, 1 Cancelled (<70% attendance -> HIGH RISK)
  // Bob: 2 Completed, 0 No-Shows, 1 Cancelled (Medium attendance -> MEDIUM RISK)

  let apptId = 1;
  const pastPastDate = formatDate(-10);
  const pastDate = formatDate(-5);
  const tomorrow = formatDate(1);
  const dayAfter = formatDate(2);

  // Past for Alice (Low risk history)
  memoryStore.appointments.push({
    id: apptId++,
    user_id: 2,
    slot_id: null,
    service_type: 'General Health Checkup',
    appointment_date: pastPastDate,
    start_time: '10:00:00',
    end_time: '11:00:00',
    status: 'COMPLETED',
    confirmation_status: 'CONFIRMED',
    risk_score: 0,
    risk_level: 'LOW',
    risk_reasons: JSON.stringify(['Confirmed in advance']),
    notes: 'Regular checkup',
    created_at: pastPastDate,
    updated_at: pastPastDate
  });

  memoryStore.feedback.push({
    id: 1,
    appointment_id: 1,
    user_id: 2,
    rating: 5,
    comment: 'Punctual and very thorough consultation!',
    created_at: pastPastDate
  });

  // Past for John (High risk history: 2 no-shows, 1 cancellation)
  memoryStore.appointments.push({
    id: apptId++,
    user_id: 3,
    slot_id: null,
    service_type: 'Dental Consultation',
    appointment_date: pastPastDate,
    start_time: '14:00:00',
    end_time: '15:00:00',
    status: 'NO-SHOW',
    confirmation_status: 'UNCONFIRMED',
    risk_score: 45,
    risk_level: 'MEDIUM',
    risk_reasons: JSON.stringify(['1 previous no-show on record', 'Unconfirmed']),
    notes: 'Did not attend or notify',
    created_at: pastPastDate,
    updated_at: pastPastDate
  });

  memoryStore.appointments.push({
    id: apptId++,
    user_id: 3,
    slot_id: null,
    service_type: 'Dental Cleaning',
    appointment_date: pastDate,
    start_time: '11:30:00',
    end_time: '12:30:00',
    status: 'NO-SHOW',
    confirmation_status: 'UNCONFIRMED',
    risk_score: 65,
    risk_level: 'HIGH',
    risk_reasons: JSON.stringify(['2 past no-shows on record', 'Attendance rate below 70%']),
    notes: 'No-show for second time',
    created_at: pastDate,
    updated_at: pastDate
  });

  // Upcoming Appointment for John (Tomorrow - High Risk demonstration)
  memoryStore.appointments.push({
    id: apptId++,
    user_id: 3,
    slot_id: 6, // tomorrow 09:00
    service_type: 'Orthodontics Review',
    appointment_date: tomorrow,
    start_time: '09:00:00',
    end_time: '10:00:00',
    status: 'BOOKED',
    confirmation_status: 'UNCONFIRMED',
    risk_score: 85,
    risk_level: 'HIGH',
    risk_reasons: JSON.stringify([
      '2 past no-shows on record',
      'Current appointment is not yet confirmed by customer',
      'Historical attendance rate is low (below 70%)'
    ]),
    notes: 'High risk - follow-up required',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Mark slot 6 as unavailable
  const slot6 = memoryStore.availability_slots.find(s => s.id === 6);
  if (slot6) slot6.is_available = false;

  // Upcoming Appointment for Alice (Tomorrow - Low Risk demonstration)
  memoryStore.appointments.push({
    id: apptId++,
    user_id: 2,
    slot_id: 7, // tomorrow 10:00
    service_type: 'Cardiology Follow-up',
    appointment_date: tomorrow,
    start_time: '10:00:00',
    end_time: '11:00:00',
    status: 'CONFIRMED',
    confirmation_status: 'CONFIRMED',
    risk_score: 0,
    risk_level: 'LOW',
    risk_reasons: JSON.stringify([]),
    notes: 'Confirmed by patient',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const slot7 = memoryStore.availability_slots.find(s => s.id === 7);
  if (slot7) slot7.is_available = false;

  // Upcoming Appointment for Adarsh Paul (Day after tomorrow)
  memoryStore.appointments.push({
    id: apptId++,
    user_id: 5,
    slot_id: 11, // day after tomorrow 09:00
    service_type: 'Routine Wellness Check',
    appointment_date: dayAfter,
    start_time: '09:00:00',
    end_time: '10:00:00',
    status: 'BOOKED',
    confirmation_status: 'UNCONFIRMED',
    risk_score: 20,
    risk_level: 'LOW',
    risk_reasons: JSON.stringify([
      'Current appointment is not yet confirmed by customer',
      'First-time customer with no prior appointment record'
    ]),
    notes: 'Initial visit',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const slot11 = memoryStore.availability_slots.find(s => s.id === 11);
  if (slot11) slot11.is_available = false;

  memoryStore.sequences.appointments = apptId;
  memoryStore.sequences.feedback = 2;

  // Initial Notifications
  memoryStore.notifications.push(
    {
      id: 1,
      user_id: 3,
      appointment_id: 4,
      type: 'REMINDER_24H',
      message: 'Reminder: You have an appointment tomorrow at 09:00 AM. Please confirm your attendance.',
      channel: 'IN_APP',
      status: 'SENT',
      sent_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 5,
      appointment_id: 6,
      type: 'BOOKING_CONFIRMATION',
      message: 'Your Routine Wellness Check appointment is scheduled for ' + dayAfter + ' at 09:00 AM.',
      channel: 'IN_APP',
      status: 'SENT',
      sent_at: new Date().toISOString()
    }
  );
  memoryStore.sequences.notifications = 3;
}

/**
 * Execute query against in-memory store
 */
function executeMemoryQuery(text, params = []) {
  const cleanSql = text.trim().replace(/\s+/g, ' ');
  const lowerSql = cleanSql.toLowerCase();

  // 1. SELECT USERS BY EMAIL
  if (lowerSql.startsWith('select * from users where email = $1')) {
    const user = memoryStore.users.find(u => u.email.toLowerCase() === (params[0] || '').toLowerCase());
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 2. SELECT USER BY ID
  if (lowerSql.startsWith('select * from users where id = $1') || lowerSql.startsWith('select id, name, email, role, phone, created_at from users where id = $1')) {
    const user = memoryStore.users.find(u => u.id === Number(params[0]));
    if (!user) return { rows: [], rowCount: 0 };
    const safeUser = { ...user };
    delete safeUser.password_hash;
    return { rows: [safeUser], rowCount: 1 };
  }

  // 3. INSERT INTO USERS
  if (lowerSql.startsWith('insert into users')) {
    const [name, email, password_hash, role, phone] = params;
    // check duplicate email
    if (memoryStore.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error('User with this email already exists');
      err.code = '23505'; // PostgreSQL unique_violation code
      throw err;
    }
    const newUser = {
      id: memoryStore.sequences.users++,
      name,
      email,
      password_hash,
      role: role || 'customer',
      phone: phone || null,
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return { rows: [{ ...newUser }], rowCount: 1 };
  }

  // 4. SELECT ALL USERS / CUSTOMERS (Admin)
  if (lowerSql.startsWith('select id, name, email, role, phone, created_at from users')) {
    let list = memoryStore.users.map(u => {
      const copy = { ...u };
      delete copy.password_hash;
      return copy;
    });
    if (lowerSql.includes("role = 'customer'") || (params[0] === 'customer')) {
      list = list.filter(u => u.role === 'customer');
    }
    return { rows: list, rowCount: list.length };
  }

  // 5. AVAILABILITY SLOTS QUERIES
  if (lowerSql.startsWith('select * from availability_slots where date = $1 and is_available = true')) {
    const date = params[0];
    const slots = memoryStore.availability_slots.filter(s => s.date === date && s.is_available);
    slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return { rows: slots, rowCount: slots.length };
  }

  if (lowerSql.startsWith('select * from availability_slots') && lowerSql.includes('order by date, start_time')) {
    const slots = [...memoryStore.availability_slots];
    slots.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
    return { rows: slots, rowCount: slots.length };
  }

  if (lowerSql.startsWith('select * from availability_slots where id = $1')) {
    const slot = memoryStore.availability_slots.find(s => s.id === Number(params[0]));
    return { rows: slot ? [{ ...slot }] : [], rowCount: slot ? 1 : 0 };
  }

  if (lowerSql.startsWith('update availability_slots set is_available = $1 where id = $2')) {
    const [is_available, slotId] = params;
    const slot = memoryStore.availability_slots.find(s => s.id === Number(slotId));
    if (slot) slot.is_available = Boolean(is_available);
    return { rows: slot ? [{ ...slot }] : [], rowCount: slot ? 1 : 0 };
  }

  if (lowerSql.startsWith('insert into availability_slots')) {
    const [date, start_time, end_time, is_available] = params;
    const existing = memoryStore.availability_slots.find(
      s => s.date === date && s.start_time === start_time && s.end_time === end_time
    );
    if (existing) {
      const err = new Error('Slot already exists for this date and time');
      err.code = '23505';
      throw err;
    }
    const newSlot = {
      id: memoryStore.sequences.availability_slots++,
      date,
      start_time,
      end_time,
      is_available: is_available !== undefined ? is_available : true,
      created_at: new Date().toISOString()
    };
    memoryStore.availability_slots.push(newSlot);
    return { rows: [newSlot], rowCount: 1 };
  }

  // 6. APPOINTMENTS QUERIES
  if (lowerSql.startsWith('select a.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone from appointments a join users u on a.user_id = u.id')) {
    let results = memoryStore.appointments.map(a => {
      const user = memoryStore.users.find(u => u.id === a.user_id);
      return {
        ...a,
        customer_name: user ? user.name : 'Unknown',
        customer_email: user ? user.email : '',
        customer_phone: user ? user.phone : ''
      };
    });

    if (lowerSql.includes('where a.user_id = $1')) {
      const uid = Number(params[0]);
      results = results.filter(r => r.user_id === uid);
    } else if (lowerSql.includes('where a.risk_level = $1')) {
      const level = params[0];
      results = results.filter(r => r.risk_level === level);
    }

    results.sort((a, b) => (b.appointment_date + b.start_time).localeCompare(a.appointment_date + a.start_time));
    return { rows: results, rowCount: results.length };
  }

  if (lowerSql.startsWith('select * from appointments where id = $1')) {
    const appt = memoryStore.appointments.find(a => a.id === Number(params[0]));
    return { rows: appt ? [{ ...appt }] : [], rowCount: appt ? 1 : 0 };
  }

  if (lowerSql.startsWith('select * from appointments where user_id = $1')) {
    const uid = Number(params[0]);
    const list = memoryStore.appointments.filter(a => a.user_id === uid);
    return { rows: list, rowCount: list.length };
  }

  // Insert Appointment
  if (lowerSql.startsWith('insert into appointments')) {
    const [userId, slotId, serviceType, date, start, end, status, confStatus, score, level, reasons, notes] = params;
    const newAppt = {
      id: memoryStore.sequences.appointments++,
      user_id: Number(userId),
      slot_id: slotId ? Number(slotId) : null,
      service_type: serviceType,
      appointment_date: date,
      start_time: start,
      end_time: end,
      status: status || 'BOOKED',
      confirmation_status: confStatus || 'UNCONFIRMED',
      risk_score: score || 0,
      risk_level: level || 'LOW',
      risk_reasons: typeof reasons === 'string' ? reasons : JSON.stringify(reasons || []),
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.appointments.push(newAppt);
    return { rows: [{ ...newAppt }], rowCount: 1 };
  }

  // Update Appointment Status
  if (lowerSql.startsWith('update appointments set status = $1, confirmation_status = $2, updated_at = current_timestamp where id = $3')) {
    const [status, confStatus, id] = params;
    const appt = memoryStore.appointments.find(a => a.id === Number(id));
    if (appt) {
      appt.status = status;
      appt.confirmation_status = confStatus;
      appt.updated_at = new Date().toISOString();
    }
    return { rows: appt ? [{ ...appt }] : [], rowCount: appt ? 1 : 0 };
  }

  // Update Risk Score
  if (lowerSql.startsWith('update appointments set risk_score = $1, risk_level = $2, risk_reasons = $3, updated_at = current_timestamp where id = $4')) {
    const [score, level, reasons, id] = params;
    const appt = memoryStore.appointments.find(a => a.id === Number(id));
    if (appt) {
      appt.risk_score = score;
      appt.risk_level = level;
      appt.risk_reasons = typeof reasons === 'string' ? reasons : JSON.stringify(reasons);
      appt.updated_at = new Date().toISOString();
    }
    return { rows: appt ? [{ ...appt }] : [], rowCount: appt ? 1 : 0 };
  }

  // Reschedule Appointment
  if (lowerSql.startsWith('update appointments set slot_id = $1, appointment_date = $2, start_time = $3, end_time = $4, status = $5, confirmation_status = $6, updated_at = current_timestamp where id = $7')) {
    const [slotId, date, start, end, status, confStatus, id] = params;
    const appt = memoryStore.appointments.find(a => a.id === Number(id));
    if (appt) {
      appt.slot_id = slotId ? Number(slotId) : null;
      appt.appointment_date = date;
      appt.start_time = start;
      appt.end_time = end;
      appt.status = status;
      appt.confirmation_status = confStatus;
      appt.updated_at = new Date().toISOString();
    }
    return { rows: appt ? [{ ...appt }] : [], rowCount: appt ? 1 : 0 };
  }

  // 7. APPOINTMENT HISTORY
  if (lowerSql.startsWith('insert into appointment_history')) {
    const [apptId, oldStatus, newStatus, changedBy, note] = params;
    const historyItem = {
      id: memoryStore.sequences.appointment_history++,
      appointment_id: Number(apptId),
      old_status: oldStatus,
      new_status: newStatus,
      changed_by_user_id: changedBy ? Number(changedBy) : null,
      note: note || null,
      changed_at: new Date().toISOString()
    };
    memoryStore.appointment_history.push(historyItem);
    return { rows: [historyItem], rowCount: 1 };
  }

  if (lowerSql.startsWith('select * from appointment_history where appointment_id = $1')) {
    const apptId = Number(params[0]);
    const items = memoryStore.appointment_history.filter(h => h.appointment_id === apptId);
    items.sort((a, b) => b.changed_at.localeCompare(a.changed_at));
    return { rows: items, rowCount: items.length };
  }

  // 8. NOTIFICATIONS
  if (lowerSql.startsWith('insert into notifications')) {
    const [userId, apptId, type, message, channel] = params;
    const notif = {
      id: memoryStore.sequences.notifications++,
      user_id: Number(userId),
      appointment_id: apptId ? Number(apptId) : null,
      type,
      message,
      channel: channel || 'IN_APP',
      status: 'SENT',
      sent_at: new Date().toISOString()
    };
    memoryStore.notifications.push(notif);
    return { rows: [notif], rowCount: 1 };
  }

  if (lowerSql.startsWith('select * from notifications where user_id = $1')) {
    const userId = Number(params[0]);
    const list = memoryStore.notifications.filter(n => n.user_id === userId);
    list.sort((a, b) => b.sent_at.localeCompare(a.sent_at));
    return { rows: list, rowCount: list.length };
  }

  // 9. FEEDBACK
  if (lowerSql.startsWith('insert into feedback')) {
    const [apptId, userId, rating, comment] = params;
    const existing = memoryStore.feedback.find(f => f.appointment_id === Number(apptId));
    if (existing) {
      const err = new Error('Feedback already submitted for this appointment');
      err.code = '23505';
      throw err;
    }
    const item = {
      id: memoryStore.sequences.feedback++,
      appointment_id: Number(apptId),
      user_id: Number(userId),
      rating: Number(rating),
      comment: comment || null,
      created_at: new Date().toISOString()
    };
    memoryStore.feedback.push(item);
    return { rows: [item], rowCount: 1 };
  }

  if (lowerSql.startsWith('select f.*, u.name as customer_name, a.service_type from feedback f')) {
    const list = memoryStore.feedback.map(f => {
      const user = memoryStore.users.find(u => u.id === f.user_id);
      const appt = memoryStore.appointments.find(a => a.id === f.appointment_id);
      return {
        ...f,
        customer_name: user ? user.name : 'Customer',
        service_type: appt ? appt.service_type : 'Service'
      };
    });
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { rows: list, rowCount: list.length };
  }

  // Default empty return
  return { rows: [], rowCount: 0 };
}

/**
 * Initialize Database Layer
 */
async function initDb() {
  const { Pool } = require('pg');
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'appointment_db'}`;

  try {
    const testPool = new Pool({
      connectionString,
      connectionTimeoutMillis: 2000
    });
    
    // Test connectivity
    await testPool.query('SELECT 1');
    pool = testPool;
    useFallback = false;
    console.log('✅ [Database] Successfully connected to PostgreSQL database!');

    // Run schema if tables don't exist
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✅ [Database] PostgreSQL schema verified/initialized.');
  } catch (err) {
    useFallback = true;
    console.log('⚠️ [Database] PostgreSQL server not reachable locally (' + err.message + ').');
    console.log('🚀 [Database] Activating fast resilient in-memory database store for local dev/testing.');
    await seedMemoryStore();
    console.log('✅ [Database] In-memory database seeded with sample users, appointments & slots.');
  }
}

/**
 * Universal Query function
 */
async function query(text, params = []) {
  if (useFallback || !pool) {
    return executeMemoryQuery(text, params);
  }
  return pool.query(text, params);
}

module.exports = {
  initDb,
  query,
  isFallback: () => useFallback,
  getMemoryStore: () => memoryStore
};
