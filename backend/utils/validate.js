import ApiError from './ApiError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? '').trim().toLowerCase());
}

/** Throws a 400 if any required body field is missing/blank. */
export function assertRequired(body, fields) {
  const missing = fields.filter((field) => !String(body?.[field] ?? '').trim());
  if (missing.length) {
    throw new ApiError(400, `Missing required field(s): ${missing.join(', ')}`);
  }
}

/** Escapes user input before building a RegExp, preventing ReDoS/injection. */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Validates and normalises a duration (seconds) coming from the client. */
export function toSeconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/** Ensures the requester owns the document (or is an admin), else 403. */
export function assertOwnerOrAdmin(ownerId, user, message = 'You are not allowed to modify this resource') {
  const isOwner = ownerId && String(ownerId) === String(user?._id);
  if (!isOwner && user?.role !== 'admin') {
    throw new ApiError(403, message);
  }
}
