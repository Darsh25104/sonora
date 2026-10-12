import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { escapeRegex } from '../utils/validate.js';
import Song from '../models/Song.js';
import Album from '../models/Album.js';

/**
 * GET /api/search?q=believer
 *
 * One request returns three result groups: songs, albums and artists.
 * Case-insensitive regex over title/artist/album — safe because the user
 * input is escaped first.
 */
export const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();

  if (!q) {
    return sendSuccess(res, { songs: [], albums: [], artists: [] }, 'Type to search');
  }

  const rx = new RegExp(escapeRegex(q), 'i');

  const [songs, albums, artistNames] = await Promise.all([
    Song.find({ $or: [{ title: rx }, { artist: rx }, { album: rx }, { genre: rx }] })
      .sort({ playCount: -1 })
      .limit(24),
    Album.find({ $or: [{ title: rx }, { artist: rx }] }).sort({ createdAt: -1 }).limit(12),
    Song.distinct('artist', { artist: rx }),
  ]);

  const artists = artistNames
    .filter((name) => name)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 12)
    .map((name) => ({ name }));

  return sendSuccess(res, { songs, albums, artists }, `Results for "${q}"`);
});
