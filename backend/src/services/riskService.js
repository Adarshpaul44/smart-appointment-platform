/**
 * Explainable Rule-Based No-Show Risk Engine
 * 
 * Purpose:
 * Evaluates the risk that a customer will not attend their scheduled appointment.
 * Operates purely on transparent, explainable deterministic business rules.
 */

const RISK_CONFIG = require('../config/riskConfig');

class RiskService {
  /**
   * Calculate no-show risk score for an appointment
   * @param {Object} customerHistory - Past stats for the customer
   * @param {number} customerHistory.totalAppointments
   * @param {number} customerHistory.completedCount
   * @param {number} customerHistory.noShowCount
   * @param {number} customerHistory.cancelledCount
   * @param {string} confirmationStatus - 'CONFIRMED' or 'UNCONFIRMED'
   * @returns {Object} { score, level, reasons, breakdown, model }
   */
  static calculateRisk(customerHistory = {}, confirmationStatus = 'UNCONFIRMED') {
    const {
      totalAppointments = 0,
      completedCount = 0,
      noShowCount = 0,
      cancelledCount = 0
    } = customerHistory;

    let score = 0;
    const reasons = [];
    const breakdown = {};

    // 1. Previous No-Shows Factor
    let noShowPoints = 0;
    let noShowReason = null;
    for (const rule of RISK_CONFIG.weights.previousNoShows) {
      if (noShowCount >= rule.countMin) {
        noShowPoints = rule.points;
        noShowReason = rule.reason;
        break;
      }
    }
    score += noShowPoints;
    breakdown.previousNoShows = { count: noShowCount, points: noShowPoints };
    if (noShowReason) {
      reasons.push(noShowReason);
    }

    // 2. Previous Cancellations Factor
    let cancellationPoints = 0;
    let cancellationReason = null;
    for (const rule of RISK_CONFIG.weights.previousCancellations) {
      if (cancelledCount >= rule.countMin) {
        cancellationPoints = rule.points;
        cancellationReason = rule.reason;
        break;
      }
    }
    score += cancellationPoints;
    breakdown.previousCancellations = { count: cancelledCount, points: cancellationPoints };
    if (cancellationReason) {
      reasons.push(cancellationReason);
    }

    // 3. Current Appointment Confirmation Status
    const isConfirmed = confirmationStatus === 'CONFIRMED';
    const confRule = isConfirmed 
      ? RISK_CONFIG.weights.confirmationStatus.CONFIRMED 
      : RISK_CONFIG.weights.confirmationStatus.UNCONFIRMED;
    score += confRule.points;
    breakdown.confirmationStatus = { status: confirmationStatus, points: confRule.points };
    if (confRule.reason) {
      reasons.push(confRule.reason);
    }

    // 4. Historical Attendance Rate
    const pastConcluded = completedCount + noShowCount + cancelledCount;
    let attendancePoints = 0;
    let attendanceReason = null;
    let attendanceRate = null;

    if (pastConcluded > 0) {
      attendanceRate = completedCount / pastConcluded;
      for (const rule of RISK_CONFIG.weights.attendanceRate) {
        if (attendanceRate >= rule.rateMin) {
          attendancePoints = rule.points;
          attendanceReason = rule.reason;
          break;
        }
      }
    } else {
      // First-time customer: neutral 0 points
      attendancePoints = 0;
      attendanceReason = 'First-time customer with no prior appointment record';
    }

    score += attendancePoints;
    breakdown.attendanceRate = { 
      ratePercent: attendanceRate !== null ? Math.round(attendanceRate * 100) : null, 
      points: attendancePoints 
    };
    if (attendanceReason) {
      reasons.push(attendanceReason);
    }

    // Bound score between 0 and 100
    const finalScore = Math.min(Math.max(score, 0), 100);

    // Determine classification level
    let level = 'LOW';
    if (finalScore >= RISK_CONFIG.thresholds.highMin) {
      level = 'HIGH';
    } else if (finalScore > RISK_CONFIG.thresholds.lowMax) {
      level = 'MEDIUM';
    }

    return {
      score: finalScore,
      level,
      reasons,
      breakdown,
      model: 'Rule-Based Prototype Scoring Model v1.0',
      disclaimer: 'Transparent heuristic model. Thresholds are configurable.'
    };
  }
}

module.exports = RiskService;
