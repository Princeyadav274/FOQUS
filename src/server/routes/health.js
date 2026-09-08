import express from 'express';
import { globalStore } from '../../store/syncStore.js';

export const healthRouter = express.Router();

/**
 * GET /api/health
 * Returns summary of sync triage, accepted/deduplicated/quarantined counts, and anomalies.
 */
healthRouter.get('/', (req, res) => {
  const summary = globalStore.getHealthSummary();
  return res.json(summary);
});

/**
 * GET /api/health/quarantine
 * Returns list of quarantined records with human-readable reasons.
 */
healthRouter.get('/quarantine', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const quarantined = globalStore.getQuarantinedRecords(limit);
  return res.json({
    total: globalStore.quarantinedRecords.length,
    quarantined
  });
});
