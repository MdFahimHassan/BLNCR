import axios from "axios";

// API base URL comes from VITE_API_BASE_URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9090";
export const AUTH_EXPIRED_EVENT = "blncr:auth-expired";

// The free-tier backend sleeps when idle and can take 30-50s to wake up. If a request is
// still pending after SLOW_REQUEST_MS, tell the UI so it can explain the wait instead of
// looking frozen. SERVER_AWAKE_EVENT fires once every slow request has settled.
export const SERVER_WAKING_EVENT = "blncr:server-waking";
export const SERVER_AWAKE_EVENT = "blncr:server-awake";
const SLOW_REQUEST_MS = 4000;
let slowRequests = 0;

function startSlowTimer(config) {
  config.__slowTimer = setTimeout(() => {
    config.__slowFired = true;
    slowRequests += 1;
    if (slowRequests === 1) window.dispatchEvent(new Event(SERVER_WAKING_EVENT));
  }, SLOW_REQUEST_MS);
}

function stopSlowTimer(config) {
  if (!config) return;
  clearTimeout(config.__slowTimer);
  if (config.__slowFired) {
    config.__slowFired = false;
    slowRequests -= 1;
    if (slowRequests === 0) window.dispatchEvent(new Event(SERVER_AWAKE_EVENT));
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("blncr_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  startSlowTimer(config);
  return config;
});

// Normalizes the backend ApiError into one readable message and force-logs-out on 401.
api.interceptors.response.use(
  (response) => {
    stopSlowTimer(response.config);
    return response;
  },
  (error) => {
    stopSlowTimer(error.config);
    const data = error.response?.data;
    let message = "Something went wrong. Please try again.";

    if (data?.details?.length) {
      message = data.details.join(" ");
    } else if (data?.message) {
      message = data.message;
    } else if (error.message === "Network Error") {
      message = "Can't reach the server. Check your connection and try again.";
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