const express = require('express');
const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require('../controllers/wishlist.controller');
const authenticate = require('../middlewares/auth.middleware');

// Every wishlist endpoint is protected. The customer identity comes from the
// JWT cookie via `authenticate` — there is deliberately no GET /wishlist/:userId
// because the client must never choose whose wishlist it reads.
router.post('/:productId', authenticate, addToWishlist);
router.get('/', authenticate, getWishlist);
router.delete('/:productId', authenticate, removeFromWishlist);
router.patch('/:productId/toggle', authenticate, toggleWishlist); // bonus

module.exports = router;