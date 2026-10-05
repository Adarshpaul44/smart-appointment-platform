/**
 * Unit Tests for Explainable Rule-Based No-Show Risk Engine
 */

const RiskService = require('../src/services/riskService');
const RISK_CONFIG = require('../src/config/riskConfig');

describe('No-Show Risk Engine (Explainable Rule-Based)', () => {
  test('Low Risk Scenario: Perfect attendance customer with confirmed appointment', () => {
    const history = {
      totalAppointments: 5,
      completedCount: 5,
      noShowCount: 0,
      cancelledCount: 0
    };
    const assessment = RiskService.calculateRisk(history, 'CONFIRMED');

    expect(assessment.score).toBe(0);
    expect(assessment.level).toBe('LOW');
    expect(assessment.reasons.length).toBe(0);
  });

  test('High Risk Scenario: Repeat no-shows, low attendance rate, unconfirmed appointment', () => {
    const history = {
      totalAppointments: 4,
      completedCount: 1,
      noShowCount: 2,
      cancelledCount: 1
    };
    const assessment = RiskService.calculateRisk(history, 'UNCONFIRMED');

    // 2 no-shows = 35 pts
    // 1 cancellation = 10 pts
    // unconfirmed = 20 pts
    // attendance 1/4 (25% < 70%) = 20 pts
    // Total = 35 + 10 + 20 + 20 = 85 pts
    expect(assessment.score).toBe(85);
    expect(assessment.level).toBe('HIGH');
    expect(assessment.reasons).toContain('2 past no-shows on record');
    expect(assessment.reasons).toContain('Current appointment is not yet confirmed by customer');
    expect(assessment.reasons).toContain('Historical attendance rate is low (below 70%)');
  });

  test('Medium Risk Scenario: 1 past no-show with confirmed appointment', () => {
    const history = {
      totalAppointments: 3,
      completedCount: 2,
      noShowCount: 1,
      cancelledCount: 0
    };
    const assessment = RiskService.calculateRisk(history, 'CONFIRMED');

    // 1 no-show = 20 pts
    // 0 cancellations = 0 pts
    // confirmed = 0 pts
    // attendance 2/3 (66.7% < 70%) = 20 pts
    // Total = 40 pts -> MEDIUM RISK
    expect(assessment.score).toBe(40);
    expect(assessment.level).toBe('MEDIUM');
  });

  test('First-time customer scenario has neutral attendance penalty', () => {
    const history = {
      totalAppointments: 0,
      completedCount: 0,
      noShowCount: 0,
      cancelledCount: 0
    };
    const assessment = RiskService.calculateRisk(history, 'UNCONFIRMED');

    // 0 no-show (0) + 0 cancel (0) + unconfirmed (20) + first-time (0) = 20 pts
    expect(assessment.score).toBe(20);
    expect(assessment.level).toBe('LOW');
    expect(assessment.reasons).toContain('First-time customer with no prior appointment record');
  });
});
