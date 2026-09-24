import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field, { Input } from "../components/Field";
import Button from "../components/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
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
            <h1 className="text-lg font-semibold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">
              Split bills without the group-chat math
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <Field label="Name" htmlFor="name">
            <Input
              id="name"
              required
              autoComplete="name"
              placeholder="Jane Rahman"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
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
          <Field label="Password" htmlFor="password" hint="At least 8 characters">
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-text-faint)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}