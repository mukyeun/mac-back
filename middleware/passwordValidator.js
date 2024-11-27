const logger = require('../utils/logger');

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

const passwordValidator = (req, res, next) => {
  const { password } = req.body;

  if (!validatePassword(password)) {
    logger.warn('Password validation failed', {
      ip: req.ip,
      path: req.path
    });

    return res.status(400).json({
      status: 'error',
      message: '비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.'
    });
  }

  next();
};

module.exports = { passwordValidator };
