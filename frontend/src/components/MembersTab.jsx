import { UserPlus } from "@phosphor-icons/react";
import Avatar from "./Avatar";
import Button from "./Button";
import { formatDate } from "../lib/format";

export default function MembersTab({ members, currentUserId, onAddMember }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-faint)]">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
        <Button size="sm" variant="secondary" icon={UserPlus} onClick={onAddMember}>
          Add member
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-[var(--color-border-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 bg-[var(--color-surface)] px-4 py-3">
            <Avatar name={m.name} id={m.userId} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">
                {m.userId === currentUserId ? `${m.name} (you)` : m.name}
              </p>
              <p className="truncate text-xs text-[var(--color-text-faint)]">{m.email}</p>
            </div>
            <p className="shrink-0 text-xs text-[var(--color-text-faint)]">
              joined {formatDate(m.joinedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}