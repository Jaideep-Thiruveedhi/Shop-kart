require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);

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
