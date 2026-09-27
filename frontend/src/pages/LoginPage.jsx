import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field, { Input } from "../components/Field";
import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";
import BackgroundFX from "../components/BackgroundFX";
import Reveal from "../components/Reveal";
import logo from "../assets/logo.svg";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false });
  const [loading, setLoading] = useState(false);

  const emailValid = EMAIL_RE.test(form.email);
  const emailError = touched.email && form.email.length > 0 && !emailValid
    ? "Enter a valid email address"
    : undefined;

  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true });
    if (!emailValid) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[var(--color-base)] px-4">
      <BackgroundFX />
      <Reveal className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/" aria-label="BLNCR home">
            <img src={logo} alt="BLNCR" className="h-9 w-9 rounded-[7px] transition-opacity hover:opacity-90" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">
              Log in to settle up with your groups
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <Field label="Email" htmlFor="email" error={emailError}>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              error={emailError}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => markTouched("email")}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <PasswordInput
              id="password"
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
      </Reveal>
    </div>
  );
}