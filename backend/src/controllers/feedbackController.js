/**
 * Feedback Controller
 * 
 * Enables customers to rate and review completed appointments (1-5 stars).
 * Provides aggregated ratings and feedback analysis to administrators.
 */

const db = require('../db');

class FeedbackController {
  /**
   * Submit feedback for a completed appointment
   * Route: POST /api/feedback
   */
  static async submitFeedback(req, res) {
    try {
      const { appointment_id, rating, comment } = req.body;
      const userId = req.user.id;

      if (!appointment_id || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Appointment ID and rating (1-5) are required.'
        });
      }

      const numRating = Number(rating);
      if (numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5 stars.'
        });
      }

      // Check appointment existence and completion status
      const apptRes = await db.query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
      if (apptRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      const appointment = apptRes.rows[0];
      if (appointment.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'You can only leave feedback for your own appointments.' });
      }

      if (appointment.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Feedback can only be submitted for COMPLETED appointments.'
        });
      }

      const insertRes = await db.query(
        `INSERT INTO feedback (appointment_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [appointment_id, userId, numRating, comment || null]
      );

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your feedback has been recorded.',
        data: insertRes.rows[0]
      });
    } catch (err) {
      console.error('[FeedbackController.submitFeedback] Error:', err);
      if (err.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'You have already submitted feedback for this appointment.'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to record feedback.',
        error: err.message
      });
    }
  }

  /**
   * Admin: Get all feedback with statistical summary
   * Route: GET /api/feedback
   */
  static async getAllFeedback(req, res) {
    try {
      const result = await db.query(
        `SELECT f.*, u.name as customer_name, a.service_type 
         FROM feedback f 
         JOIN users u ON f.user_id = u.id 
         JOIN appointments a ON f.appointment_id = a.id 
         ORDER BY f.created_at DESC`
      );

      const items = result.rows || [];
      const totalReviews = items.length;
      const averageRating = totalReviews > 0
        ? (items.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
        : 0;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      items.forEach(i => {
        if (ratingDistribution[i.rating] !== undefined) {
          ratingDistribution[i.rating]++;
        }
      });

      return res.status(200).json({
        success: true,
        summary: {
          totalReviews,
          averageRating: Number(averageRating),
          ratingDistribution
        },
        data: items
      });
    } catch (err) {
      console.error('[FeedbackController.getAllFeedback] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve feedback list.',
        error: err.message
      });
    }
  }
}

module.exports = FeedbackController;
