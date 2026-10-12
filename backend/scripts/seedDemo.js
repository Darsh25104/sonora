import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import Playlist from '../models/Playlist.js';

/**
 * Seeds the database with:
 *   - an admin account
 *   - a demo (regular) user with likes, a playlist and history
 *   - 6 original royalty-free tone tracks written as real .wav files
 *
 *   npm run seed
 *
 * The tones are generated in pure Node (no binary assets in the repo), so you
 * can immediately test play / seek / next / streaming after starting the app.
 */

const RATE = 22050; // Hz
const AUDIO_DIR = path.resolve('uploads', 'audio');

/** Writes a 16-bit mono PCM WAV file containing a fading chord. */
function createToneWav(filePath, { seconds = 6, freq = 440 }) {
  const numSamples = Math.floor(seconds * RATE);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // format = PCM
  buffer.writeUInt16LE(1, 22); // channels = mono
  buffer.writeUInt32LE(RATE, 24); // sample rate
  buffer.writeUInt32LE(RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / RATE;
    const envelope = Math.min(1, t * 4, (seconds - t) * 4); // fade in/out
    const sample =
      Math.sin(2 * Math.PI * freq * t) * 0.3 +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.12 +
      Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.08;
    buffer.writeInt16LE(Math.round(sample * envelope * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

const TRACKS = [
  { title: 'Neon Horizon', artist: 'Lumen Fields', genre: 'Synthwave', freq: 392, seconds: 8 },
  { title: 'Midnight Transit', artist: 'Lumen Fields', genre: 'Synthwave', freq: 440, seconds: 7 },
  { title: 'Paper Planets', artist: 'Iris Vale', genre: 'Indie', freq: 523, seconds: 9 },
  { title: 'Gravity Bloom', artist: 'Iris Vale', genre: 'Indie', freq: 349, seconds: 8 },
  { title: 'Static Hearts', artist: 'The Coil', genre: 'Electronic', freq: 466, seconds: 7 },
  { title: 'Afterglow Avenue', artist: 'The Coil', genre: 'Electronic', freq: 494, seconds: 10 },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@sonora.dev').toLowerCase();
  const demoEmail = 'demo@sonora.dev';

  /* --- users ------------------------------------------------------- */
  let admin = await User.findOne({ email: adminEmail }).select('+password');
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Sonora Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'admin1234',
      role: 'admin',
    });
    console.log(`Created admin ${adminEmail}`);
  }

  let demo = await User.findOne({ email: demoEmail }).select('+password');
  if (!demo) {
    demo = await User.create({
      name: 'Demo Listener',
      email: demoEmail,
      password: 'demo1234',
      role: 'user',
    });
    console.log(`Created demo user ${demoEmail} (password: demo1234)`);
  }

  /* --- songs -------------------------------------------------------- */
  const existingCount = await Song.countDocuments();
  if (existingCount > 0) {
    console.log(`Songs already exist (${existingCount}) — skipping track creation.`);
  } else {
    const created = [];
    for (const track of TRACKS) {
      const fileName = `${track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.wav`;
      const filePath = path.join(AUDIO_DIR, fileName);
      createToneWav(filePath, { seconds: track.seconds, freq: track.freq });

      const song = await Song.create({
        title: track.title,
        artist: track.artist,
        album: 'Signal Drive',
        genre: track.genre,
        audioUrl: `/uploads/audio/${fileName}`,
        coverImage: '',
        duration: track.seconds,
        uploadedBy: admin._id,
        playCount: 0,
      });
      created.push(song);
    }
    console.log(`Created ${created.length} demo songs in uploads/audio`);
  }

  /* --- album + playlist -------------------------------------------- */
  if (!(await Album.findOne({ title: 'Signal Drive' }))) {
    const songs = await Song.find({ album: 'Signal Drive' });
    const album = await Album.create({
      title: 'Signal Drive',
      artist: 'Lumen Fields',
      coverImage: '',
      songs: songs.map((s) => s._id),
      createdBy: admin._id,
    });
    await Song.updateMany({ _id: { $in: songs.map((s) => s._id) } }, { albumId: album._id });
    console.log(`Created album "Signal Drive" with ${songs.length} songs`);
  }

  if (!(await Playlist.findOne({ owner: demo._id }))) {
    const songs = await Song.find().limit(3);
    const playlist = await Playlist.create({
      name: 'Focus Flow',
      owner: demo._id,
      songs: songs.map((s) => s._id),
    });
    await User.updateOne({ _id: demo._id }, { $set: { playlists: [playlist._id] } });
    console.log(`Created playlist "Focus Flow" for ${demoEmail}`);
  }

  /* --- demo engagement --------------------------------------------- */
  const allSongs = await Song.find().limit(4);
  if (allSongs.length) {
    await User.updateOne(
      { _id: demo._id },
      {
        $addToSet: { likedSongs: { $each: allSongs.slice(0, 3).map((s) => s._id) } },
        $set: { recentlyPlayed: allSongs.map((s) => s._id) },
      }
    );
    await Song.updateMany({ _id: { $in: allSongs.map((s) => s._id) } }, [
      { $set: { playCount: { $add: [{ $floor: { $rand: {} } }, 20] } } },
    ]);
  }

  console.log('\nSeed complete.');
  console.log(`  Admin login : ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'admin1234'}`);
  console.log(`  Demo login  : ${demoEmail} / demo1234`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
