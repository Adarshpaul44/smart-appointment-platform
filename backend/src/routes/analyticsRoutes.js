const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard', authenticateToken, requireAdmin, AnalyticsController.getDashboardAnalytics);
router.get('/customers', authenticateToken, requireAdmin, AnalyticsController.getCustomersSummary);

module.exports = router;
