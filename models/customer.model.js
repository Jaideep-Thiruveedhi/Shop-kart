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
}, {
  timestamps: { createdAt: true, updatedAt: false }, // gives you createdAt automatically
});

module.exports = mongoose.model('Customer', customerSchema);
