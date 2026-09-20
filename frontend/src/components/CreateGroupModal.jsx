import { useState } from "react";
import Modal from "./Modal";
import Field, { Input } from "./Field";
import Button from "./Button";
import { useToast } from "../context/ToastContext";
import { groupApi } from "../api/endpoints";

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const group = await groupApi.create({ name });
      toast.success(`"${group.name}" created`);
      setName("");
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