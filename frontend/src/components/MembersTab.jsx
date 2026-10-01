import { SignOut, Trash, UserPlus, UsersThree } from "@phosphor-icons/react";
import Avatar from "./Avatar";
import Button from "./Button";
import { formatDate } from "../lib/format";

const ROLE_LABEL = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

export default function MembersTab({
  members,
  currentUserId,
  currentUserRole,
  onAddMember,
  onChangeRole,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
}) {
  const isOwner = currentUserRole === "OWNER";
  const isManager = isOwner || currentUserRole === "ADMIN";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-text-faint)]">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
        <div className="flex flex-wrap gap-2">
          {isManager && (
            <Button size="sm" variant="secondary" icon={UserPlus} onClick={onAddMember}>
              Invite member
            </Button>
          )}
          {isOwner ? (
            <Button size="sm" variant="danger" icon={Trash} onClick={onDeleteGroup}>
              Delete group
            </Button>
          ) : (
            <Button size="sm" variant="ghost" icon={SignOut} onClick={onLeaveGroup}>
              Leave group
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[var(--color-border-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const canRemove = isManager && member.role !== "OWNER"
            && (isOwner || member.role === "MEMBER") && !isSelf;

          return (
            <div key={member.userId} className="flex flex-wrap items-center gap-3 bg-[var(--color-surface)] px-4 py-3">
              <Avatar name={member.name} id={member.userId} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">
                  {isSelf ? `${member.name} (you)` : member.name}
                </p>
                <p className="truncate text-xs text-[var(--color-text-faint)]">{member.email}</p>
              </div>
              <p className="shrink-0 text-xs text-[var(--color-text-faint)]">
                joined {formatDate(member.joinedAt)}
              </p>
              {isOwner && member.role !== "OWNER" ? (
                <select
                  aria-label={`Role for ${member.name}`}
                  value={member.role}
                  onChange={(event) => onChangeRole(member, event.target.value)}
                  className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-xs text-[var(--color-text)]"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Transfer ownership</option>
                </select>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-faint)]">
                  {member.role === "OWNER" && <UsersThree size={13} />}
                  {ROLE_LABEL[member.role]}
                </span>
              )}
              {canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash}
                  aria-label={`Remove ${member.name}`}
                  title={`Remove ${member.name}`}
                  onClick={() => onRemoveMember(member)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}