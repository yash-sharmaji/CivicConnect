/**
 * Centralized Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log detailed error internally
  console.error(`[Error] ${req.method} ${req.url} - Status ${statusCode}`);
  console.error(err.stack || err);

  // Send sanitized response to client
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    status: statusCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Custom Error Class for API specific exceptions
 */
export class APIError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
