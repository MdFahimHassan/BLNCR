import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { Input } from "./Field";

/**
 * Drop-in replacement for <Input type="password" /> with a show/hide toggle.
 * Accepts the same props as Input (id, value, onChange, error, etc.).
 */
export default function PasswordInput({ className = "", ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center">
      <Input type={visible ? "text" : "password"} className={`pr-10 ${className}`} {...rest} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-1 z-10 flex items-center justify-center px-2 text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text-soft)]"
      >
        {visible ? <Eye size={16} /> : <EyeSlash size={16} />}
      </button>
    </div>
  );
}