/**
 * Availability Controller
 * 
 * Manages appointment slots and working hours:
 * - Customers query available slots for booking
 * - Administrators create, configure, and toggle slot availability
 */

const db = require('../db');

class AvailabilityController {
  /**
   * Get available slots for a specific date or upcoming days
   * Route: GET /api/availability
   */
  static async getAvailableSlots(req, res) {
    try {
      const { date } = req.query;

      let result;
      if (date) {
        result = await db.query(
          'SELECT * FROM availability_slots WHERE date = $1 AND is_available = true ORDER BY start_time ASC',
          [date]
        );
      } else {
        result = await db.query(
          'SELECT * FROM availability_slots ORDER BY date, start_time'
        );
      }

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } catch (err) {
      console.error('[AvailabilityController.getAvailableSlots] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve available slots.',
        error: err.message
      });
    }
  }

  /**
   * Admin: Add new availability slot
   * Route: POST /api/availability
   */
  static async createSlot(req, res) {
    try {
      const { date, start_time, end_time } = req.body;

      if (!date || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Date, start_time, and end_time are required.'
        });
      }

      const insertResult = await db.query(
        `INSERT INTO availability_slots (date, start_time, end_time, is_available)
         VALUES ($1, $2, $3, true)
         RETURNING *`,
        [date, start_time, end_time]
      );

      return res.status(201).json({
        success: true,
        message: 'Availability slot added successfully!',
        data: insertResult.rows[0]
      });
    } catch (err) {
      console.error('[AvailabilityController.createSlot] Error:', err);
      if (err.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'A slot already exists for this date and time window.'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create slot.',
        error: err.message
      });
    }
  }

  /**
   * Admin: Toggle slot availability
   * Route: PATCH /api/availability/:id/toggle
   */
  static async toggleAvailability(req, res) {
    try {
      const { id } = req.params;
      const { is_available } = req.body;

      const result = await db.query(
        'UPDATE availability_slots SET is_available = $1 WHERE id = $2 RETURNING *',
        [Boolean(is_available), id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Slot not found.' });
      }

      return res.status(200).json({
        success: true,
        message: `Slot availability updated to ${is_available}.`,
        data: result.rows[0]
      });
    } catch (err) {
      console.error('[AvailabilityController.toggleAvailability] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update slot status.',
        error: err.message
      });
    }
  }
}

module.exports = AvailabilityController;
