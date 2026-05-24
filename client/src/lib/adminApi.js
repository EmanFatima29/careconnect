/**
 * Admin API
 * Client-side wrappers for /api/admin/* endpoints.
 * Requires admin/superadmin role — the server enforces this via requireAdmin.
 */

import api from "@/lib/api";

const adminApi = {
  // ── User Statistics ──────────────────────────────────
  /**
   * GET /api/admin/stats/users
   * @param {{ from?: string, to?: string }} [params]
   * @returns {{ totalUsers, byRole, byAccount, byOnlineStatus, newUsersInRange, newUsersByDay }}
   */
  async getUserStats(params = {}) {
    const res = await api.get("/api/admin/stats/users", { params });
    return res.data?.data ?? res.data;
  },

  // ── Prescription Summaries ───────────────────────────────────
  /**
   * GET /api/admin/stats/prescriptions
   * @param {{ from?: string, to?: string }} [params]
   * @returns {{ totalPrescriptions, prescriptionsCreatedInRange, byStatus, areaSummary, topByCount, topByArea }}
   */
  async getPrescriptionStats(params = {}) {
    const res = await api.get("/api/admin/stats/prescriptions", { params });
    return res.data?.data ?? res.data;
  },

  // ── Chat Usage Stats ─────────────────────────────────
  /**
   * GET /api/admin/stats/chats
   * @param {{ from?: string, to?: string }} [params]
   * @returns {{ chats, messages, activity }}
   */
  async getChatStats(params = {}) {
    const res = await api.get("/api/admin/stats/chats", { params });
    return res.data?.data ?? res.data;
  },

  // ── Activity Logs ────────────────────────────────────
  /**
   * GET /api/admin/activity-logs
   * @param {{ page?: number, limit?: number, action?: string, entityType?: string, status?: string, actorId?: string }} [params]
   * @returns {{ page, limit, total, range, items }}
   */
  async getActivityLogs(params = {}) {
    const res = await api.get("/api/admin/activity-logs", { params });
    return res.data?.data ?? res.data;
  },

  // ── User Management ──────────────────────────────────
  /**
   * DELETE /api/users/:id
   * @param {string} userId
   */
  async deleteUser(userId) {
    const res = await api.delete(`/api/users/${userId}`);
    return res.data?.data ?? res.data;
  },

  /**
   * PATCH /api/users/:email  (admin can update any user)
   * @param {string} email
   * @param {Object} updates
   */
  async updateUser(email, updates) {
    const res = await api.patch(`/api/users/${email}`, updates);
    return res.data?.data ?? res.data;
  },

  /**
   * GET /api/users  (all users)
   */
  async getAllUsers() {
    const res = await api.get("/api/users");
    return res.data?.data ?? res.data;
  },
};

export default adminApi;
