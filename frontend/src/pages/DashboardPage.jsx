import { useEffect, useState } from "react";
import { Plus, UsersThree } from "@phosphor-icons/react";
import { groupApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import GroupCard from "../components/GroupCard";
import CreateGroupModal from "../components/CreateGroupModal";
import Button from "../components/Button";
import { PageSpinner, EmptyState } from "../components/Feedback";

export default function DashboardPage() {
  const toast = useToast();
  const [groups, setGroups] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
            Track shared expenses and settle up
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
            <GroupCard key={g.id} group={g} />
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