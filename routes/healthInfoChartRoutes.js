const express = require('express');
const router = express.Router();
const { 
    getChartData 
} = require('../controllers/healthInfoChartController');
const auth = require('../middleware/auth');
const { 
    validateDateRange, 
    validate,
    validateMetricType 
} = require('../middleware/validators');

// GET /api/health-info/chart/:metric
router.get('/:metric',
    auth,
    validateMetricType(),
    validateDateRange(),
    validate,
    getChartData
);

module.exports = router; 