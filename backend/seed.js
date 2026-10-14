/**
 * Seeds the product catalogue so a fresh clone has something to browse.
 *
 *   npm run seed            # add the sample products
 *   npm run seed -- --force # wipe the catalogue first, then re-add
 *
 * Idempotent by design: it refuses to insert anything if products already
 * exist, so re-running it cannot silently duplicate the catalogue. It also
 * never touches the `customers` collection — seeding must not disturb real
 * accounts, wishlists or carts.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Product = require('./models/product.model');

const FORCE = process.argv.includes('--force');

const products = [
  {
    name: 'Logitech MX Master 3S Wireless Mouse',
    description: 'Quiet-click ergonomic mouse with an 8000 DPI sensor, USB-C charging and MagSpeed scrolling. Works across three devices with Easy-Switch.',
    price: 9499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
    stock: 24,
  },
  {
    name: 'Keychron K8 Pro Mechanical Keyboard',
    description: 'Hot-swappable 87-key TKL keyboard with wireless Bluetooth, PBT keycaps and south-facing RGB. Mac and Windows layouts included.',
    price: 7999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
    stock: 15,
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise cancellation with eight microphones, 30-hour battery and multipoint Bluetooth pairing.',
    price: 29990,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    stock: 8,
  },
  {
    name: 'boAt Airdopes 141 TWS Earbuds',
    description: 'True wireless earbuds with 42 hours of total playback, ENx environmental noise cancellation and low-latency gaming mode.',
    price: 1299,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80',
    stock: 60,
  },
  {
    name: 'Apple MacBook Air 13 (M2, 8GB/256GB)',
    description: '13.6-inch Liquid Retina display, Apple M2 chip with 8-core CPU and 10-core GPU, 18-hour battery, 256GB SSD.',
    price: 114900,
    category: 'Laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
    stock: 5,
  },
  {
    name: 'Dell XPS 13 Plus (i7, 16GB/512GB)',
    description: '13.4-inch InfinityEdge OLED touch display, 12th-gen Intel Core i7, 16GB LPDDR5 and a 512GB SSD in an aluminium chassis.',
    price: 165000,
    category: 'Laptops',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&q=80',
    stock: 3,
  },
  {
    name: 'Levis 501 Original Fit Jeans',
    description: 'Classic straight-fit denim in mid-stretch cotton. Button fly, five-pocket styling, machine washable.',
    price: 3499,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    stock: 40,
  },
  {
    name: 'Nike Revolution 7 Running Shoes',
    description: 'Lightweight neutral-cushion trainers with a breathable mesh upper and a rubber outsole tuned for daily road running.',
    price: 4999,
    category: 'Footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    stock: 32,
  },
  {
    name: 'Fossil Gen 6 Smartwatch (46mm)',
    description: 'Wear OS smartwatch with GPS, heart-rate and sleep tracking, 5ATM water resistance and a 36-hour battery.',
    price: 14995,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    stock: 12,
  },
  {
    name: 'Samsung Galaxy Buds FE',
    description: 'Featherweight earbuds with ANC, 30-hour battery with the case and an IPX2 water-resistance rating.',
    price: 4499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80',
    stock: 50,
  },
];

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopkart';

  console.log(`[Seed] Connecting to ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('[Seed] Connected.');

  if (FORCE) {
    const { deletedCount } = await Product.deleteMany({});
    console.log(`[Seed] --force: removed ${deletedCount} existing product(s).`);
  }

  const existing = await Product.countDocuments();
  if (existing > 0) {
    console.log(`[Seed] Skipped — ${existing} product(s) already in the catalogue.`);
    console.log('[Seed] Re-run with `npm run seed -- --force` to replace them.');
    return;
  }

  const inserted = await Product.insertMany(products);
  console.log(`[Seed] Inserted ${inserted.length} products.`);
  console.log('[Seed] Done. Start the backend and open http://localhost:5173/products');

  // close() with force=false waits for in-flight ops; safe because we awaited
  // every write above, so there is nothing left to flush.
  await mongoose.connection.close(false);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[Seed] Failed:', err.message);
    console.error('[Seed] Is MongoDB running? Check with:  sc query MongoDB');
    console.error('[Seed] Fix MONGO_URI in backend/.env if you are using Atlas.\n');
    mongoose.connection.close(false).finally(() => process.exit(1));
  });