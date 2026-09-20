import { api } from "./client";

export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/api/auth/login", payload).then((r) => r.data),
};

export const userApi = {
  me: () => api.get("/api/users/me").then((r) => r.data),
};

export const groupApi = {
  list: () => api.get("/api/groups").then((r) => r.data),
  create: (payload) => api.post("/api/groups", payload).then((r) => r.data),
  members: (groupId) => api.get(`/api/groups/${groupId}/members`).then((r) => r.data),
  addMember: (groupId, email) =>
    api.post(`/api/groups/${groupId}/members`, { email }).then((r) => r.data),
};

export const expenseApi = {
  list: (groupId) => api.get(`/api/groups/${groupId}/expenses`).then((r) => r.data),
  create: (groupId, payload) =>
    api.post(`/api/groups/${groupId}/expenses`, payload).then((r) => r.data),
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