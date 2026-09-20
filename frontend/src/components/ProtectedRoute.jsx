import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "./AppShell";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}