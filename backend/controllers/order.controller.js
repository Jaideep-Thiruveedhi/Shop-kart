const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/order.model');
const { getRazorpay, assertConfigured } = require('../config/razorpay');
const { loadCartWithProducts } = require('./cart.controller');

const PHONE_RE = /^[0-9]{10}$/;
const PINCODE_RE = /^[0-9]{6}$/;
const SHIPPING_FIELDS = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Server-side validation of the shipping block. Runs BEFORE any DB write or
// Razorpay call so a bad address never creates a half-finished order.
function validateShippingAddress(shippingAddress) {
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return { ok: false, message: 'Shipping address is required' };
  }

  const cleaned = {};
  for (const field of SHIPPING_FIELDS) {
    const value = shippingAddress[field];
    if (typeof value !== 'string' || value.trim() === '') {
      return { ok: false, message: `${field} is required` };
    }
    cleaned[field] = value.trim();
  }

  // Accept +91 / spaces / dashes, then require the 10-digit national number.
  const phoneDigits = cleaned.phone.replace(/[\s-]/g, '').replace(/^(\+91|91)/, '');
  if (!PHONE_RE.test(phoneDigits)) {
    return { ok: false, message: 'Phone must be a valid 10-digit number' };
  }
  cleaned.phone = phoneDigits;

  if (!PINCODE_RE.test(cleaned.pincode)) {
    return { ok: false, message: 'Pincode must contain 6 digits' };
  }

  return { ok: true, value: cleaned };
}

// POST /orders/create-payment-order
//
// Order of operations matters:
//   1. authenticate              (middleware — req.user is the owner)
//   2. reload cart from MongoDB  (client cart state is never trusted)
//   3. reload Product documents  (prices/stock may have moved since add-to-cart)
//   4. re-verify stock           (cart can hold a now-unsatisfiable quantity)
//   5. compute total on server   (any totalAmount in the body is ignored)
//   6. snapshot items into an Order (PENDING_PAYMENT)
//   7. create the Razorpay order (amount in paise)
// The cart is NOT cleared here — only after the payment signature verifies.
async function createPaymentOrder(req, res) {
  try {
    const validation = validateShippingAddress(req.body.shippingAddress);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { customer, cart, dropped } = await loadCartWithProducts(req.user._id);

    if (dropped > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more products in your cart no longer exist. Please review your cart.',
      });
    }
    if (cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Final stock check against live data.
    for (const item of cart) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} left.`,
        });
      }
    }

    // Server owns pricing: total = sum(latest price x quantity).
    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const items = cart.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
    }));

    // Reuse an existing pending order so a retry after a failed/abandoned
    // payment does not litter the orders history with duplicate rows.
    let order = await Order.findOne({
      user: req.user._id,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT',
    });

    if (order) {
      order.items = items;
      order.shippingAddress = validation.value;
      order.totalAmount = totalAmount;
      order.failureReason = undefined;
    } else {
      // Deliberately NOT saved yet — see the Razorpay call below.
      order = new Order({
        user: req.user._id,
        items,
        shippingAddress: validation.value,
        totalAmount,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
      });
    }

    assertConfigured();

    // Razorpay works in the smallest currency unit: ₹1 -> 100 paise.
    // This runs BEFORE the save so a Razorpay outage leaves no half-written
    // order in the database. Mongoose assigns _id at construction time, so an
    // unsaved order can still be used as the receipt reference.
    const razorpayOrder = await getRazorpay().orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // Key ID is public (Checkout.js needs it). Key Secret is never returned.
    return res.status(200).json({
      success: true,
      message: 'Payment order created',
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      totalAmount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Could not start payment. Please try again.' });
  }
}

// POST /orders/verify-payment
//
// The browser's success callback proves nothing on its own — anyone can POST
// { razorpay_payment_id: "fake" }. The HMAC signature is the proof, because only
// Razorpay (holding the secret) can produce it.
async function verifyPayment(req, res) {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!shopKartOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification details' });
    }
    if (!isValidObjectId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Ownership is part of the query, so another user's order id is simply not
    // found — we never leak whether it exists.
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Idempotent: a retried verification must not double-charge the customer or
    // re-clear the cart.
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, message: 'Payment already verified', order });
    }

    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Payment does not match this order' });
    }

    // Sign the order id STORED IN OUR DB, never the one in the request body.
    const body = `${order.razorpayOrderId}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(String(razorpay_signature), 'utf8');

    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      order.paymentStatus = 'FAILED';
      order.failureReason = 'Invalid payment signature';
      await order.save();
      // Cart intentionally untouched — a failed payment must not lose the cart.
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    order.failureReason = undefined;
    await order.save();

    // Only now — after verified payment — is it safe to empty the cart.
    req.user.cart = [];
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified. Order placed successfully.',
      order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Payment verification failed. Please try again.' });
  }
}

// GET /orders — newest first
async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /orders/:id — scoped to the authenticated user
async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// BONUS — dev-only status progression. Blocked in production so it can never be
// used to skip fulfilment in a real deployment.
const STATUS_FLOW = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

async function updateOrderStatus(req, res) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not available in production' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STATUS_FLOW.join(', ')}`,
      });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Cannot update an unpaid order' });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};