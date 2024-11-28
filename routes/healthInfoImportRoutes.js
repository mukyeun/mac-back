const express = require('express');
const router = express.Router();
const { importHealthInfo } = require('../controllers/healthInfoImportController');
const auth = require('../middleware/auth');
const { csvUpload } = require('../middleware/upload');

router.post('/',
  auth,
  csvUpload.single('file'),
  importHealthInfo
);

module.exports = router; 