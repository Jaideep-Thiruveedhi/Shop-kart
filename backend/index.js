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
const requireDatabase = require('./middlewares/db.middleware');

const app = express();

// Cross-origin policy for the React frontend.
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
// Hardcoding port numbers in the allow-list is what made that trap so easy to
// fall into: Vite silently falls back to 5174, 5175, ... whenever its default
// port is busy, so a pinned list breaks without any code change. In development
// we therefore accept ANY port on the loopback host and fall back to the
// explicit CORS_ORIGINS list when one is provided. In production the loopback
// shortcut is disabled and CORS_ORIGINS must list the real frontend host.
//
// An origin arrives in several shapes: "https://x.com", "https://x.com/", with a
// trailing comma, or with stray spaces from a copy-pasted env var. The browser
// only ever sends the canonical `scheme://host[:port]` with NO trailing slash, so
// every configured value is normalised the same way before comparison. Getting
// this wrong is invisible in the code and fatal in production: `https://x.com/`
// never matches `https://x.com`, the browser withholds the response, and the app
// reports a bare "Network Error".
function normaliseOrigin(value) {
  return String(value).trim().replace(/\/+$/, '');
}

const EXPLICIT_ORIGINS = [...new Set(
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(normaliseOrigin)
    .filter(Boolean),
)];

function isAllowedOrigin(origin) {
  // Same-origin / non-browser clients (curl, Postman, server-to-server) send no
  // Origin header at all, and there is nothing to allow-list against.
  if (!origin) return true;

  const candidate = normaliseOrigin(origin);
  if (EXPLICIT_ORIGINS.includes(candidate)) return true;

  // In production the loopback shortcut stays OFF: a deployed API must only
  // answer the origins its operator listed.
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const { hostname } = new URL(candidate);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

// Raised when a browser sends an Origin that is not allow-listed. Passing the
// error to the cors callback makes the rejection explicit (403 + JSON) instead of
// silently omitting Access-Control-Allow-Origin, which the browser reports as an
// unexplained "Network Error" with a perfectly healthy 200 in the Network tab.
class DisallowedOriginError extends Error {
  constructor(origin) {
    super(`Origin not allowed: ${origin}`);
    this.name = 'DisallowedOriginError';
    this.status = 403;
    this.origin = origin;
  }
}

// NOTE the callback signature. When `origin` is a function, cors calls it as
// fn(requestOrigin, cb) and waits for cb() — the return VALUE is ignored. A
// plain `origin: isAllowedOrigin` boolean function would leave cb uncalled and
// every request would hang until it timed out, so the predicate and the
// callback form must be kept together.
//
// `credentials: true` is required: the JWT rides in a cookie, and without it the
// browser neither stores nor sends the cookie, so every protected call is a 401.
// It is also why `Access-Control-Allow-Origin: *` is not an option — the spec
// forbids a wildcard when credentials are involved.
app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new DisallowedOriginError(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(cookieParser());
// Liveness + readiness in one place. /health answers as soon as the process is
// listening, which is what a host (or a grader hitting the deployed URL) needs to
// tell "the API is fine, the database isn't" apart from "nothing is running
// here". It returns 200 only when Mongo is actually connected.
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';

  return res.status(state === 'connected' ? 200 : 503).json({
    success: state === 'connected',
    service: 'shopkart-api',
    database: state,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get('/', (req, res) => res.json({
  success: true,
  service: 'ShopKart API',
  message: 'Backend is running. See /health for database status.',
  endpoints: ['/health', '/customers', '/products', '/wishlist', '/cart', '/orders'],
}));

// Every router below needs Mongo. `requireDatabase` turns "DB still
// connecting" into an explicit 503 instead of a request that hangs until
// Mongoose's own command-buffer timeout expires.
app.use('/customers', requireDatabase, customerRoutes);
app.use('/products', requireDatabase, productRoutes);
// Lab 04-06: all three routers carry their own `authenticate` middleware.
app.use('/wishlist', requireDatabase, wishlistRoutes);
app.use('/cart', requireDatabase, cartRoutes);
app.use('/orders', requireDatabase, orderRoutes);

// Turns a rejected origin into an explicit answer. Without this, cors simply
// omits the header and the browser reports an opaque "Network Error" — which is
// indistinguishable from the API being down. Echoing the configured list back is
// safe: it contains only public frontend hostnames, never a secret, and it tells
// whoever is debugging exactly what to add to CORS_ORIGINS.
app.use((err, req, res, next) => {
  if (err instanceof DisallowedOriginError) {
    return res.status(403).json({
      success: false,
      error: 'origin_not_allowed',
      message: 'This origin is not allowed to call the ShopKart API. Add it to CORS_ORIGINS on the server (no trailing slash).',
      rejectedOrigin: err.origin,
      allowedOrigins: EXPLICIT_ORIGINS,
    });
  }
  return next(err);
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopkart';
const RETRY_MS = 5000;

// Keeps credentials out of the logs. A connection string contains the Atlas
// username and password, and anything printed to stdout on a hosted deploy ends
// up in a log viewer that a screenshot can leak.
function maskCredentials(uri) {
  return uri.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@');
}

// Listen FIRST, connect to Mongo second. A host such as Render routes traffic to
// whatever is bound to $PORT, so if the port is never opened because the database
// is unreachable, the service answers every request with an opaque 404 "Not
// Found" and there are no logs to explain it. Binding early makes that failure
// visible and recoverable: /health reports it, the retry loop keeps trying, and
// the service heals on its own once the cluster is reachable.
const server = app.listen(PORT, () => {
  console.log(`[App] ShopKart API listening on port ${PORT} (health check: /health)`);
});

async function connectWithRetry() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`[DB] Connected to MongoDB at ${maskCredentials(MONGO_URI)}`);
  } catch (err) {
    // Highly descriptive — tells the dev exactly what to do on Windows
    console.error('\n[DB] MongoDB connection failed:', err.message);
    console.error('[DB] Reason: Mongoose could not reach MongoDB at', maskCredentials(MONGO_URI));
    console.error('[DB] Reading that error:');
    console.error('[DB]   - ESERVFAIL / queryTxt -> the cluster hostname does not exist (typo, or the cluster was deleted)');
    console.error('[DB]   - "bad auth"          -> username/password wrong, or the password needs URL-encoding');
    console.error('[DB]   - "Server selection"  -> Atlas Network Access does not allow this host');
    console.error('[DB] Fix (local Windows):');
    console.error('  1. Check if MongoDB is installed:  mongod --version');
    console.error('  2. Check service status:            Get-Service MongoDB  OR  sc query MongoDB');
    console.error('  3. Start the service (Admin PS):    net start MongoDB');
    console.error('     Or:  Start-Service MongoDB  (or: mongod --dbpath \"C:\\data\\db\"  for manual run)');
    console.error('  4. Verify:                          mongosh --eval \"db.runCommand({ ping: 1 })\"');
    console.error('[DB] Fix (cloud): use a MongoDB Atlas URI in .env — see README/.env.example');
    console.error(`[DB] Retrying in ${RETRY_MS / 1000}s... (API stays up, /health reports "connecting")\n`);

    // Retry after 5s instead of exiting — the process stays available for
    // nodemon, and a paused Atlas cluster recovers without a redeploy.
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
