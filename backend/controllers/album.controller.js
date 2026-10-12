import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { assertRequired } from '../utils/validate.js';
import { saveImage, removeFile } from '../services/storage.service.js';
import Album from '../models/Album.js';
import Song from '../models/Song.js';

/** GET /api/albums?limit=12 */
export const listAlbums = asyncHandler(async (req, res) => {
  const albums = await Album.find()
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 50, 100));

  return sendSuccess(res, albums, 'Albums fetched successfully');
});

/**
 * GET /api/albums/:id
 * Returns the album with populated songs. If Album.songs is empty (album was
 * created after its songs, or links were cleaned up) we fall back to a query
 * on the denormalised song.album title so the page never looks broken.
 */
export const getAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id).populate({
    path: 'songs',
    options: { sort: { createdAt: 1 } },
  });
  if (!album) throw new ApiError(404, 'Album not found');

  let songs = (album.songs || []).filter(Boolean);
  if (!songs.length) {
    songs = await Song.find({ album: album.title, artist: album.artist }).sort({ createdAt: 1 });
  }

  return sendSuccess(res, { ...album.toObject(), songs }, 'Album fetched successfully');
});

/** POST /api/albums (admin, optional cover image) */
export const createAlbum = asyncHandler(async (req, res) => {
  assertRequired(req.body, ['title', 'artist']);

  const coverFile = req.files?.cover?.[0] || req.file;
  let coverImage = '';
  try {
    if (coverFile) coverImage = await saveImage(coverFile, { name: `${req.body.title}-cover` });

    const album = await Album.create({
      title: String(req.body.title).trim(),
      artist: String(req.body.artist).trim(),
      coverImage,
      createdBy: req.user._id,
    });

    return sendSuccess(res, album, 'Album created successfully', 201);
  } catch (err) {
    await removeFile(coverImage);
    throw err;
  }
});

/** PUT /api/albums/:id (admin) */
export const updateAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) throw new ApiError(404, 'Album not found');

  const previousCover = album.coverImage;

  if (req.body.title !== undefined) album.title = String(req.body.title).trim() || album.title;
  if (req.body.artist !== undefined) album.artist = String(req.body.artist).trim() || album.artist;

  try {
    const coverFile = req.files?.cover?.[0] || req.file;
    if (coverFile) {
      album.coverImage = await saveImage(coverFile, { name: `${album.title}-cover` });
    }
    await album.save();
    if (coverFile) await removeFile(previousCover);
    return sendSuccess(res, album, 'Album updated successfully');
  } catch (err) {
    if (req.files?.cover?.[0] || req.file) await removeFile(album.coverImage).catch(() => {});
    album.coverImage = previousCover;
    throw err;
  }
});

/** DELETE /api/albums/:id (admin) — songs are kept, only the link is removed. */
export const deleteAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) throw new ApiError(404, 'Album not found');

  await album.deleteOne();
  await Song.updateMany({ albumId: album._id }, { albumId: null });
  await removeFile(album.coverImage);

  return sendSuccess(res, { _id: album._id }, 'Album deleted successfully');
});
