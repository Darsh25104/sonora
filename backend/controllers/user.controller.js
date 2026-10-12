import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import User from '../models/User.js';

/**
 * GET /api/users/me/liked
 * Populates likedSongs and drops nulls (a liked song may have been deleted).
 */
export const getLikedSongs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'likedSongs',
    options: { sort: { createdAt: -1 } },
  });

  const songs = (user.likedSongs || []).filter(Boolean);
  return sendSuccess(res, songs, 'Liked songs fetched successfully');
});

/**
 * GET /api/users/me/recently-played
 * Stored oldest → newest in Mongo ($slice:-30 keeps the latest 30),
 * returned newest → oldest so the homepage can render "most recent first".
 */
export const getRecentlyPlayed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'recentlyPlayed' });

  const songs = (user.recentlyPlayed || []).filter(Boolean).reverse();
  return sendSuccess(res, songs, 'Recently played fetched successfully');
});
