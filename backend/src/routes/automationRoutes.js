const express = require('express');
const router = express.Router();
const AutomationService = require('../services/automationService');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Trigger automation on-demand (useful for demos and automated testing)
router.post('/run', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const results = await AutomationService.runAutomationCycle();
    return res.status(200).json({
      success: true,
      message: 'Automation cycle executed successfully.',
      data: results
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Automation execution failed.',
      error: err.message
    });
  }
});

module.exports = router;
