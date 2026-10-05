const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Customer and Shared routes
router.get('/my', authenticateToken, AppointmentController.getMyAppointments);
router.get('/:id', authenticateToken, AppointmentController.getAppointmentById);
router.post('/', authenticateToken, AppointmentController.bookAppointment);
router.post('/:id/confirm', authenticateToken, AppointmentController.confirmAppointment);
router.post('/:id/cancel', authenticateToken, AppointmentController.cancelAppointment);
router.post('/:id/reschedule', authenticateToken, AppointmentController.rescheduleAppointment);

// Admin-only routes
router.get('/', authenticateToken, requireAdmin, AppointmentController.getAllAppointments);
router.patch('/:id/status', authenticateToken, requireAdmin, AppointmentController.updateStatus);
router.post('/:id/remind', authenticateToken, requireAdmin, AppointmentController.sendUrgentReminder);

module.exports = router;
