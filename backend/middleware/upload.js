import path from 'path';
import fs from 'fs';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/**
 * Multer configuration.
 *
 * Files are first written to uploads/tmp (fast, no memory usage), then the
 * storage service moves them to their final destination (local folder or
 * cloud). Limits and type checks happen here so bad files never reach
 * controllers.
 */

const TMP_DIR = path.resolve('uploads', 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const MAX_AUDIO_BYTES = (Number(process.env.MAX_AUDIO_SIZE_MB) || 50) * 1024 * 1024;
const MAX_IMAGE_BYTES = (Number(process.env.MAX_IMAGE_SIZE_MB) || 5) * 1024 * 1024;

const ALLOWED_AUDIO_MIME = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/vorbis',
];

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const EXT_BY_MIME = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/wave': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/vorbis': '.ogg',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${EXT_BY_MIME[file.mimetype] || path.extname(file.originalname) || ''}`);
  },
});

const reject = (message) => (cb) => cb(new ApiError(400, message), false);

/**
 * Song uploads carry TWO fields with different rules, so the filter checks
 * `file.fieldname` and applies the matching allow-list:
 *   audio → mp3/wav/ogg (≤ MAX_AUDIO_SIZE_MB, enforced by multer limits)
 *   cover → jpg/png/webp/gif (≤ MAX_IMAGE_SIZE_MB, enforced in assertImageSize)
 */
const songFileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (ALLOWED_AUDIO_MIME.includes(file.mimetype)) return cb(null, true);
    return reject(
      `Unsupported audio type "${file.mimetype}". Allowed: MP3, WAV or OGG.`
    )(cb);
  }
  if (file.fieldname === 'cover') {
    if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) return cb(null, true);
    return reject(
      `Unsupported image type "${file.mimetype}". Allowed: JPG, PNG, WebP or GIF.`
    )(cb);
  }
  return reject(`Unexpected file field "${file.fieldname}".`)(cb);
};

const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) return cb(null, true);
  return reject(`Unsupported image type "${file.mimetype}". Allowed: JPG, PNG, WebP or GIF.`)(cb);
};

/** Fields for POST/PUT /api/songs — an audio file plus an optional cover. */
export const songUpload = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_BYTES, files: 2 },
  fileFilter: songFileFilter,
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

/** Single cover image (albums, playlists). */
export const coverUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: imageFileFilter,
}).single('cover');

/**
 * Second-line defence for the cover's *size* (multer's song limit is the
 * larger audio cap, so images uploaded with songs need their own check).
 * Runs right after the upload middleware in the route chain.
 */
export function assertImageSize(req, _res, next) {
  const cover = req.files?.cover?.[0] || req.file;
  if (cover && cover.size > MAX_IMAGE_BYTES) {
    fs.unlink(cover.path, () => {}); // don't leave junk in tmp/
    return next(
      new ApiError(400, `Cover image must be smaller than ${process.env.MAX_IMAGE_SIZE_MB || 5} MB.`)
    );
  }
  return next();
}
