import express from 'express';
import { globalStore } from '../../store/syncStore.js';

export const syncRouter = express.Router();

/**
 * POST /api/sync
 * Accepts a single sync record.
 * Returns: { status: 'accepted'|'deduplicated'|'quarantined', reason?: string }
 */
syncRouter.post('/', (req, res) => {
  const record = req.body;
  if (!record || typeof record !== 'object') {
    return res.status(400).json({
      status: 'quarantined',
      reason: 'Empty or non-JSON body payload'
    });
  }

  const result = globalStore.processRecord(record);
  return res.status(200).json(result);
});

/**
 * POST /api/sync/batch
 * Accepts an array of records or raw JSON lines (useful for fast sync).
 */
syncRouter.post('/batch', (req, res) => {
  const records = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Expected an array of records in batch' });
  }

  const results = records.map(r => globalStore.processRecord(r));
  return res.status(200).json({
    processed: results.length,
    results
  });
});

/**
 * POST /api/sync/reset
 * Resets store state (useful for automated testing and replay).
 */
syncRouter.post('/reset', (req, res) => {
  globalStore.reset();
  return res.status(200).json({ message: 'Store reset successfully' });
});
