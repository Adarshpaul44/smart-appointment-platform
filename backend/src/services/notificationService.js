/**
 * Notification Architecture Service
 * 
 * Supports:
 * 1. 'mock' mode (development): logs formatted alerts to console and saves to database notifications table
 * 2. 'aws' mode (production cloud): prepared for AWS SNS (SMS) and SES (Email)
 */

class NotificationService {
  /**
   * Dispatch a notification
   * @param {Object} db - Database client/pool
   * @param {Object} options
   * @param {number} options.userId
   * @param {number} [options.appointmentId]
   * @param {string} options.type - e.g. BOOKING_CONFIRMATION, REMINDER_24H, REMINDER_2H, HIGH_RISK_ALERT, CANCELLATION
   * @param {string} options.message
   * @param {string} [options.channel='IN_APP']
   */
  static async send(db, { userId, appointmentId = null, type, message, channel = 'IN_APP' }) {
    const provider = process.env.NOTIFICATION_PROVIDER || 'mock';

    // 1. Always record in database so user and admin can see in-app notifications
    let notificationRecord = null;
    try {
      const res = await db.query(
        `INSERT INTO notifications (user_id, appointment_id, type, message, channel, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, 'SENT', CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, appointmentId, type, message, channel]
      );
      notificationRecord = res.rows[0];
    } catch (err) {
      console.error('[NotificationService] Error saving notification to DB:', err.message);
    }

    // 2. Dispatch to external channel
    if (provider === 'aws') {
      await this.dispatchAwsNotification({ userId, appointmentId, type, message, channel });
    } else {
      this.dispatchMockNotification({ userId, appointmentId, type, message, channel });
    }

    return notificationRecord;
  }

  /**
   * Development Mock Dispatcher: pretty console log
   */
  static dispatchMockNotification({ userId, appointmentId, type, message, channel }) {
    const timestamp = new Date().toISOString();
    console.log(`\n🔔 [NOTIFICATION DISPATCH - MOCK DEV ENGINE]`);
    console.log(`   Time:    ${timestamp}`);
    console.log(`   User:    #${userId}`);
    console.log(`   Appt:    #${appointmentId || 'N/A'}`);
    console.log(`   Type:    ${type}`);
    console.log(`   Channel: ${channel}`);
    console.log(`   Content: "${message}"\n`);
  }

  /**
   * AWS SNS/SES Cloud Dispatcher Blueprint
   */
  static async dispatchAwsNotification({ userId, appointmentId, type, message, channel }) {
    console.log(`[AWS Notification] SNS/SES payload prepared for User #${userId}: ${type}`);
    // Prepared for AWS SDK SNS.publish / SES.sendEmail
    // if (process.env.AWS_SNS_TOPIC_ARN) { ... }
  }
}

module.exports = NotificationService;
