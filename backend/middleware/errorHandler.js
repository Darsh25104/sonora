import ApiError from '../utils/ApiError.js';

/** 404 for any unknown API route. */
export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler — the single place that formats failures.
 * Output: { success: false, message: "Song not found" }
 *
 * Understands:
 *  - ApiError (operational errors we throw on purpose)
 *  - Mongoose CastError      → invalid ObjectId in the URL
 *  - Mongoose ValidationError → schema rule broken
 *  - Duplicate key (code 11000) → unique email, etc.
 *  - Multer errors            → file too large / unexpected field
 */
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}": ${err.value}`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    message = `${Object.keys(err.keyValue || {}).join(', ')} already exists`;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Please upload a smaller file.'
        : `Upload error: ${err.message}`;
  } else if (statusCode >= 500) {
    // Unexpected bug — log the full stack for ourselves, hide it from clients.
    console.error('[API error]', err);
  }

  return res.status(statusCode).json({ success: false, message });
};
