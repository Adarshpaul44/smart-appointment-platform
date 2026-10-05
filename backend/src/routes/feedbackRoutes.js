const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedbackController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, FeedbackController.submitFeedback);
router.get('/', authenticateToken, requireAdmin, FeedbackController.getAllFeedback);

module.exports = router;
