/**
 * Operational error (bad input, missing resource, ...).
 * Thrown anywhere in the app; the central error middleware turns it into
 * { success: false, message } with the right HTTP status.
 */
export default class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
