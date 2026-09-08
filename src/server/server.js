import { createApp } from './app.js';
import { globalStore } from '../store/syncStore.js';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const PORT = process.env.PORT || 3000;
const app = createApp();

async function preloadFixture() {
  const fixturePath = path.resolve(process.cwd(), 'fixtures/sync-log.jsonl');
  if (fs.existsSync(fixturePath)) {
    console.log(`📦 Loading initial sync log from ${fixturePath}...`);
    const fileStream = fs.createReadStream(fixturePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let count = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const record = JSON.parse(line);
        globalStore.processRecord(record);
        count++;
      } catch (e) {}
    }
    console.log(`✅ Loaded ${count} records into sync store.`);
  }
}

preloadFixture().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🌿 FoQus Sync Server running on http://localhost:${PORT}`);
    console.log(`   - Screen 1 (Personal Dashboard):       http://localhost:${PORT}/`);
    console.log(`   - Screen 2 (Community & Ops Health):   http://localhost:${PORT}/#community`);
    console.log(`   - Sync Ingestion Endpoint:             POST http://localhost:${PORT}/api/sync`);
  });
});

