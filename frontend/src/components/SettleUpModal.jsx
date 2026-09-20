import { useEffect, useState } from "react";
import Modal from "./Modal";
import Field, { Input, Select } from "./Field";
import Button from "./Button";
import { useToast } from "../context/ToastContext";
import { settlementApi } from "../api/endpoints";

export default function SettleUpModal({ open, onClose, groupId, members, prefill, onCreated }) {
  const toast = useToast();
  const [fromUserId, setFromUserId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFromUserId(prefill?.fromUserId ?? members[0]?.userId ?? "");
      setToUserId(prefill?.toUserId ?? members[1]?.userId ?? "");
      setAmount(prefill?.amount != null ? String(prefill.amount) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  const isValid =
    fromUserId && toUserId && fromUserId !== String(toUserId) && Number(amount) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const settlement = await settlementApi.create(groupId, {
        fromUserId: Number(fromUserId),
        toUserId: Number(toUserId),
        amount: Number(amount),
      });
      toast.success("Settlement recorded");
      onCreated(settlement);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settle up">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Select value={fromUserId} onChange={(e) => setFromUserId(e.target.value)}>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To">
            <Select value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {fromUserId && toUserId && fromUserId === String(toUserId) && (
          <p className="text-xs text-[var(--color-debit)]">Pick two different people.</p>
        )}

        <Field label="Amount" htmlFor="settle-amount">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-faint)]">
              $
            </span>
            <Input
              id="settle-amount"
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

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!isValid}>
            Record settlement
          </Button>
        </div>
      </form>
    </Modal>
  );
}