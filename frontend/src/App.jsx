import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
// LandingPage stays a static import: it's the "/" entry point and must not
// wait on an extra chunk fetch. Everything past it is behind a login/register
// action or an authenticated route, so it's safe (and much lighter for the
// marketing page) to split into its own chunk, fetched only when needed.
import LandingPage from "./pages/LandingPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GroupPage = lazy(() => import("./pages/GroupPage"));

// Minimal, layout-neutral fallback — avoids shipping a spinner component
// into the landing page's bundle just to cover a ~100-200ms chunk fetch.
function RouteFallback() {
  return (
    <div
      style={{ minHeight: "100vh", background: "var(--color-base, #0a0b0d)" }}
      aria-hidden="true"
    />
  );
}

// "/" is the public, recruiter-facing marketing page. A logged-in user
// bookmarking or landing on "/" is sent straight to their dashboard instead.
function RootRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function AuthRedirect({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute>
              <GroupPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}