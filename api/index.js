import { createApp } from '../src/server/app.js';
import { globalStore } from '../src/store/syncStore.js';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const app = createApp();

let isPreloaded = false;

async function ensureFixtureLoaded() {
  if (isPreloaded) return;
  
  const possiblePaths = [
    path.resolve(process.cwd(), 'fixtures/sync-log.jsonl'),
    path.join(process.cwd(), 'fixtures', 'sync-log.jsonl')
  ];

  const fixturePath = possiblePaths.find(p => fs.existsSync(p));
  if (fixturePath) {
    const fileStream = fs.createReadStream(fixturePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const record = JSON.parse(line);
        globalStore.processRecord(record);
      } catch (e) {}
    }
  }
  isPreloaded = true;
}

export default async function handler(req, res) {
  await ensureFixtureLoaded();
  return app(req, res);
}
