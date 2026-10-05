/**
 * Appointment Controller
 * 
 * Manages full appointment lifecycle:
 * - Booking with double-booking prevention
 * - Confirmation and risk recalibration
 * - Cancellation with automatic slot release
 * - Rescheduling
 * - Audit logging in appointment_history
 * - Notifications dispatch
 */

const db = require('../db');
const RiskService = require('../services/riskService');
const NotificationService = require('../services/notificationService');

/**
 * Helper to get customer's past appointment history statistics
 */
async function getCustomerHistoryStats(userId) {
  const result = await db.query(
    'SELECT * FROM appointments WHERE user_id = $1',
    [userId]
  );
  const appts = result.rows || [];

  const completedCount = appts.filter(a => a.status === 'COMPLETED').length;
  const noShowCount = appts.filter(a => a.status === 'NO-SHOW').length;
  const cancelledCount = appts.filter(a => a.status === 'CANCELLED').length;
  const totalAppointments = appts.length;

  return {
    totalAppointments,
    completedCount,
    noShowCount,
    cancelledCount
  };
}

class AppointmentController {
  /**
   * Get logged-in customer's appointments
   * Route: GET /api/appointments/my
   */
  static async getMyAppointments(req, res) {
    try {
      const result = await db.query(
        `SELECT a.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.user_id = $1`,
        [req.user.id]
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } catch (err) {
      console.error('[AppointmentController.getMyAppointments] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointments.',
        error: err.message
      });
    }
  }

