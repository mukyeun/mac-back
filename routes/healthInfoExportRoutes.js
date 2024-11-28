const express = require('express');
const router = express.Router();
const { exportHealthInfo } = require('../controllers/healthInfoExportController');
const auth = require('../middleware/auth');
const { exportValidationRules, validate } = require('../middleware/validators');

// GET /api/health-info/export
router.get('/',
    auth,
    exportValidationRules(),
    validate,
    exportHealthInfo
);

module.exports = router;