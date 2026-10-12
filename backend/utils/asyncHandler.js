/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * error middleware instead of crashing the process (Express 4 does not do
 * this automatically).
 *
 *   router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
