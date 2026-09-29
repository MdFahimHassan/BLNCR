import { useEffect, useRef, useState } from "react";
import { balanceApi } from "../api/endpoints";

// The groups list endpoint doesn't carry balances, so the dashboard asks for
// each group's balances itself — a few at a time rather than all at once, so
// a user with many groups doesn't fire a burst of requests on load. Cards
// render immediately and fill in as each result lands.
const CONCURRENCY = 4;

/**
 * Returns { [groupId]: { net } | { error: true } } for the given groups,
 * where `net` is the signed net balance for `userId` in that group
 * (positive = the group owes them, negative = they owe the group).
 */
export function useGroupBalances(groups, userId) {
  const [byGroup, setByGroup] = useState({});
  // Mirrors completed entries so the effect can skip groups it already has
  // without depending on `byGroup` (which would re-run it after every result).
  // Only marked on *completion*, never on start — so a cancelled run (dev
  // StrictMode remount, or `groups` changing mid-flight) simply gets redone.
  const doneRef = useRef(new Set());

  useEffect(() => {
    if (!groups?.length) return;
    const pending = groups.filter((g) => !doneRef.current.has(g.id));
    if (!pending.length) return;

    let cancelled = false;
    let cursor = 0;

    const worker = async () => {
      while (cursor < pending.length && !cancelled) {
        const group = pending[cursor++];
        let entry;
        try {
          const data = await balanceApi.get(group.id);
          const mine = data.balances.find((b) => b.userId === userId);
          entry = { net: Number(mine?.netBalance ?? 0) };
        } catch {
          entry = { error: true };
        }
        if (cancelled) return;
        doneRef.current.add(group.id);
        setByGroup((prev) => ({ ...prev, [group.id]: entry }));
      }
    };

    Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker);
    return () => {
      cancelled = true;
    };
  }, [groups, userId]);

  return byGroup;
}