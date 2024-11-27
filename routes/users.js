const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { profileUpdateValidationRules, validate } = require('../middleware/validators');
const { updateProfile } = require('../controllers/profileController');

/**
 * @route   PUT /api/users/profile
 * @desc    프로필 업데이트
 * @access  Private
 */
router.put(
  '/profile',
  auth,
  profileUpdateValidationRules(),
  validate,
  updateProfile
);

module.exports = router;