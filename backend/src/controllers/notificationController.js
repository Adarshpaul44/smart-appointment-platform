/**
 * Notification Controller
 * 
 * Provides endpoints for users to view in-app reminders and notifications.
 */

const db = require('../db');

class NotificationController {
  /**
   * Get logged-in user's notification list
   * Route: GET /api/notifications
   */
  static async getMyNotifications(req, res) {
    try {
      const result = await db.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC',
        [req.user.id]
      );

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } catch (err) {
      console.error('[NotificationController.getMyNotifications] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications.',
        error: err.message
      });
    }
  }
}

module.exports = NotificationController;
