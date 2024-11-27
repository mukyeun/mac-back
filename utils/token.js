const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-default-secret-key',
    { expiresIn: '24h' }
  );
};

module.exports = { generateToken }; 