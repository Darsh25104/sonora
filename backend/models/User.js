import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // pure-JS bcrypt (same $2b$ algorithm, no native build)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    // select:false → password is never returned unless we explicitly ask for it (login).
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profileImage: { type: String, default: '' },

    // References to other collections — this is how documents "relate" in MongoDB.
    likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
    // Stored oldest → newest (natural $push order), capped at 30 by the controller.
    // The API reverses it so clients always receive "most recent first".
    recentlyPlayed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  },
  { timestamps: true }
);

// Hash the password automatically whenever it changes — never store plain text.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Shape a user for API responses — never leaks the hash. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    profileImage: this.profileImage,
    likedSongs: this.likedSongs,
    playlists: this.playlists,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
