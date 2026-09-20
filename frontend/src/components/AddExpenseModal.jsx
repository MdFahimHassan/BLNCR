import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import Field, { Input, Select } from "./Field";
import Button from "./Button";
import Avatar from "./Avatar";
import { useToast } from "../context/ToastContext";
import { expenseApi } from "../api/endpoints";

const SPLIT_TYPES = [
  { value: "EQUAL", label: "Equal" },
  { value: "EXACT", label: "Exact" },
  { value: "PERCENTAGE", label: "Percent" },
];

export default function AddExpenseModal({ open, onClose, groupId, members, currentUserId, onCreated }) {
  const toast = useToast();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);
  const [splitType, setSplitType] = useState("EQUAL");
  const [selected, setSelected] = useState(() => new Set(members.map((m) => m.userId)));
  const [values, setValues] = useState({}); // userId -> string, used for EXACT / PERCENTAGE
  const [loading, setLoading] = useState(false);

  // Reset the form each time the modal is opened for a clean slate.
  useEffect(() => {
    if (open) {
      setDescription("");
      setAmount("");
      setPaidByUserId(currentUserId);
      setSplitType("EQUAL");
      setSelected(new Set(members.map((m) => m.userId)));
      setValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleMember = (userId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const selectedMembers = members.filter((m) => selected.has(m.userId));

  const exactTotal = useMemo(
    () => selectedMembers.reduce((sum, m) => sum + (Number(values[m.userId]) || 0), 0),
    [values, selectedMembers]
  );
  const percentTotal = exactTotal;

  const splitEvenly = () => {
    if (selectedMembers.length === 0) return;
    if (splitType === "EXACT") {
      const amt = Number(amount) || 0;
      const cents = Math.round(amt * 100);
      const base = Math.floor(cents / selectedMembers.length);
      const remainder = cents - base * selectedMembers.length;
      const next = {};
      selectedMembers.forEach((m, i) => {
        const centsForUser = base + (i < remainder ? 1 : 0);
        next[m.userId] = (centsForUser / 100).toFixed(2);
      });
      setValues(next);
    } else if (splitType === "PERCENTAGE") {
      const base = Math.floor((100 / selectedMembers.length) * 100) / 100;
      const next = {};
      let assigned = 0;
      selectedMembers.forEach((m, i) => {
        if (i === selectedMembers.length - 1) {
          next[m.userId] = (100 - assigned).toFixed(2);
        } else {
          next[m.userId] = base.toFixed(2);
          assigned += base;
        }
      });
      setValues(next);
    }
  };

  const isValid =
    description.trim() &&
    Number(amount) > 0 &&
    paidByUserId &&
    selectedMembers.length > 0 &&
    (splitType === "EQUAL" ||
      (splitType === "EXACT" && Math.abs(exactTotal - Number(amount)) < 0.01) ||
      (splitType === "PERCENTAGE" && Math.abs(percentTotal - 100) < 0.01));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const splits = selectedMembers.map((m) => ({
        userId: m.userId,
        value: splitType === "EQUAL" ? null : Number(values[m.userId] ?? 0),
      }));
      const expense = await expenseApi.create(groupId, {
        description: description.trim(),
        amount: Number(amount),
        paidByUserId: Number(paidByUserId),
        splitType,
        splits,
      });
      toast.success("Expense added");
      onCreated(expense);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add expense" width="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Description" htmlFor="desc">
          <Input
            id="desc"
            required
            autoFocus
            placeholder="Dinner at Sultan's Dine"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount" htmlFor="amount">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-faint)]">
                $
              </span>
              <Input
                id="amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="pl-7 ledger-figure"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Paid by" htmlFor="paidBy">
            <Select
              id="paidBy"
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.userId === currentUserId ? "You" : m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Split type">
          <div className="flex rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
            {SPLIT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSplitType(t.value)}
                className={`flex-1 rounded-[calc(var(--radius-control)-4px)] py-1.5 text-xs font-medium transition-colors ${
                  splitType === t.value
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                    : "text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-text-soft)]">
              Split between
            </span>
            {splitType !== "EQUAL" && (
              <button
                type="button"
                onClick={splitEvenly}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                Split evenly
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
            {members.map((m) => {
              const checked = selected.has(m.userId);
              return (
                <div
                  key={m.userId}
                  className={`flex items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2 transition-colors ${
                    checked
                      ? "border-[var(--color-border-strong)] bg-[var(--color-surface-2)]"
                      : "border-[var(--color-border-soft)] opacity-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(m.userId)}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <Avatar name={m.name} id={m.userId} size="sm" />
                  <span className="flex-1 truncate text-sm">
                    {m.userId === currentUserId ? "You" : m.name}
                  </span>
                  {splitType !== "EQUAL" && checked && (
                    <div className="relative w-24">
                      {splitType === "EXACT" && (
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-faint)]">
                          $
                        </span>
                      )}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={values[m.userId] ?? ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [m.userId]: e.target.value }))
                        }
                        className={`w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-right text-xs ledger-figure outline-none focus:border-[var(--color-accent)] ${
                          splitType === "EXACT" ? "pl-5 pr-2" : "pr-5 pl-2"
                        }`}
                      />
                      {splitType === "PERCENTAGE" && (
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-faint)]">
                          %
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {splitType === "EXACT" && (
            <p
              className={`text-xs ledger-figure ${
                Math.abs(exactTotal - Number(amount || 0)) < 0.01
                  ? "text-[var(--color-credit)]"
                  : "text-[var(--color-debit)]"
              }`}
            >
              ${exactTotal.toFixed(2)} of ${Number(amount || 0).toFixed(2)} assigned
            </p>
          )}
          {splitType === "PERCENTAGE" && (
            <p
              className={`text-xs ledger-figure ${
                Math.abs(percentTotal - 100) < 0.01
                  ? "text-[var(--color-credit)]"
                  : "text-[var(--color-debit)]"
              }`}
            >
              {percentTotal.toFixed(2)}% of 100% assigned
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!isValid}>
            Add expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}