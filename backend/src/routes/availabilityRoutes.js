const express = require('express');
const router = express.Router();
const AvailabilityController = require('../controllers/availabilityController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public/Customer: View slots
router.get('/', AvailabilityController.getAvailableSlots);

// Admin-only: Create and toggle slots
router.post('/', authenticateToken, requireAdmin, AvailabilityController.createSlot);
router.patch('/:id/toggle', authenticateToken, requireAdmin, AvailabilityController.toggleAvailability);

module.exports = router;
