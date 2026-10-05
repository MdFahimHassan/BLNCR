import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddExpenseModal from "./AddExpenseModal";
import { ToastProvider } from "../context/ToastContext";
import { expenseApi } from "../api/endpoints";

vi.mock("./Avatar", () => ({ default: ({ name }) => <span>{name}</span> }));
vi.mock("../api/endpoints", () => ({
  expenseApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const members = [
  { userId: 1, name: "Alice" },
  { userId: 2, name: "Bob" },
];

function renderModal() {
  return render(
    <ToastProvider>
      <AddExpenseModal
        open
        onClose={vi.fn()}
        groupId={7}
        members={members}
        currentUserId={1}
        currency="USD"
        onCreated={vi.fn()}
      />
    </ToastProvider>,
  );
}

describe("AddExpenseModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "request-key" });
  });

  it("sends decimal strings and exact split amounts without float conversion", async () => {
    const user = userEvent.setup();
    expenseApi.create.mockResolvedValue({ id: 99 });
    renderModal();

    await user.type(screen.getByLabelText("Description"), "Coffee");
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "0.10" } });
    await user.click(screen.getByRole("button", { name: "Exact" }));
    fireEvent.change(screen.getByLabelText("Alice split value"), { target: { value: "0.03" } });
    fireEvent.change(screen.getByLabelText("Bob split value"), { target: { value: "0.07" } });

    expect(screen.getByRole("button", { name: "Add expense" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() => expect(expenseApi.create).toHaveBeenCalledWith(7, {
      description: "Coffee",
      amount: "0.10",
      paidByUserId: 1,
      splitType: "EXACT",
      category: "OTHER",
      splits: [
        { userId: 1, value: "0.03" },
        { userId: 2, value: "0.07" },
      ],
    }, "request-key"));
  });

  it("rejects amounts with more than two fractional digits in the browser", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Description"), "Invalid precision");
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "1.234" } });

    expect(screen.getByRole("button", { name: "Add expense" })).toBeDisabled();
    expect(expenseApi.create).not.toHaveBeenCalled();
  });
});