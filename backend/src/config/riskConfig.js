/**
 * Rule-Based No-Show Risk Engine Configuration
 * 
 * ACADEMIC NOTICE:
 * This is a transparent rule-based prototype scoring model for educational demonstration.
 * Weights, penalty scores, and threshold bands are configurable and can be tuned or
 * calibrated against historical business data.
 */

const RISK_CONFIG = {
  // Classification thresholds
  thresholds: {
    lowMax: 30,      // 0 - 30: LOW RISK
    mediumMax: 60,   // 31 - 60: MEDIUM RISK
    highMin: 61      // 61 - 100: HIGH RISK
  },

  // Scoring weights and point penalties
  weights: {
    // Factor 1: Previous No-Show History
    previousNoShows: [
      { countMin: 3, points: 45, reason: '3 or more past no-shows on record' },
      { countMin: 2, points: 35, reason: '2 past no-shows on record' },
      { countMin: 1, points: 20, reason: '1 previous no-show on record' },
      { countMin: 0, points: 0, reason: null }
    ],

    // Factor 2: Previous Cancellation History
    previousCancellations: [
      { countMin: 3, points: 15, reason: 'High cancellation history (3+ cancelled appointments)' },
      { countMin: 1, points: 10, reason: 'Moderate cancellation history (1-2 past cancellations)' },
      { countMin: 0, points: 0, reason: null }
    ],

    // Factor 3: Current Appointment Confirmation Status
    confirmationStatus: {
      UNCONFIRMED: { points: 20, reason: 'Current appointment is not yet confirmed by customer' },
      CONFIRMED: { points: 0, reason: null }
    },

    // Factor 4: Historical Attendance Rate
    attendanceRate: [
      { rateMin: 0.90, points: 0, reason: null }, // >= 90%
      { rateMin: 0.70, points: 10, reason: 'Historical attendance rate is moderate (between 70% and 89%)' },
      { rateMin: 0.00, points: 20, reason: 'Historical attendance rate is low (below 70%)' }
    ]
  }
};

module.exports = RISK_CONFIG;
