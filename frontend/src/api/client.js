import axios from "axios";

// Base URL comes from an env var so it's trivial to point at a deployed
// backend later (Phase 6) without touching code.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9090";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("blncr_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes backend ApiError { timestamp, status, error, message, details }
// into a single readable string, and force-logs-out on 401 (expired/invalid token).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    let message = "Something went wrong. Please try again.";

    if (data?.details?.length) {
      message = data.details.join(" ");
    } else if (data?.message) {
      message = data.message;
    } else if (error.message === "Network Error") {
      message = "Can't reach the server. Is the backend running?";
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("blncr_token");
      localStorage.removeItem("blncr_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(new Error(message));
  }
);