/**
 * Frontend API client.
 */

export const api = {
  async getUsers() {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUserDetails(userId) {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Failed to fetch user data for ${userId}`);
    return res.json();
  },

  async eraseUser(userId) {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/erase`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to erase user');
    return res.json();
  },

  async getCommunityMetrics() {
    const res = await fetch('/api/community');
    if (!res.ok) throw new Error('Failed to fetch community metrics');
    return res.json();
  },

  async getHealthSummary() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Failed to fetch health summary');
    return res.json();
  },

  async getQuarantineRecords(limit = 50) {
    const res = await fetch(`/api/health/quarantine?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch quarantine records');
    return res.json();
  },

  async testConcurrency(count = 10, userId = 'usr_ui_tester') {
    const res = await fetch('/api/dev/concurrent-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, userId })
    });
    if (!res.ok) throw new Error('Failed to run concurrency stress test');
    return res.json();
  }
};
