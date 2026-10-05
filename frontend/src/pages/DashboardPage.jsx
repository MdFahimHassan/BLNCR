import { useEffect, useState } from "react";
import { Plus, UsersThree } from "@phosphor-icons/react";
import { dashboardApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { formatMoney } from "../lib/format";
import GroupCard from "../components/GroupCard";
import CreateGroupModal from "../components/CreateGroupModal";
import Button from "../components/Button";
import { PageSpinner, EmptyState } from "../components/Feedback";

export default function DashboardPage() {
  const toast = useToast();
  const [groups, setGroups] = useState(null);
  const [byGroup, setByGroup] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dashboardApi
      .summary()
      .then(({ groups: loadedGroups, netBalances }) => {
        setGroups(loadedGroups);
        setByGroup(Object.fromEntries(
          Object.entries(netBalances ?? {}).map(([groupId, net]) => [groupId, { net: Number(net) }]),
        ));
      })
      .catch((err) => toast.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (group) => {
    setGroups((prev) => [group, ...(prev ?? [])]);
    setByGroup((prev) => ({ ...prev, [group.id]: { net: 0 } }));
  };

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

// Shows the tagline until every group's balances have loaded, then the user's net position (one update, not one per group).
function Overview({ groups, byGroup }) {
  if (groups.length === 0) return "Track shared expenses and settle up";

  const settled = groups.filter((g) => byGroup[g.id]);
  if (settled.length < groups.length) return "Track shared expenses and settle up";

  // Groups can use different currencies, and adding ৳ to $ would be meaningless,
  // so totals are kept per currency and listed side by side.
  const totals = {};
  for (const g of settled) {
    const cur = g.currency ?? "USD";
    totals[cur] = (totals[cur] ?? 0) + (byGroup[g.id].net ?? 0);
  }
  const open = Object.entries(totals).filter(([, n]) => Math.abs(n) >= 0.005);
  if (open.length === 0) return "You're all settled up across every group";

  const owed = open.filter(([, n]) => n > 0).map(([cur, n]) => formatMoney(n, cur));
  const owe = open.filter(([, n]) => n < 0).map(([cur, n]) => formatMoney(n, cur));
  const parts = [];
  if (owed.length) parts.push(`You're owed ${owed.join(" + ")}`);
  if (owe.length) parts.push(`${owed.length ? "you owe" : "You owe"} ${owe.join(" + ")}`);
  return `${parts.join(" and ")} across your groups`;
}