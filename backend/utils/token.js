import jwt from 'jsonwebtoken';

/** Signs a short-lived-free JWT that carries only the user id. */
export function signToken(userId) {
  return jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
