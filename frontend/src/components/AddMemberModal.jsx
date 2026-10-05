import { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "@phosphor-icons/react";
import Modal from "./Modal";
import Button from "./Button";
import { useToast } from "../context/ToastContext";
import { groupApi } from "../api/endpoints";

export default function AddMemberModal({ open, onClose, groupId }) {
  const toast = useToast();
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createInvite = async () => {
    setLoading(true);
    try {
      const invitation = await groupApi.invite(groupId);
      setInviteUrl(`${window.location.origin}/invites/${encodeURIComponent(invitation.token)}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy the invite link");
    }
  };

  const close = () => {
    setInviteUrl("");
    setCopied(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Invite members">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-text-faint)]">
          Create a one-time link. Anyone signed in with the link can join this group.
          It expires after seven days.
        </p>
        {inviteUrl ? (
          <>
            <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
              <LinkIcon size={16} className="shrink-0 text-[var(--color-text-faint)]" />
              <input
                readOnly
                aria-label="Group invite link"
                value={inviteUrl}
                className="min-w-0 flex-1 bg-transparent text-xs text-[var(--color-text)] outline-none"
                onFocus={(event) => event.target.select()}
              />
              <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={copyInvite}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={close}>Done</Button>
            </div>
          </>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button icon={LinkIcon} loading={loading} onClick={createInvite}>Create invite link</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}