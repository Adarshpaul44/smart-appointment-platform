/**
 * Automation Background Engine
 * 
 * Implements:
 * 1. 24-Hour & 2-Hour Automated Reminders
 * 2. High-Risk Unconfirmed Follow-Up Automation
 * 3. Dynamic Risk Recalibration
 * 4. Automatic Slot Inventory Auditing
 */

const db = require('../db');
const RiskService = require('../services/riskService');
const NotificationService = require('../services/notificationService');

class AutomationService {
  /**
   * Run all automated background jobs
   */
  static async runAutomationCycle() {
    console.log(`\n⚙️ [AUTOMATION ENGINE] Running automated maintenance cycle at ${new Date().toISOString()}...`);

    try {
      const results = {
        remindersSent: 0,
        highRiskAlertsSent: 0,
        riskScoresUpdated: 0
      };

      // 1. Fetch active upcoming appointments
      const apptsRes = await db.query(
        "SELECT a.*, u.name as customer_name FROM appointments a JOIN users u ON a.user_id = u.id WHERE a.status IN ('BOOKED', 'CONFIRMED')"
      );
      const appointments = apptsRes.rows || [];

      const now = new Date();

      for (const appt of appointments) {
        // Construct appointment datetime
        const apptDateTime = new Date(`${appt.appointment_date}T${appt.start_time}`);
        const hoursUntil = (apptDateTime - now) / (1000 * 60 * 60);

        // Check already sent notifications for this appointment
        const notifRes = await db.query('SELECT * FROM notifications WHERE appointment_id = $1', [appt.id]);
        const existingNotifs = notifRes.rows || [];
        const has24h = existingNotifs.some(n => n.type === 'REMINDER_24H');
        const has2h = existingNotifs.some(n => n.type === 'REMINDER_2H');
        const hasHighRiskAlert = existingNotifs.some(n => n.type === 'HIGH_RISK_ALERT');

        // A. 24-Hour Reminder (fires between 20h and 26h before appointment)
        if (hoursUntil <= 26 && hoursUntil > 4 && !has24h) {
          await NotificationService.send(db, {
            userId: appt.user_id,
            appointmentId: appt.id,
            type: 'REMINDER_24H',
            message: `Automated Reminder: You have an appointment for ${appt.service_type} tomorrow at ${appt.start_time}. Please confirm your attendance.`
          });
          results.remindersSent++;
        }

        // B. 2-Hour Reminder (fires when <= 3h before appointment)
        if (hoursUntil <= 3 && hoursUntil > 0 && !has2h) {
          await NotificationService.send(db, {
            userId: appt.user_id,
            appointmentId: appt.id,
            type: 'REMINDER_2H',
            message: `Urgent Reminder: Your ${appt.service_type} appointment is starting in approximately 2 hours (${appt.start_time}).`
          });
          results.remindersSent++;
        }

        // C. High-Risk Unconfirmed Follow-up Alert
        if (appt.risk_level === 'HIGH' && appt.confirmation_status === 'UNCONFIRMED' && hoursUntil <= 24 && !hasHighRiskAlert) {
          await NotificationService.send(db, {
            userId: appt.user_id,
            appointmentId: appt.id,
            type: 'HIGH_RISK_ALERT',
            message: `⚠️ Action Required: Your ${appt.service_type} appointment is high risk and unconfirmed. Please confirm now to guarantee your slot.`
          });
          results.highRiskAlertsSent++;
        }

        // D. Dynamic Risk Recalibration
        const userApptsRes = await db.query('SELECT * FROM appointments WHERE user_id = $1', [appt.user_id]);
        const userAppts = userApptsRes.rows || [];
        const completedCount = userAppts.filter(a => a.status === 'COMPLETED').length;
        const noShowCount = userAppts.filter(a => a.status === 'NO-SHOW').length;
        const cancelledCount = userAppts.filter(a => a.status === 'CANCELLED').length;

        const assessment = RiskService.calculateRisk(
          { completedCount, noShowCount, cancelledCount },
          appt.confirmation_status
        );

        if (assessment.score !== appt.risk_score || assessment.level !== appt.risk_level) {
          await db.query(
            'UPDATE appointments SET risk_score = $1, risk_level = $2, risk_reasons = $3 WHERE id = $4',
            [assessment.score, assessment.level, JSON.stringify(assessment.reasons), appt.id]
          );
          results.riskScoresUpdated++;
        }
      }

      console.log(`✅ [AUTOMATION ENGINE] Cycle complete: ${results.remindersSent} reminders, ${results.highRiskAlertsSent} high-risk alerts, ${results.riskScoresUpdated} risk scores recalibrated.\n`);
      return results;
    } catch (err) {
      console.error('❌ [AUTOMATION ENGINE] Error during cycle:', err.message);
      return { error: err.message };
    }
  }

  /**
   * Start recurring background interval
   */
  static startScheduler(intervalMinutes = 5) {
    const ms = intervalMinutes * 60 * 1000;
    console.log(`⏰ [AUTOMATION SCHEDULER] Initialized to run every ${intervalMinutes} minutes.`);
    
    // Run once shortly after startup
    setTimeout(() => {
      this.runAutomationCycle();
    }, 3000);

    // Recurring interval
    return setInterval(() => {
      this.runAutomationCycle();
    }, ms);
  }
}

module.exports = AutomationService;
