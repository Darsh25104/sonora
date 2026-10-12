import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { assertRequired, assertOwnerOrAdmin, escapeRegex, toSeconds } from '../utils/validate.js';
import { saveAudio, saveImage, removeFile } from '../services/storage.service.js';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import Playlist from '../models/Playlist.js';
import User from '../models/User.js';

const SORTS = {
  recent: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { playCount: -1 },
  title: { title: 1 },
};

/**
 * Links a song to an Album document that shares its album title.
 * Called on create and on update so Album.songs always stays in sync.
 */
async function linkSongToAlbum(song) {
  if (song.albumId) {
    const current = await Album.findById(song.albumId);
    if (current && current.title !== song.album) {
      current.songs.pull(song._id);
      await current.save();
      song.albumId = null;
    }
  }

  if (!song.album || song.album.toLowerCase() === 'single') return;

  const album = await Album.findOne({ title: song.album });
  if (!album) return; // album title is only a label until an Album doc exists

  song.albumId = album._id;
  if (!album.songs.some((id) => String(id) === String(song._id))) {
    album.songs.push(song._id);
    await album.save();
  }
}

/** Removes all references to a deleted song so no UI ever renders a broken item. */
async function purgeSongReferences(songId) {
  await Album.updateMany({ songs: songId }, { $pull: { songs: songId } });
  await Playlist.updateMany({ songs: songId }, { $pull: { songs: songId } });
  await User.updateMany({}, { $pull: { likedSongs: songId, recentlyPlayed: songId } });
}

/* ------------------------------------------------------------------ */
/* Public reads                                                       */
/* ------------------------------------------------------------------ */

/** GET /api/songs?sort=popular&limit=12&artist=...&genre=... */
export const listSongs = asyncHandler(async (req, res) => {
  const { sort = 'recent', limit = 50, artist, album, genre } = req.query;

  const filter = {};
  if (artist) filter.artist = new RegExp(escapeRegex(artist), 'i');
  if (album) filter.album = new RegExp(escapeRegex(album), 'i');
  if (genre) filter.genre = new RegExp(escapeRegex(genre), 'i');

  const songs = await Song.find(filter)
    .sort(SORTS[sort] || SORTS.recent)
    .limit(Math.min(Number(limit) || 50, 100));

  return sendSuccess(res, songs, 'Songs fetched successfully');
});

/** GET /api/songs/:id */
export const getSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new ApiError(404, 'Song not found');
  return sendSuccess(res, song, 'Song fetched successfully');
});

/* ------------------------------------------------------------------ */
/* Admin / artist writes                                               */
/* ------------------------------------------------------------------ */

/**
 * POST /api/songs (admin, multipart/form-data)
 *
 * 1. multer already validated + temp-stored "audio" and "cover"
 * 2. storage service moves them to their final home and returns URLs
 * 3. metadata (including duration measured by the browser) is saved to Mongo
 * 4. if an Album with this title exists, the song is linked to it
 *
 * On any failure the already-uploaded files are cleaned up.
 */
export const createSong = asyncHandler(async (req, res) => {
  assertRequired(req.body, ['title', 'artist']);

  const audioFile = req.files?.audio?.[0];
  if (!audioFile) throw new ApiError(400, 'Audio file is required (mp3, wav or ogg).');

  const coverFile = req.files?.cover?.[0];
  const title = String(req.body.title).trim();
  const artist = String(req.body.artist).trim();

  let audioUrl;
  let coverImage;
  try {
    audioUrl = await saveAudio(audioFile, { title });
    if (coverFile) coverImage = await saveImage(coverFile, { name: `${title}-cover` });

    const song = await Song.create({
      title,
      artist,
      album: String(req.body.album || '').trim() || 'Single',
      genre: String(req.body.genre || '').trim(),
      duration: toSeconds(req.body.duration),
      audioUrl,
      coverImage: coverImage || '',
      uploadedBy: req.user._id,
    });

    await linkSongToAlbum(song);
    await song.save();

    return sendSuccess(res, song, 'Song uploaded successfully', 201);
  } catch (err) {
    await Promise.allSettled([removeFile(audioUrl), removeFile(coverImage)]);
    throw err;
  }
});

