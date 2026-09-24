import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Receipt, ChartBar, ClockCounterClockwise, UsersThree } from "@phosphor-icons/react";
import { groupApi, expenseApi, balanceApi, activityApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageSpinner } from "../components/Feedback";
import Button from "../components/Button";
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
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState("expenses");
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [groups, mem, exp, bal, act] = await Promise.all([
        groupApi.list(),
        groupApi.members(groupId),
        expenseApi.list(groupId),
        balanceApi.get(groupId),
        activityApi.list(groupId),
      ]);
      setGroup(groups.find((g) => g.id === groupId) ?? null);
      setMembers(mem);
      setExpenses(exp);
      setBalances(bal);
      setActivity(act);
    } catch (err) {
      toast.error(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!members || !expenses || !balances || !activity) {
    return <PageSpinner label="Loading group" />;
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
          <h1 className="text-xl font-semibold tracking-tight">{group?.name ?? "Group"}</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSettleModalOpen(true)}>
              Settle up
            </Button>
            <Button size="sm" icon={Plus} onClick={() => setExpenseModalOpen(true)}>
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

      {tab === "expenses" && <ExpenseList expenses={expenses} currentUserId={user.id} />}
      {tab === "balances" && (
        <BalancesTab data={balances} currentUserId={user.id} onOpenSettle={openSettleWithPrefill} />
      )}
      {tab === "activity" && <ActivityFeed items={activity} currentUserId={user.id} />}
      {tab === "members" && (
        <MembersTab
          members={members}
          currentUserId={user.id}
          onAddMember={() => setMemberModalOpen(true)}
        />
      )}

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        groupId={groupId}
        members={members}
        currentUserId={user.id}
        onCreated={refreshMoneyData}
      />
      <AddMemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        groupId={groupId}
        onAdded={(m) => setMembers((prev) => [...prev, m])}
      />
      <SettleUpModal
        open={settleModalOpen}
        onClose={() => {
          setSettleModalOpen(false);
          setSettlePrefill(null);
        }}
        groupId={groupId}
        members={members}
        prefill={settlePrefill}
        onCreated={refreshMoneyData}
      />
    </div>
  );
}