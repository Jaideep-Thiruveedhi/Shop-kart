const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

// Cart entries hold { product: ObjectId, quantity }. Quantity lives on the cart
// entry (not on Product) because it is per-customer data; price/stock are NOT
// copied here — they resolve live through populate() so the UI always shows the
// current catalogue price.
//
// Subtotal and total units are deliberately NOT stored. They are derived from
// cart state on the client (see CartContext) and recomputed on the server at
// checkout. A persisted subtotal can go stale the moment a price changes.

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Populate live product data for a saved customer document.
// We re-read the product so `stock` is fresh for quantity clamping.
async function withLiveProducts(customer) {
  return customer.populate({
    path: 'cart.product',
    select: 'name price image category stock',
  });
}

// POST /cart/:productId
// Not already in cart -> insert with quantity 1. Already in cart -> increment by 1.
// The resulting quantity is still validated against live stock.
async function addToCart(req, res) {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).select('_id name stock');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

    const line = req.user.cart.find((item) => item.product.equals(productId));

    if (line) {
      const nextQuantity = line.quantity + 1;
      if (nextQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available`,
        });
      }
      line.quantity = nextQuantity;
    } else {
      req.user.cart.push({ product: productId, quantity: 1 });
    }

    await req.user.save();
    await withLiveProducts(req.user);

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: req.user.cart,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /cart
async function getCart(req, res) {
  try {
    await withLiveProducts(req.user);

    // A product deleted after it was added leaves a null ref. Drop those rows so
    // the frontend never receives `{ product: null, quantity: 2 }`.
    const cart = req.user.cart.filter((item) => item.product);

    return res.status(200).json({ success: true, count: cart.length, cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// PATCH /cart/:productId   body: { quantity }
async function updateQuantity(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    // Reject NaN, strings and floats before any comparison happens —
    // otherwise "3" would silently pass as a valid quantity.
    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number' });
    }
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId).select('_id name stock');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const line = req.user.cart.find((item) => item.product.equals(productId));
    if (!line) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available for ${product.name}`,
      });
    }

    line.quantity = quantity;
    await req.user.save();
    await withLiveProducts(req.user);

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: req.user.cart.filter((item) => item.product),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// DELETE /cart/:productId
async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const line = req.user.cart.find((item) => item.product.equals(productId));
    if (!line) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    req.user.cart = req.user.cart.filter((item) => !item.product.equals(productId));
    await req.user.save();
    await withLiveProducts(req.user);

    // Populated for the same reason as every other cart response: the client
    // stores whatever `cart` we return as its state, so an unpopulated reply
    // would leave the UI rendering bare ObjectIds after a removal.
    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: req.user.cart.filter((item) => item.product),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// Shared helper for the checkout flow: reload the authenticated customer's cart
// with live products and drop rows whose product no longer exists.
// `dropped` lets checkout tell the customer *why* a line disappeared instead of
// silently shrinking their cart.
async function loadCartWithProducts(userId) {
  const customer = await Customer.findById(userId);
  await withLiveProducts(customer);
  const alive = customer.cart.filter((item) => item.product);
  return { customer, cart: alive, dropped: customer.cart.length - alive.length };
}

module.exports = {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
  loadCartWithProducts,
};