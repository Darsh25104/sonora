import mongoose from 'mongoose';

/**
 * Connect to MongoDB using MONGO_URI from the environment.
 * Called once from server.js before the HTTP server starts, so the app
 * never accepts requests it cannot serve.
 */
export default async function connectDB() {
  mongoose.set('strictQuery', true);

  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);

  console.log(`MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
}
