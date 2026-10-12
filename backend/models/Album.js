import mongoose from 'mongoose';

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Album title is required'], trim: true, maxlength: 120 },
    artist: { type: String, required: [true, 'Artist is required'], trim: true, maxlength: 120 },
    coverImage: { type: String, default: '' },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Album', albumSchema);
