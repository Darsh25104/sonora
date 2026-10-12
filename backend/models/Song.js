import mongoose from 'mongoose';

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    artist: { type: String, required: [true, 'Artist is required'], trim: true, maxlength: 120 },

    // `album` is the album *title* kept as plain text so search can filter by it
    // with a simple regex. `albumId` links to the Album document when one exists.
    // This small denormalisation is what makes GET /api/search?q=... fast and simple.
    album: { type: String, default: 'Single', trim: true, maxlength: 120 },
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', default: null },

    genre: { type: String, default: '', trim: true, maxlength: 60 },

    // URL/path of the audio file. Audio bytes live in storage (local disk or
    // cloud) — never inside MongoDB.
    audioUrl: { type: String, required: [true, 'Audio file is required'] },
    coverImage: { type: String, default: '' },

    duration: { type: Number, default: 0, min: 0 }, // seconds
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    playCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

songSchema.index({ playCount: -1 });
songSchema.index({ createdAt: -1 });

export default mongoose.model('Song', songSchema);
