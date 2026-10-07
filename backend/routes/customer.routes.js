const express = require('express');
const router = express.Router();

const {
  register, login, getProfile, logout, changePassword,
} = require('../controllers/customer.controller');
const authenticate = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;
