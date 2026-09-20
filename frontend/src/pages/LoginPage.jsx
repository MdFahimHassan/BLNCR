import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field, { Input } from "../components/Field";
import Button from "../components/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-base)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-ink)]">
            B
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">
              Log in to settle up with your groups
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-text-faint)]">
          New to BLNCR?{" "}
          <Link to="/register" className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}