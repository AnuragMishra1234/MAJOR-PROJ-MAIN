/**
 * Error Middleware — converted to ESM.
 *
 * notFound    — 404 handler for undefined routes
 * errorHandler — centralized error formatter (Mongoose + JWT + generic)
 */

/**
 * 404 Not Found: triggers when no route matched the request.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler: catches all errors forwarded by next(err).
 * Formats them into consistent JSON without leaking internals.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Mongoose: Invalid ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found — invalid ID format.';
  }

  // MongoDB: Duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for '${field}'. Please use a different value.`;
  }

  // Mongoose: Schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // JWT: Invalid token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  // JWT: Expired token
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
