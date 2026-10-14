require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();

// Cross-origin policy for the React dev server.
//
// Why this needs care: when a browser calls this API from an origin that is NOT
// allowed, the request still arrives and still returns 200 with the correct JSON
// — but the response comes back WITHOUT an Access-Control-Allow-Origin header,
// so the browser refuses to hand it to JavaScript. axios then rejects with a
// bare "Network Error" (err.response is undefined), Products.jsx shows its
// generic error state, and Register.jsx reports a failure, while the DevTools
// Network tab still shows a perfectly successful 200. That mismatch is the
// symptom to look for.
//
// Hardcoding port numbers here is what made that trap so easy to fall into:
// Vite silently falls back to 5174, 5175, ... whenever its default port is busy,
// so a pinned list breaks without any code change. In development we therefore
// accept ANY port on the loopback host and only fall back to the explicit
// CORS_ORIGINS list when those are provided. In production the loopback
// shortcut is disabled and CORS_ORIGINS must list the real frontend host.
const EXPLICIT_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  // Same-origin / non-browser clients (curl, Postman) send no Origin header.
  if (!origin) return true;
  if (EXPLICIT_ORIGINS.includes(origin)) return true;

  if (process.env.NODE_ENV === 'production') return false;

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

// NOTE the callback signature. When `origin` is a function, cors calls it as
// fn(requestOrigin, cb) and waits for cb() — the return VALUE is ignored. A
// plain `origin: isAllowedOrigin` boolean function would leave cb uncalled and
// every request would hang until it timed out, so the predicate and the
// callback form must be kept together.
app.use(cors({
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
// Lab 04-06: all three routers carry their own `authenticate` middleware.
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopkart';
const RETRY_MS = 5000;

let server = null;

async function connectWithRetry() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`[DB] Connected to MongoDB at ${MONGO_URI}`);

    // Start HTTP server only after DB is ready
    if (!server) {
      server = app.listen(PORT, () => {
        console.log(`ShopKart auth service running on port ${PORT}`);
      });
    }
  } catch (err) {
    // Highly descriptive — tells the dev exactly what to do on Windows
    console.error('\n[DB] MongoDB connection failed:', err.message);
    console.error('[DB] Reason: Mongoose could not reach MongoDB at', MONGO_URI);
    console.error('[DB] Fix (local Windows):');
    console.error('  1. Check if MongoDB is installed:  mongod --version');
    console.error('  2. Check service status:            Get-Service MongoDB  OR  sc query MongoDB');
    console.error('  3. Start the service (Admin PS):    net start MongoDB');
    console.error('     Or:  Start-Service MongoDB  (or: mongod --dbpath \"C:\\data\\db\"  for manual run)');
    console.error('  4. Verify:                          mongosh --eval \"db.runCommand({ ping: 1 })\"');
    console.error('[DB] Fix (cloud): use a MongoDB Atlas URI in .env — see README/.env.example');
    console.error(`[DB] Retrying in ${RETRY_MS / 1000}s... (app stays up, no crash)\n`);

    // Retry after 5s instead of exiting — keeps the process alive for nodemon / manual fix
    setTimeout(connectWithRetry, RETRY_MS);
  }
}

// Mongoose runtime error after initial connect (e.g., Atlas network blip)
mongoose.connection.on('error', (err) => {
  console.error('[DB] Mongoose runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] Mongoose disconnected. Will retry...');
});

// Graceful shutdown — close server + DB on Ctrl+C / SIGTERM
function gracefulShutdown(signal) {
  console.log(`\n[App] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close(false);
        console.log('[DB] MongoDB connection closed.');
      } catch (e) {
        console.error('[DB] Error closing MongoDB:', e.message);
      } finally {
        process.exit(0);
      }
    });
  } else {
    mongoose.connection.close(false).finally(() => process.exit(0));
  }
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Unhandled rejections — log instead of silent crash
process.on('unhandledRejection', (reason) => {
  console.error('[App] Unhandled Rejection:', reason);
});

connectWithRetry();

module.exports = app;
