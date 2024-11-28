const express = require('express');
const router = express.Router();
const { getHealthStats } = require('../controllers/healthInfoStatsController');
const auth = require('../middleware/auth');
const { validateDateRange, validate } = require('../middleware/validators');

// GET /api/health-info/stats
router.get('/', 
    auth,
    validateDateRange(),
    validate,
    getHealthStats
);

module.exports = router; 