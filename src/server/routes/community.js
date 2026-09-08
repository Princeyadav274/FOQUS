import express from 'express';
import { globalStore } from '../../store/syncStore.js';

export const communityRouter = express.Router();

/**
 * GET /api/community
 * Returns collective community numbers aggregated by ISO week & region.
 * Assures zero leakage of individual user identities or private comments.
 */
communityRouter.get('/', (req, res) => {
  const metrics = globalStore.getCommunityMetrics();
  return res.json(metrics);
});
