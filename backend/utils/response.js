/**
 * Every success response has the same shape:
 *   { "success": true, "message": "...", "data": ... }
 * Every failure response has the shape:
 *   { "success": false, "message": "..." }
 * (see middleware/errorHandler.js)
 */
export function sendSuccess(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export default sendSuccess;
