import 'dotenv/config'; // must be first: loads .env before anything reads process.env
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

/* Fail fast when secrets are missing — never run with default/empty secrets. */
for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}. Copy .env.example to .env first.`);
    process.exit(1);
  }
}

/* Make sure the local storage folders exist so uploads never crash. */
for (const dir of ['uploads/audio', 'uploads/covers', 'uploads/tmp']) {
  fs.mkdirSync(path.resolve(dir), { recursive: true });
}

const app = express();

app.set('trust proxy', 1); // correct client IPs behind a proxy (Render/Heroku/Nginx)

app.use(
  helmet({
    // allow the frontend (possibly another domain) to load our images/audio
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((o) => o.trim()) : '*',
  })
);

app.use(express.json({ limit: '1mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

/* Uploaded cover images (and local audio as a fallback) are served statically.
   Express static supports Range requests natively. */
app.use('/uploads', express.static(path.resolve('uploads'), { index: false, maxAge: '7d' }));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Sonora API is running', data: { status: 'ok' } });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Sonora API listening on http://localhost:${PORT}`);
      console.log(`Storage provider: ${process.env.CLOUD_STORAGE_PROVIDER || 'local'}`);
    });
  })
  .catch((err) => {
    console.error('Could not start server — MongoDB connection failed:', err.message);
    process.exit(1);
  });
