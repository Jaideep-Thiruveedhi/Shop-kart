const express = require('express');
const router = express.Router();

const {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
} = require('../controllers/cart.controller');
const authenticate = require('../middlewares/auth.middleware');

// All cart routes are user-scoped and protected: the owner is always the JWT
// subject, never a client-supplied id.
router.post('/:productId', authenticate, addToCart);
router.get('/', authenticate, getCart);
router.patch('/:productId', authenticate, updateQuantity);
router.delete('/:productId', authenticate, removeFromCart);

module.exports = router;