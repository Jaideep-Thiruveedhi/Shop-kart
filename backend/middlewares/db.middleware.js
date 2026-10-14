const mongoose = require('mongoose');

// Guards every database-backed route. The HTTP server starts immediately (so the
// platform's router has something to attach to) while the Mongo connection is
// retried in the background, so the two states have to be reported separately.
//
// Why this matters in production: a host that doesn't answer its port looks
// exactly like a broken deploy — the platform returns a bare 404/"Not Found"
// with no logs, because nothing ever bound to the port. With this guard the API
// answers 503 with an explanation instead, and /health tells you the truth.
function requireDatabase(req, res, next) {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  if (mongoose.connection.readyState === 1) return next();

  return res.status(503).json({
    success: false,
    message: 'Database is not connected yet — the API is up, retry in a few seconds.',
    database: states[mongoose.connection.readyState] || 'unknown',
  });
}

module.exports = requireDatabase;
