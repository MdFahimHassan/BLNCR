import { useState } from "react";
import Modal from "./Modal";
import Field, { Input } from "./Field";
import Button from "./Button";
import { useToast } from "../context/ToastContext";
import { groupApi } from "../api/endpoints";

export default function AddMemberModal({ open, onClose, groupId, onAdded }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const member = await groupApi.addMember(groupId, email.trim());
      toast.success(`${member.name} added to the group`);
      setEmail("");
      onAdded(member);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add member">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Email address"
          htmlFor="member-email"
          hint="They need an existing BLNCR account with this email."
        >
          <Input
            id="member-email"
            type="email"
            required
            autoFocus
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add member
          </Button>
        </div>
      </form>
    </Modal>
  );
}