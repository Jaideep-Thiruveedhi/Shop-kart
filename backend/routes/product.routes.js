const express = require('express');
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
} = require('../controllers/product.controller');

// POST /products — open for lab (admin auth in later lab)
router.post('/', createProduct);

// GET /products?search=&category=&sort=
router.get('/', getAllProducts);

// GET /products/:id
router.get('/:id', getProductById);

module.exports = router;
