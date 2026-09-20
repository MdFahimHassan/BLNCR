import { Link } from "react-router-dom";
import { UsersThree, ArrowRight } from "@phosphor-icons/react";
import { formatDate } from "../lib/format";

export default function GroupCard({ group }) {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="group flex flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[var(--color-text)]">{group.name}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-faint)]">
            Created {formatDate(group.createdAt)} by {group.createdByName}
          </p>
        </div>
        <ArrowRight
          size={16}
          className="shrink-0 text-[var(--color-text-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]"
        />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-soft)]">
        <UsersThree size={14} />
        {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
      </div>
    </Link>
  );
}