const mongoose = require('mongoose');
const Product = require('../models/product.model');

// POST /products
async function createProduct(req, res) {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Manual 400 checks before Mongoose validator to match rubric exactly
    if (!name || !description || price == null || !category || !image || stock == null) {
      return res.status(400).json({ success: false, message: 'All fields are required: name, description, price, category, image, stock' });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a number greater than 0' });
    }
    if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be an integer >= 0' });
    }

    const product = await Product.create({ name, description, price, category, image, stock });

    return res.status(201).json({ success: true, product });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /products?search=&category=&sort=
async function getAllProducts(req, res) {
  try {
    const { search, category, sort } = req.query;

    // Build query dynamically — core Lab03 requirement
    const filter = {};

    if (search) {
      // Case-insensitive partial match on name
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category) {
      // Exact but case-insensitive category
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    let query = Product.find(filter);

    // Bonus: sorting via ?sort=price_asc / price_desc
    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 }); // newest first by default

    const products = await query;

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// GET /products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

module.exports = { createProduct, getAllProducts, getProductById };
