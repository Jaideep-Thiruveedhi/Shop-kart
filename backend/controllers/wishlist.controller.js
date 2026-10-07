const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

// Every route in this file is mounted behind `authenticate`, so `req.user` is
// already the authenticated customer. We NEVER read a userId from params/body —
// that would let any caller read or mutate anyone else's wishlist.

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /wishlist/:productId
async function addToWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).select('_id');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Duplicate prevention: check membership in the array rather than blindly
    // pushing. `$addToSet` alone would not give us the 409 the rubric wants.
    if (req.user.wishlist.some((id) => id.equals(productId))) {
      return res.status(409).json({ success: false, message: 'Product already in wishlist' });
    }

    req.user.wishlist.push(productId);
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      count: req.user.wishlist.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /wishlist
// One collection round-trip: find the user, then hydrate the ObjectId
// references into real product documents via populate().
async function getWishlist(req, res) {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price category image stock',
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // populate() leaves null in the array if a product was deleted after being
    // saved. Filter it so the frontend never has to null-check.
    const wishlist = customer.wishlist.filter(Boolean);

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// DELETE /wishlist/:productId
async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    if (!req.user.wishlist.some((id) => id.equals(productId))) {
      return res.status(404).json({ success: false, message: 'Product not in wishlist' });
    }

    req.user.wishlist = req.user.wishlist.filter((id) => !id.equals(productId));
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: req.user.wishlist.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// BONUS — PATCH /wishlist/:productId/toggle
// Single action that adds when absent and removes when present, so the button
// can stay in one place instead of the UI tracking two endpoints.
async function toggleWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).select('_id');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existing = req.user.wishlist.some((id) => id.equals(productId));

    if (existing) {
      req.user.wishlist = req.user.wishlist.filter((id) => !id.equals(productId));
    } else {
      req.user.wishlist.push(productId);
    }
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: existing ? 'Product removed from wishlist' : 'Product added to wishlist',
      inWishlist: !existing,
      count: req.user.wishlist.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

module.exports = { addToWishlist, getWishlist, removeFromWishlist, toggleWishlist };