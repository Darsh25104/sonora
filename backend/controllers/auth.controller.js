import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { isValidEmail, assertRequired } from '../utils/validate.js';
import { signToken } from '../utils/token.js';
import User from '../models/User.js';

/**
 * POST /api/auth/register
 * Validate → check for duplicates → create (pre-save hook hashes the password)
 * → sign a JWT → return the public user + token.
 *
 * The role is deliberately NOT taken from the request body: accounts are
 * always created as "user". Admin accounts come from scripts/createAdmin.js.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  assertRequired(req.body, ['name', 'email', 'password']);

  if (String(name).trim().length < 2) throw new ApiError(400, 'Name must be at least 2 characters.');
  if (!isValidEmail(email)) throw new ApiError(400, 'Please provide a valid email address.');
  if (String(password).length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');

  const normalizedEmail = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
    role: 'user',
  });

  return sendSuccess(res, { token: signToken(user._id), user: user.toPublicJSON() }, 'Account created successfully', 201);
});

/** POST /api/auth/login — same message for wrong email and wrong password. */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  assertRequired(req.body, ['email', 'password']);

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const matches = await user.comparePassword(String(password));
  if (!matches) throw new ApiError(401, 'Invalid email or password.');

  return sendSuccess(res, { token: signToken(user._id), user: user.toPublicJSON() }, 'Logged in successfully');
});

/** GET /api/auth/me — req.user was attached by requireAuth. */
export const getMe = (req, res) => sendSuccess(res, req.user.toPublicJSON(), 'Profile loaded');

/** PUT /api/auth/me — update display name / profile image URL. */
export const updateMe = asyncHandler(async (req, res) => {
  const { name, profileImage } = req.body;

  if (name !== undefined) {
    const clean = String(name).trim();
    if (clean.length < 2) throw new ApiError(400, 'Name must be at least 2 characters.');
    req.user.name = clean;
  }
  if (profileImage !== undefined) req.user.profileImage = String(profileImage);

  await req.user.save();
  return sendSuccess(res, req.user.toPublicJSON(), 'Profile updated');
});
