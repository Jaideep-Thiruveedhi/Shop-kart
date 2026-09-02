const jwt = require('jsonwebtoken');

function generateToken(customer) {
  return jwt.sign(
    { id: customer._id }, // payload: keep it minimal — just enough to look the user up again
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

module.exports = generateToken;
