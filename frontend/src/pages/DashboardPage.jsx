import { useEffect, useState } from "react";
import { Plus, UsersThree } from "@phosphor-icons/react";
import { groupApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useGroupBalances } from "../lib/useGroupBalances";
import { formatMoney } from "../lib/format";
import GroupCard from "../components/GroupCard";
import CreateGroupModal from "../components/CreateGroupModal";
import Button from "../components/Button";
import { PageSpinner, EmptyState } from "../components/Feedback";

export default function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [groups, setGroups] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const byGroup = useGroupBalances(groups, user?.id);

  useEffect(() => {
    groupApi
      .list()
      .then(setGroups)
      .catch((err) => toast.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (group) => setGroups((prev) => [group, ...(prev ?? [])]);

  if (groups === null) return <PageSpinner label="Loading your groups" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Your groups</h1>
          <p className="mt-1 text-sm text-[var(--color-text-faint)]">
            <Overview groups={groups} byGroup={byGroup} />
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          New group
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={UsersThree}
          title="No groups yet"
          description="Create a group for a trip, apartment, or anything you split costs for."
          action={
            <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
              Create your first group
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} balance={byGroup[g.id]} />
          ))}
        </div>
      )}

      <CreateGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

// The static "Track shared expenses and settle up" tagline is the honest
// default while balances are still loading (or there's nothing to
// summarize yet). Once every group has answered, it's replaced with the
// user's actual net position — turning dead subtitle copy into the one
// number that matters most on this page. Deliberately waits for *all* of
// them rather than updating as each one lands, so the line changes once,
// not several times in a row while cards are still settling in.
function Overview({ groups, byGroup }) {
  if (groups.length === 0) return "Track shared expenses and settle up";

  const settled = groups.filter((g) => byGroup[g.id]);
  if (settled.length < groups.length) return "Track shared expenses and settle up";

  const net = settled.reduce((sum, g) => sum + (byGroup[g.id].net ?? 0), 0);
  if (Math.abs(net) < 0.005) return "You're all settled up across every group";
  return net > 0
    ? `You're owed ${formatMoney(net)} across your groups`
    : `You owe ${formatMoney(net)} across your groups`;
}