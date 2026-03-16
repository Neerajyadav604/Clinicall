const express = require('express');
const router = express.Router();
const { symptomAnalysis, chat } = require('../controllers/AIController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/symptoms', authenticateUser, symptomAnalysis);
router.post('/chat', authenticateUser, chat);

module.exports = router;