const express = require('express');
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/order.controller');
const authenticate = require('../middlewares/auth.middleware');

// Order routes are user-scoped: `authenticate` supplies the owner and every
// controller matches on `user: req.user._id`, so a guessed order id cannot be
// read by another customer.
router.post('/create-payment-order', authenticate, createPaymentOrder);
router.post('/verify-payment', authenticate, verifyPayment);
router.get('/', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, updateOrderStatus); // bonus, dev only

module.exports = router;