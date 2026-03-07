// src/middleware/async.middleware.js
/**
 * Async Middleware Wrapper
 * ------------------------
 * Prevents repetitive try/catch in async route handlers.
 * Any rejected promise is forwarded to Express error middleware.
 */

function asyncHandler(fn) {
  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };