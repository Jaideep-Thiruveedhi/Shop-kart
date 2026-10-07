const Razorpay = require('razorpay');

// Razorpay's SDK needs the Key Secret, so this module may ONLY ever be imported
// by backend code. Never import it into React, never echo these values into a
// response body. The frontend gets `key` (Key ID) only, because Checkout.js
// requires it to open the modal.
//
// The client is created lazily on first use: the SDK throws at construction time
// when key_id is missing, and we do not want an unconfigured .env to stop the
// rest of the API (auth, products, wishlist, cart) from booting.
let client = null;

function assertConfigured() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env (Test Mode keys).'
    );
    err.status = 500;
    throw err;
  }
}

function getRazorpay() {
  assertConfigured();
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

module.exports = { getRazorpay, assertConfigured };