/** PUT /api/songs/:id — owner or admin. Optionally re-uploads audio/cover. */
export const updateSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new ApiError(404, 'Song not found');
  assertOwnerOrAdmin(song.uploadedBy, req.user);

  const previousAudio = song.audioUrl;
  const previousCover = song.coverImage;

  if (req.body.title !== undefined) song.title = String(req.body.title).trim() || song.title;
  if (req.body.artist !== undefined) song.artist = String(req.body.artist).trim() || song.artist;
  if (req.body.album !== undefined) song.album = String(req.body.album).trim() || 'Single';
  if (req.body.genre !== undefined) song.genre = String(req.body.genre).trim();
  if (req.body.duration !== undefined) song.duration = toSeconds(req.body.duration);

  try {
    const audioFile = req.files?.audio?.[0];
    if (audioFile) song.audioUrl = await saveAudio(audioFile, { title: song.title });

    const coverFile = req.files?.cover?.[0];
    if (coverFile) song.coverImage = await saveImage(coverFile, { name: `${song.title}-cover` });

    await linkSongToAlbum(song);
    await song.save();

    // Old files are only removed after the new record is safely saved.
    if (req.files?.audio?.[0]) await removeFile(previousAudio);
    if (req.files?.cover?.[0]) await removeFile(previousCover);

    return sendSuccess(res, song, 'Song updated successfully');
  } catch (err) {
    // Roll back half-finished uploads.
    if (req.files?.audio?.[0]) await removeFile(song.audioUrl).catch(() => {});
    if (req.files?.cover?.[0]) await removeFile(song.coverImage).catch(() => {});
    song.audioUrl = previousAudio;
    song.coverImage = previousCover;
    throw err;
  }
});

/** DELETE /api/songs/:id — owner or admin, removes files and every reference. */
export const deleteSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new ApiError(404, 'Song not found');
  assertOwnerOrAdmin(song.uploadedBy, req.user);

  await song.deleteOne();
  await purgeSongReferences(song._id);
  await Promise.allSettled([removeFile(song.audioUrl), removeFile(song.coverImage)]);

  return sendSuccess(res, { _id: song._id }, 'Song deleted successfully');
});

/* ------------------------------------------------------------------ */
/* Likes                                                               */
/* ------------------------------------------------------------------ */

/** POST /api/songs/:id/like — idempotent ($addToSet never duplicates). */
export const likeSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new ApiError(404, 'Song not found');

  await User.updateOne({ _id: req.user._id }, { $addToSet: { likedSongs: song._id } });
  const user = await User.findById(req.user._id).select('likedSongs');

  return sendSuccess(res, { likedSongs: user.likedSongs }, 'Song added to Liked Songs');
});

/** DELETE /api/songs/:id/like */
export const unlikeSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new ApiError(404, 'Song not found');

  await User.updateOne({ _id: req.user._id }, { $pull: { likedSongs: song._id } });
  const user = await User.findById(req.user._id).select('likedSongs');

  return sendSuccess(res, { likedSongs: user.likedSongs }, 'Song removed from Liked Songs');
});

/* ------------------------------------------------------------------ */
/* Recently played / play counts                                       */
/* ------------------------------------------------------------------ */

/**
 * POST /api/songs/:id/play
 * Called by the player whenever a track starts:
 *   - increments playCount
 *   - moves the song to the end of user.recentlyPlayed
 *     ($pull first removes duplicates, $slice:-30 caps the list →
 *      oldest entries fall off, the API later reverses it for display)
 */
export const recordPlay = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new ApiError(404, 'Song not found');

  await Song.updateOne({ _id: song._id }, { $inc: { playCount: 1 } });

  await User.updateOne({ _id: req.user._id }, { $pull: { recentlyPlayed: song._id } });
  await User.updateOne(
    { _id: req.user._id },
    { $push: { recentlyPlayed: { $each: [song._id], $slice: -30 } } }
  );

  return sendSuccess(res, { playCount: song.playCount + 1 }, 'Play recorded');
});
