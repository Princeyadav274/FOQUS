import express from 'express';
import { globalStore } from '../../store/syncStore.js';
import { RECORD_TYPES } from '../../domain/types.js';

export const usersRouter = express.Router();

/**
 * GET /api/users
 * Returns list of active users.
 */
usersRouter.get('/', (req, res) => {
  const users = globalStore.getUserList();
  return res.json(users);
});

/**
 * GET /api/users/:id
 * Returns stats, streaks, badges, and session history for a person.
 */
usersRouter.get('/:id', (req, res) => {
  const userId = req.params.id;
  const userData = globalStore.getUserStats(userId);

  if (!userData) {
    return res.status(404).json({ error: `User '${userId}' not found or has been erased` });
  }

  return res.json(userData);
});

/**
 * GET /api/users/:id/history
 * Returns session history and stats for a person.
 */
usersRouter.get('/:id/history', (req, res) => {
  const userId = req.params.id;
  const userData = globalStore.getUserStats(userId);

  if (!userData) {
    return res.status(404).json({ error: `User '${userId}' not found or has been erased` });
  }

  return res.json(userData);
});

/**
 * GET /api/users/:id/export
 * GDPR Data Portability: Exports complete record payload.
 */
usersRouter.get('/:id/export', (req, res) => {
  const userId = req.params.id;
  const exportData = globalStore.exportUserData(userId);

  if (!exportData) {
    return res.status(404).json({ error: `User '${userId}' not found or erased` });
  }

  res.setHeader('Content-Disposition', `attachment; filename=foqus_export_${userId}.json`);
  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify(exportData, null, 2));
});

/**
 * POST /api/users/:id/erase
 * GDPR Right to Erasure: Purges all user data.
 */
usersRouter.post('/:id/erase', (req, res) => {
  const userId = req.params.id;
  const record = {
    type: RECORD_TYPES.ERASURE_REQUEST,
    userId,
    received_at: new Date().toISOString()
  };

  const result = globalStore.processRecord(record);
  return res.json({
    message: `Erasure request executed for ${userId}`,
    result
  });
});
