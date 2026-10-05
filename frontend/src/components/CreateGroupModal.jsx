import { useState } from "react";
import Modal from "./Modal";
import Field, { Input, Select } from "./Field";
import Button from "./Button";
import { useToast } from "../context/ToastContext";
import { groupApi } from "../api/endpoints";
import { CURRENCIES, DEFAULT_CURRENCY } from "../lib/currencies";

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const group = await groupApi.create({ name, currency });
      toast.success(`"${group.name}" created`);
      setName("");
      setCurrency(DEFAULT_CURRENCY);
      onCreated(group);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New group">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Group name" htmlFor="group-name">
          <Input
            id="group-name"
            required
            autoFocus
            placeholder="Cox's Bazar Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Currency" htmlFor="group-currency">
          <Select
            id="group-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create group
          </Button>
        </div>
      </form>
    </Modal>
  );
}