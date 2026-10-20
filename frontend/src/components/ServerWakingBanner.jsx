import { useEffect, useState } from "react";
import { SERVER_AWAKE_EVENT, SERVER_WAKING_EVENT } from "../api/client";
import { Spinner } from "./Feedback";

// Shown only when an API request is slow, which on the free-tier host usually means the
// server is waking up from sleep. Hides itself as soon as the slow requests finish.
export default function ServerWakingBanner() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const show = () => setWaking(true);
    const hide = () => setWaking(false);
    window.addEventListener(SERVER_WAKING_EVENT, show);
    window.addEventListener(SERVER_AWAKE_EVENT, hide);
    return () => {
      window.removeEventListener(SERVER_WAKING_EVENT, show);
      window.removeEventListener(SERVER_AWAKE_EVENT, hide);
    };
  }, []);

  if (!waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-3 z-[100] mx-auto flex w-fit max-w-[92vw] items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-text)] shadow-lg"
    >
      <Spinner size={18} />
      <span>
        Waking up the server. This can take up to a minute after a quiet period, and only the
        first time.
      </span>
    </div>
  );
}