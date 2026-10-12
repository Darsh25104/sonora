import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Creates (or promotes) an admin account.
 *
 *   npm run create-admin                          # uses ADMIN_* env vars
 *   npm run create-admin -- a@b.com "Ada" secret123
 *
 * Password is hashed by the User model's pre-save hook — plain text is never
 * stored, not even in this script.
 */
async function main() {
  const [, , argEmail, argName, argPassword] = process.argv;

  const email = (argEmail || process.env.ADMIN_EMAIL || '').toLowerCase();
  const name = argName || process.env.ADMIN_NAME || 'Sonora Admin';
  const password = argPassword || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Usage: npm run create-admin -- <email> <name> <password>');
    console.error('Or set ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD in .env');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.role = 'admin';
    existing.password = password; // marks it modified → re-hashed on save
    existing.name = name;
    await existing.save();
    console.log(`Updated "${email}" → role: admin`);
  } else {
    await User.create({ name, email, password, role: 'admin' });
    console.log(`Created admin "${email}"`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('create-admin failed:', err.message);
  process.exit(1);
});
