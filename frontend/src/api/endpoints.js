import { api } from "./client";

export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/api/auth/login", payload).then((r) => r.data),
  // The token is passed explicitly: callers clear localStorage before this runs, so the interceptor couldn't find it.
  logout: (token) =>
    api.post("/api/auth/logout", null, { headers: { Authorization: `Bearer ${token}` } }),
};

export const userApi = {
  me: () => api.get("/api/users/me").then((r) => r.data),
  avatar: (url) => api.get(url, { responseType: "blob" }).then((r) => r.data),
  updateProfile: (payload) => api.put("/api/users/me", payload).then((r) => r.data),
  uploadAvatar: (file) => {
    const payload = new FormData();
    payload.append("avatar", file);
    return api.post("/api/users/me/avatar", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
  removeAvatar: () => api.delete("/api/users/me/avatar").then((r) => r.data),
  deleteAccount: (password) => api.delete("/api/users/me", { data: { password } }),
};

export const groupApi = {
  list: () => api.get("/api/groups").then((r) => r.data),
  create: (payload) => api.post("/api/groups", payload).then((r) => r.data),
  members: (groupId) => api.get(`/api/groups/${groupId}/members`).then((r) => r.data),
  invite: (groupId) => api.post(`/api/groups/${groupId}/invitations`).then((r) => r.data),
  changeRole: (groupId, userId, role) =>
    api.patch(`/api/groups/${groupId}/members/${userId}/role`, { role }).then((r) => r.data),
  removeMember: (groupId, userId) => api.delete(`/api/groups/${groupId}/members/${userId}`),
  leave: (groupId) => api.post(`/api/groups/${groupId}/leave`),
  delete: (groupId) => api.delete(`/api/groups/${groupId}`),
};

export const invitationApi = {
  accept: (token) => api.post(`/api/invitations/${encodeURIComponent(token)}/accept`).then((r) => r.data),
};

export const dashboardApi = {
  summary: () => api.get("/api/dashboard/summary").then((r) => r.data),
};

export const expenseApi = {
  list: (groupId) => api.get(`/api/groups/${groupId}/expenses`).then((r) => r.data),
  create: (groupId, payload, idempotencyKey) =>
    api.post(`/api/groups/${groupId}/expenses`, payload, {
      headers: { "Idempotency-Key": idempotencyKey },
    }).then((r) => r.data),
  update: (groupId, expenseId, payload) =>
    api.put(`/api/groups/${groupId}/expenses/${expenseId}`, payload).then((r) => r.data),
  remove: (groupId, expenseId) => api.delete(`/api/groups/${groupId}/expenses/${expenseId}`),
};

export const balanceApi = {
  get: (groupId) => api.get(`/api/groups/${groupId}/balances`).then((r) => r.data),
};

export const settlementApi = {
  list: (groupId) => api.get(`/api/groups/${groupId}/settlements`).then((r) => r.data),
  create: (groupId, payload) =>
    api.post(`/api/groups/${groupId}/settlements`, payload).then((r) => r.data),
};

export const activityApi = {
  list: (groupId) => api.get(`/api/groups/${groupId}/activity`).then((r) => r.data),
};