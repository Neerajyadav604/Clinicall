const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/AdminAnalyticsController');
const { authenticateUser, isadmin } = require('../middleware/authMiddleware');

router.get('/overview', authenticateUser, isadmin, analyticsController.overview);
router.get('/revenue', authenticateUser, isadmin, analyticsController.revenue);
router.get('/trends', authenticateUser, isadmin, analyticsController.trends);
router.get('/top-doctors', authenticateUser, isadmin, analyticsController.topDoctors);
router.get('/consultation-ratio', authenticateUser, isadmin, analyticsController.consultationRatio);

module.exports = router;