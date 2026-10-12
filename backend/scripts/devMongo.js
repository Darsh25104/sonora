import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Development helper: starts a throwaway MongoDB on 127.0.0.1:27017 so you
 * can run the whole app without installing MongoDB locally.
 *
 *   node scripts/devMongo.js
 *
 * Then run `npm run seed` and `npm run dev` in other terminals.
 * Production/real development should use a real MongoDB or MongoDB Atlas.
 */
const mongod = await MongoMemoryServer.create({
  instance: { ip: '127.0.0.1', port: 27017 },
  dbName: 'sonora',
});

console.log(`In-memory MongoDB running at ${mongod.getUri()}`);
console.log('Press Ctrl+C to stop.');

process.on('SIGINT', async () => {
  await mongod.stop();
  process.exit(0);
});
