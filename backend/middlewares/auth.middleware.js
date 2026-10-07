const jwt = require('jsonwebtoken');
const Customer = require('../models/customer.model');

async function authenticate(req, res, next) {
  try {
    // Lab 02 set JWT in HttpOnly cookie; Lab 04 spec shows Authorization: Bearer.
    // Support both so Postman (header) and the React app (cookie + withCredentials) work.
    let token = req.cookies.token;
    if (!token) {
      const header = req.headers.authorization;
      if (header && header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    req.user = customer; // downstream controllers read req.user
    next();
  } catch (err) {
    // covers jwt.verify throwing (expired / tampered / malformed token)
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

module.exports = authenticate;
