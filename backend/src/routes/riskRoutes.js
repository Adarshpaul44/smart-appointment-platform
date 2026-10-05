const express = require('express');
const router = express.Router();
const RiskController = require('../controllers/riskController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public/Explainable rules documentation endpoint
router.get('/rules', RiskController.getRules);

// Interactive Simulator endpoint
router.post('/simulate', RiskController.simulateRisk);

// Admin-only bulk recalculation
router.post('/recalculate-all', authenticateToken, requireAdmin, RiskController.recalculateAll);

module.exports = router;
