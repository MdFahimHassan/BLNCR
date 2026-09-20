import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("blncr_user");
    return raw ? JSON.parse(raw) : null;
  });
  useEffect(() => {
    if (user) {
      localStorage.setItem("blncr_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("blncr_user");
    }
  }, [user]);

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

  const logout = useCallback(() => {
    localStorage.removeItem("blncr_token");
    localStorage.removeItem("blncr_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}