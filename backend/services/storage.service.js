import fs from 'fs/promises';
import path from 'path';
import { cloudinary, isCloudStorage } from '../config/storage.js';

/**
 * Storage service — the only module that knows *where* files live.
 *
 * Local (development):  move the temp file into uploads/audio | uploads/covers
 *                       and return a relative URL like "/uploads/audio/x.mp3".
 * Cloudinary (prod):    upload the temp file, delete it, return the CDN URL.
 *
 * Controllers just call saveAudio()/saveImage()/removeFile() and store the
 * returned URL string — swapping providers never touches business logic.
 */

const AUDIO_DIR = path.resolve('uploads', 'audio');
const IMAGE_DIR = path.resolve('uploads', 'covers');

const AUDIO_FOLDER = `${process.env.CLOUDINARY_FOLDER || 'sonora'}/audio`;
const IMAGE_FOLDER = `${process.env.CLOUDINARY_FOLDER || 'sonora'}/covers`;

function slugify(text) {
  return String(text || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
}

async function moveIntoPlace(source, destinationDir, publicName) {
  await fs.mkdir(destinationDir, { recursive: true });
  const destination = path.join(destinationDir, publicName);
  try {
    await fs.rename(source, destination); // same filesystem → instant
  } catch {
    await fs.copyFile(source, destination); // fallback (different volumes)
    await fs.unlink(source).catch(() => {});
  }
  return destination;
}

async function cleanupTemp(file) {
  if (file?.path) await fs.unlink(file.path).catch(() => {});
}

/** @returns {Promise<string>} public URL of the stored audio file */
export async function saveAudio(tempFile, { title = 'song' } = {}) {
  if (isCloudStorage) {
    const result = await cloudinary.uploader.upload(tempFile.path, {
      resource_type: 'raw',
      folder: AUDIO_FOLDER,
      public_id: `${slugify(title)}-${Date.now()}`,
    });
    await cleanupTemp(tempFile);
    return result.secure_url;
  }

  const name = `${slugify(title)}-${Date.now()}${path.extname(tempFile.originalname) || '.mp3'}`;
  await moveIntoPlace(tempFile.path, AUDIO_DIR, name);
  return `/uploads/audio/${name}`;
}

/** @returns {Promise<string>} public URL of the stored cover image */
export async function saveImage(tempFile, { name = 'cover' } = {}) {
  if (isCloudStorage) {
    const result = await cloudinary.uploader.upload(tempFile.path, {
      folder: IMAGE_FOLDER,
      public_id: `${slugify(name)}-${Date.now()}`,
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    });
    await cleanupTemp(tempFile);
    return result.secure_url;
  }

  const fileName = `${slugify(name)}-${Date.now()}${path.extname(tempFile.originalname) || '.jpg'}`;
  await moveIntoPlace(tempFile.path, IMAGE_DIR, fileName);
  return `/uploads/covers/${fileName}`;
}

/**
 * Best-effort deletion when a song/album is removed.
 * Local URLs are unlinked from disk; Cloudinary URLs are destroyed by public id.
 */
export async function removeFile(url) {
  if (!url) return;

  if (/^https?:\/\//i.test(url)) {
    if (!isCloudStorage) return;
    try {
      const withoutQuery = url.split('?')[0];
      const withoutHost = withoutQuery.slice(withoutQuery.indexOf('/upload/') + 8);
      const publicId = withoutHost.replace(/^v\d+\//, '');
      const resourceType = publicId.includes('/audio/') ? 'raw' : 'image';
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      console.warn('Cloudinary cleanup failed:', err.message);
    }
    return;
  }

  if (url.startsWith('/uploads/')) {
    const resolved = path.resolve(`.${url}`);
    if (resolved.startsWith(path.resolve('uploads'))) {
      await fs.unlink(resolved).catch(() => {});
    }
  }
}
