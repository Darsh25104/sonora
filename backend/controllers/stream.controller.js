import fs from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Song from '../models/Song.js';

const MIME_BY_EXT = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

const UPLOADS_ROOT = path.resolve('uploads');

/**
 * GET /api/songs/:id/stream
 *
 * Streams the audio file with **HTTP range request** support so the browser
 * can jump to any point of a song without downloading the whole file
 * (that's what the seek bar relies on).
 *
 * Flow:  Range: bytes=1000-  →  206 Partial Content
 *                         +  Content-Range: bytes 1000-5999/600000
 *                         +  the exact byte slice read from disk
 *
 * If the file lives in the cloud we simply redirect (302) to the CDN URL —
 * the browser then streams from there, ranges included.
 */
export const streamSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new ApiError(404, 'Song not found');

  const url = song.audioUrl;

  // Cloud storage → let the CDN do the byte-range work.
  if (/^https?:\/\//i.test(url)) {
    return res.redirect(302, url);
  }

  const filePath = path.resolve(`.${url}`);
  if (!filePath.startsWith(UPLOADS_ROOT)) throw new ApiError(404, 'Audio file not found');

  let stats;
  try {
    stats = await stat(filePath); // fs/promises → returns a real Promise
  } catch {
    throw new ApiError(404, 'Audio file not found on the server');
  }

  res.setHeader('Content-Type', MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const range = req.headers.range;

  // No Range header → send the whole file (200).
  if (!range) {
    res.setHeader('Content-Length', stats.size);
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(filePath).pipe(res);
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (match[1] === '' && match[2] === '')) {
    res.setHeader('Content-Range', `bytes */${stats.size}`);
    return res.status(416).end(); // Range Not Satisfiable
  }

  let start;
  let end;
  if (match[1] === '') {
    // suffix range: bytes=-500 → last 500 bytes
    const suffix = Number(match[2]);
    start = Math.max(0, stats.size - suffix);
    end = stats.size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? stats.size - 1 : Number(match[2]);
  }

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stats.size) {
    res.setHeader('Content-Range', `bytes */${stats.size}`);
    return res.status(416).end();
  }
  end = Math.min(end, stats.size - 1);

  res.status(206);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
  res.setHeader('Content-Length', end - start + 1);
  if (req.method === 'HEAD') return res.end();

  const stream = fs.createReadStream(filePath, { start, end });
  stream.on('error', () => res.destroy());
  return stream.pipe(res);
});
