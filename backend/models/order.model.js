const mongoose = require('mongoose');

// An order is a HISTORICAL RECORD of a purchase, not a live view of the catalogue.
// That is why each item snapshots name/price/image at purchase time while still
// holding a live `product` reference for navigation.
//
//   Today   Keyboard = ₹2,999  ->  order stores price 2999
//   Next mth Keyboard = ₹3,499  ->  this order STILL shows ₹2,999
//
// The cart can do the opposite (always resolve live Product data) because a cart
// is temporary. An order must stay meaningful even if the product is renamed,
// repriced or deleted later.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Order item name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Order item price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Order item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'An order must contain at least one item',
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Calculated on the server from the LATEST product prices. Never trusted
    // from the request body.
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },

    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },

    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'],
      default: 'PENDING_PAYMENT',
    },

    // Identifiers only. Card details / CVV are NEVER stored — they live with Razorpay.
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    failureReason: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);