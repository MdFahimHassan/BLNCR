import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BalancesTab from "./BalancesTab";

vi.mock("./Avatar", () => ({ default: ({ name }) => <span>{name}</span> }));

describe("BalancesTab", () => {
  it("renders signed balances and settlement suggestions", () => {
    render(
      <BalancesTab
        currentUserId={1}
        currency="USD"
        onOpenSettle={vi.fn()}
        data={{
          balances: [
            { userId: 1, name: "Alice", netBalance: "12.50" },
            { userId: 2, name: "Bob", netBalance: "-12.50" },
          ],
          suggestedSettlements: [{
            fromUserId: 2,
            fromName: "Bob",
            toUserId: 1,
            toName: "Alice",
            amount: "12.50",
          }],
        }}
      />,
    );

    expect(screen.getByText("+$12.50")).toBeInTheDocument();
    expect(screen.getByText("-$12.50")).toBeInTheDocument();
    expect(screen.getByText("owes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settle" })).toBeInTheDocument();
  });

  it("shows the designed settled-up empty state", () => {
    render(
      <BalancesTab
        currentUserId={1}
        currency="USD"
        onOpenSettle={vi.fn()}
        data={{
          balances: [{ userId: 1, name: "Alice", netBalance: "0.00" }],
          suggestedSettlements: [],
        }}
      />,
    );

    expect(screen.getByText("Everyone's settled up")).toBeInTheDocument();
  });
});