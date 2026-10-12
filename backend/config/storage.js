import { v2 as cloudinary } from 'cloudinary';

/**
 * Storage configuration.
 *
 * Two providers are supported so the same code runs in development and production:
 *   - "local"      files are written to ./uploads and served by Express (dev)
 *   - "cloudinary" files are streamed to Cloudinary's CDN (production)
 *
 * The provider is picked with CLOUD_STORAGE_PROVIDER — no code changes needed.
 */
export const storageProvider = (process.env.CLOUD_STORAGE_PROVIDER || 'local').toLowerCase();
export const isCloudStorage = storageProvider === 'cloudinary';

if (isCloudStorage) {
  const missing = ['CLOUD_STORAGE_NAME', 'CLOUD_STORAGE_KEY', 'CLOUD_STORAGE_SECRET'].filter(
    (key) => !process.env[key]
  );
  if (missing.length) {
    throw new Error(`CLOUD_STORAGE_PROVIDER=cloudinary but missing env: ${missing.join(', ')}`);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUD_STORAGE_NAME,
    api_key: process.env.CLOUD_STORAGE_KEY,
    api_secret: process.env.CLOUD_STORAGE_SECRET,
  });
}

export { cloudinary };
