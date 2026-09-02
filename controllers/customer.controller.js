const bcrypt = require('bcrypt');
const Customer = require('../models/customer.model');
const generateToken = require('../utils/generateToken');

const SALT_ROUNDS = 10;

// helper: strip password before sending customer back
function toSafeCustomer(customerDoc) {
  const obj = customerDoc.toObject();
  delete obj.password;
  return obj;
}

// POST /customers/register
async function register(req, res) {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: toSafeCustomer(customer),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// POST /customers/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    // deliberately generic message + same code path whether email or password is wrong
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(customer);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only https in prod; allows http on localhost
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day, matches JWT expiry
    });

    return res.status(200).json({ success: true, message: 'Login successful' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /customers/me  (protected)
async function getProfile(req, res) {
  return res.status(200).json(toSafeCustomer(req.user));
}

// POST /customers/logout  (protected)
async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}

// PATCH /customers/change-password (protected)
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const customer = await Customer.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    customer.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await customer.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

module.exports = { register, login, getProfile, logout, changePassword };
