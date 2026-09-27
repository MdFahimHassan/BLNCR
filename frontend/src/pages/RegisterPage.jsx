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

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [agreed, setAgreed] = useState(false);
  const [agreedTouched, setAgreedTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = EMAIL_RE.test(form.email);
  const passwordValid = form.password.length >= 8;

  const emailError = touched.email && form.email.length > 0 && !emailValid
    ? "Enter a valid email address"
    : undefined;

  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setAgreedTouched(true);
    if (!emailValid || !passwordValid || !agreed) return;
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
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[var(--color-base)] px-4">
      <BackgroundFX />
      <Reveal className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/" aria-label="BLNCR home">
            <img src={logo} alt="BLNCR" className="h-9 w-9 rounded-[7px] transition-opacity hover:opacity-90" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-[var(--color-text-faint)]">
              Split bills without the group-chat math
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
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
          <Field
            label="Password"
            htmlFor="password"
            hint={
              <span className={passwordValid ? "text-[var(--color-credit)]" : undefined}>
                At least 8 characters
              </span>
            }
          >
            <PasswordInput
              id="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => markTouched("password")}
            />
          </Field>
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--color-text-faint)]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                setAgreedTouched(true);
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            <span>
              I agree to the{" "}
              <Link
                to="/terms"
                target="_blank"
                className="text-[var(--color-text-soft)] underline underline-offset-2 hover:text-[var(--color-text)]"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                target="_blank"
                className="text-[var(--color-text-soft)] underline underline-offset-2 hover:text-[var(--color-text)]"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {agreedTouched && !agreed && (
            <p className="-mt-2 text-xs text-[var(--color-debit)]">
              You need to agree before creating an account.
            </p>
          )}

          <Button type="submit" loading={loading} disabled={!agreed} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-text-faint)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]">
            Log in
          </Link>
        </p>
      </Reveal>
    </div>
  );
}