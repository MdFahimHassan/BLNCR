import axios from "axios";

// API base URL comes from VITE_API_BASE_URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9090";
export const AUTH_EXPIRED_EVENT = "blncr:auth-expired";

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

// Normalizes the backend ApiError into one readable message and force-logs-out on 401.
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
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    return Promise.reject(normalizedError);
  }
);