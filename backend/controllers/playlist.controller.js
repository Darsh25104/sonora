import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { assertRequired, assertOwnerOrAdmin } from '../utils/validate.js';
import { saveImage, removeFile } from '../services/storage.service.js';
import Playlist from '../models/Playlist.js';
import Song from '../models/Song.js';
import User from '../models/User.js';

/** Loads a playlist and checks the requester is its owner (or an admin). */
async function loadOwnedPlaylist(req) {
  const playlist = await Playlist.findById(req.params.id);
  if (!playlist) throw new ApiError(404, 'Playlist not found');
  assertOwnerOrAdmin(playlist.owner, req.user, 'This playlist belongs to another user');
  return playlist;
}

/** GET /api/playlists — playlists of the logged-in user. */
export const listMyPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({ owner: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, playlists, 'Playlists fetched successfully');
});

/** GET /api/playlists/:id — with songs populated (owner/admin only, they're private). */
export const getPlaylist = asyncHandler(async (req, res) => {
  const playlist = await loadOwnedPlaylist(req);
  await playlist.populate({ path: 'songs', options: { sort: { createdAt: 1 } } });
  playlist.songs = playlist.songs.filter(Boolean);
  return sendSuccess(res, playlist, 'Playlist fetched successfully');
});

/** POST /api/playlists (name required, cover image optional) */
export const createPlaylist = asyncHandler(async (req, res) => {
  assertRequired(req.body, ['name']);

  const coverFile = req.files?.cover?.[0] || req.file;
  let coverImage = '';
  try {
    if (coverFile) coverImage = await saveImage(coverFile, { name: req.body.name });

    const playlist = await Playlist.create({
      name: String(req.body.name).trim(),
      owner: req.user._id,
      coverImage,
    });

    await User.updateOne({ _id: req.user._id }, { $addToSet: { playlists: playlist._id } });

    return sendSuccess(res, playlist, 'Playlist created successfully', 201);
  } catch (err) {
    await removeFile(coverImage);
    throw err;
  }
});

/** PUT /api/playlists/:id — rename / change cover. */
export const updatePlaylist = asyncHandler(async (req, res) => {
  const playlist = await loadOwnedPlaylist(req);
  const previousCover = playlist.coverImage;

  if (req.body.name !== undefined) playlist.name = String(req.body.name).trim() || playlist.name;

  try {
    const coverFile = req.files?.cover?.[0] || req.file;
    if (coverFile) playlist.coverImage = await saveImage(coverFile, { name: playlist.name });
    await playlist.save();
    if (coverFile) await removeFile(previousCover);
    return sendSuccess(res, playlist, 'Playlist updated successfully');
  } catch (err) {
    if (req.files?.cover?.[0] || req.file) await removeFile(playlist.coverImage).catch(() => {});
    playlist.coverImage = previousCover;
    throw err;
  }
});

/** DELETE /api/playlists/:id — also unlinks it from the owner document. */
export const deletePlaylist = asyncHandler(async (req, res) => {
  const playlist = await loadOwnedPlaylist(req);

  await playlist.deleteOne();
  await User.updateOne({ _id: playlist.owner }, { $pull: { playlists: playlist._id } });
  await removeFile(playlist.coverImage);

  return sendSuccess(res, { _id: playlist._id }, 'Playlist deleted successfully');
});

/** POST /api/playlists/:id/songs — body: { songId } (rejects duplicates). */
export const addSongToPlaylist = asyncHandler(async (req, res) => {
  const playlist = await loadOwnedPlaylist(req);
  const { songId } = req.body;
  assertRequired(req.body, ['songId']);

  const song = await Song.findById(songId);
  if (!song) throw new ApiError(404, 'Song not found');
  if (playlist.songs.some((id) => String(id) === String(songId))) {
    throw new ApiError(409, 'Song is already in this playlist');
  }

  playlist.songs.push(song._id);
  await playlist.save();

  await playlist.populate({ path: 'songs', options: { sort: { createdAt: 1 } } });
  return sendSuccess(res, playlist, `Added "${song.title}" to ${playlist.name}`);
});

/** DELETE /api/playlists/:id/songs/:songId */
export const removeSongFromPlaylist = asyncHandler(async (req, res) => {
  const playlist = await loadOwnedPlaylist(req);

  playlist.songs.pull(req.params.songId);
  await playlist.save();

  await playlist.populate({ path: 'songs', options: { sort: { createdAt: 1 } } });
  return sendSuccess(res, playlist, 'Song removed from playlist');
});
