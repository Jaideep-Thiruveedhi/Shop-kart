const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true, // stores the bcrypt HASH, never plaintext
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },

  // Lab 04 — wishlist stores ONLY Product references, never a copy of the product.
  // Product stays the single source of truth, so a price/stock/image change is
  // reflected immediately on the wishlist without migrating any user documents.
  // Existing users keep working: default [] applies to new docs and to docs
  // saved before this field existed.
  wishlist: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    default: [],
  },

  // Lab 05 — a cart needs one extra bit of data a wishlist does not: quantity.
  // Still a reference (not an embedded product snapshot) so price/stock always
  // resolve to the live Product at read time.
  cart: {
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, 'Quantity must be at least 1'],
          validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number',
          },
        },
      },
    ],
    default: [],
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }, // gives you createdAt automatically
});

module.exports = mongoose.model('Customer', customerSchema);
