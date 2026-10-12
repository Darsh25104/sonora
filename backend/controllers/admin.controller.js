import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import Playlist from '../models/Playlist.js';
import User from '../models/User.js';

/** GET /api/admin/stats — dashboard numbers. Runs behind requireAdmin. */
export const getStats = asyncHandler(async (_req, res) => {
  const [totalSongs, totalAlbums, totalUsers, totalPlaylists, plays] = await Promise.all([
    Song.countDocuments(),
    Album.countDocuments(),
    User.countDocuments(),
    Playlist.countDocuments(),
    Song.aggregate([{ $group: { _id: null, total: { $sum: '$playCount' } } }]),
  ]);

  return sendSuccess(
    res,
    {
      totalSongs,
      totalAlbums,
      totalUsers,
      totalPlaylists,
      totalPlays: plays[0]?.total || 0,
    },
    'Stats fetched successfully'
  );
});