  /**
   * Admin: Get all appointments with optional filters and search
   * Route: GET /api/appointments
   */
  static async getAllAppointments(req, res) {
    try {
      const { status, risk_level, search, date } = req.query;

      const result = await db.query(
        `SELECT a.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id`
      );

      let appointments = result.rows;

      // Filter by status
      if (status && status !== 'ALL') {
        appointments = appointments.filter(a => a.status.toUpperCase() === status.toUpperCase());
      }

      // Filter by risk level
      if (risk_level && risk_level !== 'ALL') {
        appointments = appointments.filter(a => a.risk_level.toUpperCase() === risk_level.toUpperCase());
      }

      // Filter by date
      if (date) {
        appointments = appointments.filter(a => a.appointment_date === date);
      }

      // Search by customer name, email, or service
      if (search && search.trim()) {
        const queryTerm = search.toLowerCase().trim();
        appointments = appointments.filter(a => 
          (a.customer_name && a.customer_name.toLowerCase().includes(queryTerm)) ||
          (a.customer_email && a.customer_email.toLowerCase().includes(queryTerm)) ||
          (a.service_type && a.service_type.toLowerCase().includes(queryTerm))
        );
      }

      return res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments
      });
    } catch (err) {
      console.error('[AppointmentController.getAllAppointments] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointments list.',
        error: err.message
      });
    }
  }

  /**
   * Get single appointment with audit history
   * Route: GET /api/appointments/:id
   */
  static async getAppointmentById(req, res) {
    try {
      const { id } = req.params;
      const apptResult = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);

      if (apptResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found.'
        });
      }

      const appointment = apptResult.rows[0];

      // Ensure customers can only view their own appointment
      if (req.user.role !== 'admin' && appointment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You may only view your own appointment.'
        });
      }

      // Fetch history audit trail
      const historyResult = await db.query(
        'SELECT * FROM appointment_history WHERE appointment_id = $1 ORDER BY changed_at DESC',
        [id]
      );

      // Parse risk reasons if string
      let parsedReasons = appointment.risk_reasons;
      if (typeof parsedReasons === 'string') {
        try { parsedReasons = JSON.parse(parsedReasons); } catch (e) { parsedReasons = []; }
      }

      return res.status(200).json({
        success: true,
        data: {
          ...appointment,
          risk_reasons: parsedReasons,
          history: historyResult.rows
        }
      });
    } catch (err) {
      console.error('[AppointmentController.getAppointmentById] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve appointment details.',
        error: err.message
      });
    }
  }

  /**
   * Book a new appointment
   * Route: POST /api/appointments
   */
  static async bookAppointment(req, res) {
    try {
      const userId = req.user.id;
      const { slot_id, service_type, notes, appointment_date, start_time, end_time } = req.body;

      if (!service_type) {
        return res.status(400).json({
          success: false,
          message: 'Service type is required.'
        });
      }

      let apptDate = appointment_date;
      let apptStart = start_time;
      let apptEnd = end_time;

      // 1. If booked via slot_id, verify slot exists and prevent double booking
      if (slot_id) {
        const slotRes = await db.query('SELECT * FROM availability_slots WHERE id = $1', [slot_id]);
        if (slotRes.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Selected appointment slot does not exist.'
          });
        }

        const slot = slotRes.rows[0];
        if (!slot.is_available) {
          return res.status(409).json({
            success: false,
            message: 'This slot has already been booked by another user. Double booking prevented.'
          });
        }

        apptDate = slot.date;
        apptStart = slot.start_time;
        apptEnd = slot.end_time;

        // Reserve slot
        await db.query('UPDATE availability_slots SET is_available = $1 WHERE id = $2', [false, slot_id]);
      } else if (!apptDate || !apptStart || !apptEnd) {
        return res.status(400).json({
          success: false,
          message: 'Either slot_id or explicit date and start/end time must be provided.'
        });
      }

      // 2. Calculate initial explainable risk score
      const customerStats = await getCustomerHistoryStats(userId);
      const riskAssessment = RiskService.calculateRisk(customerStats, 'UNCONFIRMED');

      // 3. Store appointment
      const insertResult = await db.query(
        `INSERT INTO appointments 
         (user_id, slot_id, service_type, appointment_date, start_time, end_time, status, confirmation_status, risk_score, risk_level, risk_reasons, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          userId,
          slot_id || null,
          service_type,
          apptDate,
          apptStart,
          apptEnd,
          'BOOKED',
          'UNCONFIRMED',
          riskAssessment.score,
          riskAssessment.level,
          JSON.stringify(riskAssessment.reasons),
          notes || null
        ]
      );

      const createdAppointment = insertResult.rows[0];

      // 4. Record audit history
      await db.query(
        `INSERT INTO appointment_history (appointment_id, old_status, new_status, changed_by_user_id, note)
         VALUES ($1, NULL, 'BOOKED', $2, 'Initial booking created')`,
        [createdAppointment.id, userId]
      );

      // 5. Send notification
      await NotificationService.send(db, {
        userId,
        appointmentId: createdAppointment.id,
        type: 'BOOKING_CONFIRMATION',
        message: `Your ${service_type} appointment is booked for ${apptDate} at ${apptStart}. Please confirm prior to arrival.`
      });

      return res.status(201).json({
        success: true,
        message: 'Appointment successfully booked!',
        data: {
          ...createdAppointment,
          risk_assessment: riskAssessment
        }
      });
    } catch (err) {
      console.error('[AppointmentController.bookAppointment] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to book appointment.',
        error: err.message
      });
    }
  }

  /**
   * Confirm an appointment
   * Route: POST /api/appointments/:id/confirm
   */
  static async confirmAppointment(req, res) {
    try {
      const { id } = req.params;
      const apptRes = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);

      if (apptRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      const appointment = apptRes.rows[0];

      // Ownership check for customers
      if (req.user.role !== 'admin' && appointment.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to confirm this appointment.' });
      }

      if (appointment.status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'Cannot confirm a cancelled appointment.' });
      }

      // Recalculate Risk Score with confirmation status = CONFIRMED
      const customerStats = await getCustomerHistoryStats(appointment.user_id);
      const riskAssessment = RiskService.calculateRisk(customerStats, 'CONFIRMED');

      // Update appointment status to CONFIRMED
      await db.query(
        'UPDATE appointments SET status = $1, confirmation_status = $2, updated_at = current_timestamp WHERE id = $3',
        ['CONFIRMED', 'CONFIRMED', id]
      );

      // Update risk score
      await db.query(
        'UPDATE appointments SET risk_score = $1, risk_level = $2, risk_reasons = $3, updated_at = current_timestamp WHERE id = $4',
        [riskAssessment.score, riskAssessment.level, JSON.stringify(riskAssessment.reasons), id]
      );

      // Record audit history
      await db.query(
        `INSERT INTO appointment_history (appointment_id, old_status, new_status, changed_by_user_id, note)
         VALUES ($1, $2, 'CONFIRMED', $3, 'Customer confirmed attendance')`,
        [id, appointment.status, req.user.id]
      );

      // Dispatch notification
      await NotificationService.send(db, {
        userId: appointment.user_id,
        appointmentId: Number(id),
        type: 'ATTENDANCE_CONFIRMED',
        message: `Attendance confirmed for your appointment on ${appointment.appointment_date} at ${appointment.start_time}. Thank you!`
      });

      return res.status(200).json({
        success: true,
        message: 'Appointment confirmed successfully! No-show risk updated.',
        data: {
          id: Number(id),
          status: 'CONFIRMED',
          confirmation_status: 'CONFIRMED',
          risk_assessment: riskAssessment
        }
      });
    } catch (err) {
      console.error('[AppointmentController.confirmAppointment] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to confirm appointment.',
        error: err.message
      });
    }
  }

  /**
   * Cancel an appointment (Automatic Slot Recovery)
   * Route: POST /api/appointments/:id/cancel
   */
  static async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const apptRes = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);

      if (apptRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      const appointment = apptRes.rows[0];

      if (req.user.role !== 'admin' && appointment.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this appointment.' });
      }

      if (appointment.status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'Appointment is already cancelled.' });
      }

      const oldStatus = appointment.status;

      // Update appointment status to CANCELLED
      await db.query(
        'UPDATE appointments SET status = $1, confirmation_status = $2, updated_at = current_timestamp WHERE id = $3',
        ['CANCELLED', 'UNCONFIRMED', id]
      );

      // AUTOMATIC SLOT RELEASE: Make slot available again for other customers!
      if (appointment.slot_id) {
        await db.query('UPDATE availability_slots SET is_available = $1 WHERE id = $2', [true, appointment.slot_id]);
        console.log(`♻️ [SLOT RECOVERY] Slot #${appointment.slot_id} released automatically.`);
      }

      // Record audit history
      await db.query(
        `INSERT INTO appointment_history (appointment_id, old_status, new_status, changed_by_user_id, note)
         VALUES ($1, $2, 'CANCELLED', $3, $4)`,
        [id, oldStatus, req.user.id, reason || 'Cancelled by user']
      );

      // Dispatch notification
      await NotificationService.send(db, {
        userId: appointment.user_id,
        appointmentId: Number(id),
        type: 'CANCELLATION',
        message: `Your appointment for ${appointment.appointment_date} has been cancelled. The time slot has been returned to available inventory.`
      });

      return res.status(200).json({
        success: true,
        message: 'Appointment cancelled. Slot was automatically released for other users.',
        data: {
          id: Number(id),
          status: 'CANCELLED',
          slotReleased: Boolean(appointment.slot_id)
        }
      });
    } catch (err) {
      console.error('[AppointmentController.cancelAppointment] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel appointment.',
        error: err.message
      });
    }
  }

  /**
   * Reschedule an appointment
   * Route: POST /api/appointments/:id/reschedule
   */
  static async rescheduleAppointment(req, res) {
    try {
      const { id } = req.params;
      const { new_slot_id, new_date, new_start_time, new_end_time } = req.body;

      const apptRes = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
      if (apptRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      const appointment = apptRes.rows[0];

      if (req.user.role !== 'admin' && appointment.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to reschedule this appointment.' });
      }

      let targetDate = new_date;
      let targetStart = new_start_time;
      let targetEnd = new_end_time;

      if (new_slot_id) {
        const slotRes = await db.query('SELECT * FROM availability_slots WHERE id = $1', [new_slot_id]);
        if (slotRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Selected new slot does not exist.' });
        }
        const newSlot = slotRes.rows[0];
        if (!newSlot.is_available) {
          return res.status(409).json({ success: false, message: 'Selected new slot is already booked.' });
        }

        targetDate = newSlot.date;
        targetStart = newSlot.start_time;
        targetEnd = newSlot.end_time;

        // Reserve new slot
        await db.query('UPDATE availability_slots SET is_available = $1 WHERE id = $2', [false, new_slot_id]);
      }

      // Release old slot if exists
      if (appointment.slot_id) {
        await db.query('UPDATE availability_slots SET is_available = $1 WHERE id = $2', [true, appointment.slot_id]);
      }

      // Recalculate Risk for rescheduled booking
      const customerStats = await getCustomerHistoryStats(appointment.user_id);
      const riskAssessment = RiskService.calculateRisk(customerStats, 'UNCONFIRMED');

      // Update appointment
      await db.query(
        `UPDATE appointments 
         SET slot_id = $1, appointment_date = $2, start_time = $3, end_time = $4, status = $5, confirmation_status = $6, updated_at = current_timestamp 
         WHERE id = $7`,
        [new_slot_id || null, targetDate, targetStart, targetEnd, 'BOOKED', 'UNCONFIRMED', id]
      );

      await db.query(
        'UPDATE appointments SET risk_score = $1, risk_level = $2, risk_reasons = $3, updated_at = current_timestamp WHERE id = $4',
        [riskAssessment.score, riskAssessment.level, JSON.stringify(riskAssessment.reasons), id]
      );

      // Audit history
      await db.query(
        `INSERT INTO appointment_history (appointment_id, old_status, new_status, changed_by_user_id, note)
         VALUES ($1, $2, 'BOOKED', $3, 'Rescheduled to ${targetDate} ${targetStart}')`,
        [id, appointment.status, req.user.id]
      );

      // Notification
      await NotificationService.send(db, {
        userId: appointment.user_id,
        appointmentId: Number(id),
        type: 'RESCHEDULED',
        message: `Your appointment has been rescheduled to ${targetDate} at ${targetStart}.`
      });

      return res.status(200).json({
        success: true,
        message: 'Appointment successfully rescheduled!',
        data: {
          id: Number(id),
          appointment_date: targetDate,
          start_time: targetStart,
          end_time: targetEnd,
          status: 'BOOKED',
          risk_assessment: riskAssessment
        }
      });
    } catch (err) {
      console.error('[AppointmentController.rescheduleAppointment] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to reschedule appointment.',
        error: err.message
      });
    }
  }

  /**
   * Admin: Update appointment status (COMPLETED, NO-SHOW, etc.)
   * Route: PATCH /api/appointments/:id/status
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const validStatuses = ['BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO-SHOW'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const apptRes = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
      if (apptRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      const appointment = apptRes.rows[0];
      const oldStatus = appointment.status;

      // Update status
      await db.query(
        'UPDATE appointments SET status = $1, confirmation_status = $2, updated_at = current_timestamp WHERE id = $3',
        [status, appointment.confirmation_status, id]
      );

      // If marked CANCELLED, release slot
      if (status === 'CANCELLED' && appointment.slot_id) {
        await db.query('UPDATE availability_slots SET is_available = $1 WHERE id = $2', [true, appointment.slot_id]);
      }

      // Record audit history
      await db.query(
        `INSERT INTO appointment_history (appointment_id, old_status, new_status, changed_by_user_id, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, oldStatus, status, req.user.id, note || `Status updated to ${status} by admin`]
      );

      // If COMPLETED, invite feedback
      if (status === 'COMPLETED') {
        await NotificationService.send(db, {
          userId: appointment.user_id,
          appointmentId: Number(id),
          type: 'FEEDBACK_REQUEST',
          message: `Thank you for visiting! Please take a moment to rate your experience for ${appointment.service_type}.`
        });
      }

      return res.status(200).json({
        success: true,
        message: `Appointment status updated to ${status}.`,
        data: { id: Number(id), oldStatus, newStatus: status }
      });
    } catch (err) {
      console.error('[AppointmentController.updateStatus] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update appointment status.',
        error: err.message
      });
    }
  }

  /**
   * Admin: Trigger manual urgent reminder / follow-up for high risk appointment
   * Route: POST /api/appointments/:id/remind
   */
  static async sendUrgentReminder(req, res) {
    try {
      const { id } = req.params;
      const apptRes = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);

      if (apptRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      const appointment = apptRes.rows[0];

      // Dispatch urgent reminder notification
      await NotificationService.send(db, {
        userId: appointment.user_id,
        appointmentId: Number(id),
        type: 'HIGH_RISK_ALERT',
        message: `URGENT REMINDER: Your ${appointment.service_type} appointment is tomorrow at ${appointment.start_time}. Please confirm your attendance now to prevent slot forfeiture.`
      });

      return res.status(200).json({
        success: true,
        message: 'Urgent follow-up reminder dispatched successfully!'
      });
    } catch (err) {
      console.error('[AppointmentController.sendUrgentReminder] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to dispatch reminder.',
        error: err.message
      });
    }
  }
}

module.exports = AppointmentController;
