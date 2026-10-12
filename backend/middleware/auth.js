import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/**
 * requireAuth — verifies the "Authorization: Bearer <token>" header and
 * attaches the full user document to req.user for the rest of the request.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  const token = header.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired or invalid. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'This account no longer exists.');

  req.user = user;
  return next();
});

/** requireAdmin — must run after requireAuth. Blocks non-admin users (403). */
export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required.'));
  }
  return next();
};
