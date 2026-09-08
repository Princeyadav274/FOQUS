import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { syncRouter } from './routes/sync.js';
import { usersRouter } from './routes/users.js';
import { communityRouter } from './routes/community.js';
import { healthRouter } from './routes/health.js';
import { devRouter } from './routes/dev.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.use('/api/sync', syncRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/community', communityRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/dev', devRouter);

  // Serve static UI assets
  const publicCandidates = [
    path.resolve(process.cwd(), 'src/public'),
    path.join(__dirname, '../public')
  ];
  const publicDir = publicCandidates.find(p => fs.existsSync(p)) || path.join(__dirname, '../public');
  app.use(express.static(publicDir));

  // SPA fallback to index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}
