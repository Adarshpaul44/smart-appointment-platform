/**
 * Risk Controller
 * 
 * Exposes explainable rule-based risk configuration,
 * interactive simulator, and system-wide risk recalculation.
 */

const RISK_CONFIG = require('../config/riskConfig');
const RiskService = require('../services/riskService');
const db = require('../db');

class RiskController {
  /**
   * Get explainable risk scoring rules and weights
   * Route: GET /api/risk/rules
   */
  static getRules(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        model: 'Rule-Based Transparent Prototype Scoring Engine',
        thresholds: RISK_CONFIG.thresholds,
        weights: RISK_CONFIG.weights,
        academicNote: 'Deterministic, transparent rule weights designed for college academic evaluation. Fully configurable.'
      }
    });
  }

  /**
   * Interactive Risk Simulator (for presentation and demonstration)
   * Route: POST /api/risk/simulate
   */
  static simulateRisk(req, res) {
    const { noShowCount = 0, cancelledCount = 0, completedCount = 0, confirmationStatus = 'UNCONFIRMED' } = req.body;

    const calculation = RiskService.calculateRisk(
      {
        noShowCount: Number(noShowCount),
        cancelledCount: Number(cancelledCount),
        completedCount: Number(completedCount)
      },
      confirmationStatus
    );

    return res.status(200).json({
      success: true,
      data: calculation
    });
  }

  /**
   * Recalculate risk for all upcoming appointments
   * Route: POST /api/risk/recalculate-all
   */
  static async recalculateAll(req, res) {
    try {
      const apptsRes = await db.query('SELECT * FROM appointments WHERE status IN (\'BOOKED\', \'CONFIRMED\')');
      const appointments = apptsRes.rows || [];

      let updatedCount = 0;
      for (const appt of appointments) {
        // Fetch user stats
        const userApptsRes = await db.query('SELECT * FROM appointments WHERE user_id = $1', [appt.user_id]);
        const userAppts = userApptsRes.rows || [];

        const completedCount = userAppts.filter(a => a.status === 'COMPLETED').length;
        const noShowCount = userAppts.filter(a => a.status === 'NO-SHOW').length;
        const cancelledCount = userAppts.filter(a => a.status === 'CANCELLED').length;

        const assessment = RiskService.calculateRisk(
          { completedCount, noShowCount, cancelledCount },
          appt.confirmation_status
        );

        await db.query(
          'UPDATE appointments SET risk_score = $1, risk_level = $2, risk_reasons = $3 WHERE id = $4',
          [assessment.score, assessment.level, JSON.stringify(assessment.reasons), appt.id]
        );
        updatedCount++;
      }

      return res.status(200).json({
        success: true,
        message: `Successfully recalculated risk for ${updatedCount} active appointments.`,
        updatedCount
      });
    } catch (err) {
      console.error('[RiskController.recalculateAll] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to recalculate risk scores.',
        error: err.message
      });
    }
  }
}

module.exports = RiskController;
