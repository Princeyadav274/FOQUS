import { createApp } from '../src/server/app.js';
import { globalStore } from '../src/store/syncStore.js';
import fs from 'fs';
import path from 'path';

const app = createApp();

let isPreloaded = false;

function preloadFixture() {
  if (isPreloaded) return;
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), 'fixtures/sync-log.jsonl'),
      path.join(process.cwd(), 'fixtures', 'sync-log.jsonl'),
      path.resolve('/var/task/fixtures/sync-log.jsonl')
    ];

    const fixturePath = candidatePaths.find(p => fs.existsSync(p));
    if (fixturePath) {
      const content = fs.readFileSync(fixturePath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const record = JSON.parse(trimmed);
          globalStore.processRecord(record);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('Fixture preload error:', err);
  }
  isPreloaded = true;
}

// Load fixture on cold start
preloadFixture();

export default app;
