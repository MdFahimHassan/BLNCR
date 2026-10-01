import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, userApi } from "../api/endpoints";
import { AUTH_EXPIRED_EVENT } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // localStorage can be edited by the user or corrupted; never let bad JSON crash the app.
    try {
      const raw = localStorage.getItem("blncr_user");
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      localStorage.removeItem("blncr_user");
      return null;
    }
  });
  useEffect(() => {
    if (user) {
      localStorage.setItem("blncr_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("blncr_user");
    }
  }, [user]);

  useEffect(() => {
    const handleExpiredSession = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    userApi.me().then((profile) => {
      if (active) setUser(profile);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);

  const applyAuth = useCallback((auth) => {
    localStorage.setItem("blncr_token", auth.token);
    setUser({ id: auth.userId, name: auth.name, email: auth.email });
  }, []);

  const login = useCallback(
    async (email, password) => {
      const auth = await authApi.login({ email, password });
      applyAuth(auth);
      return auth;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (name, email, password) => {
      const auth = await authApi.register({ name, email, password });
      applyAuth(auth);
      return auth;
    },
    [applyAuth]
  );

  const saveProfile = useCallback(async (payload) => {
    const auth = await userApi.updateProfile(payload);
    applyAuth(auth);
    const profile = await userApi.me();
    setUser(profile);
    return profile;
  }, [applyAuth]);

  const uploadAvatar = useCallback(async (file) => {
    const profile = await userApi.uploadAvatar(file);
    setUser(profile);
    return profile;
  }, []);

  const removeAvatar = useCallback(async () => {
    const profile = await userApi.removeAvatar();
    setUser(profile);
    return profile;
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await userApi.deleteAccount(password);
    localStorage.removeItem("blncr_token");
    localStorage.removeItem("blncr_user");
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    // Best-effort server-side revocation so the token is dead even if someone copied it.
    const token = localStorage.getItem("blncr_token");
    if (token) authApi.logout(token).catch(() => {});
    localStorage.removeItem("blncr_token");
    localStorage.removeItem("blncr_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, saveProfile, uploadAvatar, removeAvatar, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}