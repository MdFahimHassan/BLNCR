import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowLeft,
  MagnifyingGlass,
  Plus,
  Receipt,
  ChartBar,
  ClockCounterClockwise,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { groupApi, expenseApi, balanceApi, activityApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { EmptyState, PageSpinner } from "../components/Feedback";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import ExpenseList from "../components/ExpenseList";
import BalancesTab from "../components/BalancesTab";
import ActivityFeed from "../components/ActivityFeed";
import MembersTab from "../components/MembersTab";
import AddExpenseModal from "../components/AddExpenseModal";
import AddMemberModal from "../components/AddMemberModal";
import SettleUpModal from "../components/SettleUpModal";

const TABS = [
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "balances", label: "Balances", icon: ChartBar },
  { key: "activity", label: "Activity", icon: ClockCounterClockwise },
  { key: "members", label: "Members", icon: UsersThree },
];

export default function GroupPage() {
  const { id } = useParams();
  const groupId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState("expenses");
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);

    if (!Number.isSafeInteger(groupId) || groupId <= 0) {
      setLoadState("not-found");
      return;
    }

    try {
      const groups = await groupApi.list();
      const selectedGroup = groups.find((g) => g.id === groupId);
      if (!selectedGroup) {
        setGroup(null);
        setLoadState("not-found");
        return;
      }

      const [mem, exp, bal, act] = await Promise.all([
        groupApi.members(groupId),
        expenseApi.list(groupId),
        balanceApi.get(groupId),
        activityApi.list(groupId),
      ]);
      setGroup(selectedGroup);
      setMembers(mem);
      setExpenses(exp);
      setBalances(bal);
      setActivity(act);
      setLoadState("success");
    } catch (err) {
      setLoadError(err);
      setLoadState(err.status === 404 ? "not-found" : "error");
    }
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshMoneyData = async () => {
    try {
      const [exp, bal, act] = await Promise.all([
        expenseApi.list(groupId),
        balanceApi.get(groupId),
        activityApi.list(groupId),
      ]);
      setExpenses(exp);
      setBalances(bal);
      setActivity(act);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openSettleWithPrefill = (prefill) => {
    setSettlePrefill(prefill);
    setSettleModalOpen(true);
  };

  const changeMemberRole = async (member, role) => {
    if (role === "OWNER") {
      setConfirmAction({ type: "transfer-owner", member });
      return;
    }
    try {
      await groupApi.changeRole(groupId, member.userId, role);
      toast.success("Member role updated");
      await loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "remove-member") {
        await groupApi.removeMember(groupId, confirmAction.member.userId);
        toast.success(`${confirmAction.member.name} removed from the group`);
        setConfirmAction(null);
        await loadAll();
      } else if (confirmAction.type === "transfer-owner") {
        await groupApi.changeRole(groupId, confirmAction.member.userId, "OWNER");
        toast.success(`Ownership transferred to ${confirmAction.member.name}`);
        setConfirmAction(null);
        await loadAll();
      } else if (confirmAction.type === "leave-group") {
        await groupApi.leave(groupId);
        navigate("/dashboard", { replace: true });
      } else if (confirmAction.type === "delete-group") {
        await groupApi.delete(groupId);
        navigate("/dashboard", { replace: true });
      } else if (confirmAction.type === "delete-expense") {
        await expenseApi.remove(groupId, confirmAction.expense.id);
        toast.success("Expense deleted");
        setConfirmAction(null);
        await refreshMoneyData();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDetails = {
    "remove-member": {
      title: "Remove member?",
      description: `${confirmAction?.member.name} will lose access to this group. Their past expenses remain in the group history.`,
      confirmLabel: "Remove member",
    },
    "transfer-owner": {
      title: "Transfer ownership?",
      description: `${confirmAction?.member.name} will become the owner. You will become an admin.`,
      confirmLabel: "Transfer ownership",
    },
    "leave-group": {
      title: "Leave this group?",
      description: "You will lose access to the group. Your past expenses remain in its balances and history.",
      confirmLabel: "Leave group",
    },
    "delete-group": {
      title: "Delete this group?",
      description: "This permanently deletes the group, its expenses, settlements, and activity for all members.",
      confirmLabel: "Delete group",
    },
    "delete-expense": {
      title: "Delete expense?",
      description: `“${confirmAction?.expense.description}” will be permanently removed and group balances recalculated.`,
      confirmLabel: "Delete expense",
    },
  }[confirmAction?.type] ?? {};

  const currency = group?.currency ?? "USD";

  if (loadState === "loading") {
    return <PageSpinner label="Loading group" />;
  }

  if (loadState === "not-found") {
    return (
      <div className="mx-auto w-full max-w-xl py-10">
        <EmptyState
          icon={MagnifyingGlass}
          title="Group not found"
          description="This group may have been removed, or you may not have access."
          action={
            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate("/dashboard")}>
              Back to groups
            </Button>
          }
        />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto w-full max-w-xl py-10">
        <EmptyState
          icon={WarningCircle}
          title="Couldn't load this group"
          description={loadError?.message ?? "Check your connection and try again."}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" icon={ArrowClockwise} onClick={loadAll}>
                Retry
              </Button>
              <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate("/dashboard")}>
                Back to groups
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={13} />
          All groups
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">{group?.name ?? "Group"}</h1>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-soft)]">
              {currency}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSettleModalOpen(true)}>
              Settle up
            </Button>
            <Button size="sm" icon={Plus} onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }}>
              Add expense
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border-soft)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-[var(--color-accent)] text-[var(--color-text)]"
                : "border-transparent text-[var(--color-text-faint)] hover:text-[var(--color-text-soft)]"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "expenses" && (
        <ExpenseList
          expenses={expenses}
          currentUserId={user.id}
          currency={currency}
          groupId={groupId}
          canManageExpense={(expense) => group.currentUserRole === "OWNER"
            || group.currentUserRole === "ADMIN"
            || expense.createdByUserId === user.id
            || (!expense.createdByUserId && expense.paidByUserId === user.id)}
          onEdit={(expense) => { setEditingExpense(expense); setExpenseModalOpen(true); }}
          onDelete={(expense) => setConfirmAction({ type: "delete-expense", expense })}
        />
      )}
      {tab === "balances" && (
        <BalancesTab
          data={balances}
          currentUserId={user.id}
          currency={currency}
          onOpenSettle={openSettleWithPrefill}
        />
      )}
      {tab === "activity" && <ActivityFeed items={activity} currentUserId={user.id} currency={currency} />}
      {tab === "members" && (
        <MembersTab
          members={members}
          currentUserId={user.id}
          currentUserRole={group.currentUserRole}
          onAddMember={() => setMemberModalOpen(true)}
          onChangeRole={changeMemberRole}
          onRemoveMember={(member) => setConfirmAction({ type: "remove-member", member })}
          onLeaveGroup={() => setConfirmAction({ type: "leave-group" })}
          onDeleteGroup={() => setConfirmAction({ type: "delete-group" })}
        />
      )}

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        groupId={groupId}
        members={members}
        currentUserId={user.id}
        currency={currency}
        expenseToEdit={editingExpense}
        onCreated={refreshMoneyData}
      />
      <AddMemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        groupId={groupId}
      />
      <SettleUpModal
        open={settleModalOpen}
        onClose={() => {
          setSettleModalOpen(false);
          setSettlePrefill(null);
        }}
        groupId={groupId}
        members={members}
        currency={currency}
        prefill={settlePrefill}
        onCreated={refreshMoneyData}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmDetails.title}
        description={confirmDetails.description}
        confirmLabel={confirmDetails.confirmLabel}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}