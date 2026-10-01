import { describe, expect, it } from "vitest";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "./expenseCategories";

describe("expense categories", () => {
  it("has unique category values and a display label for every option", () => {
    const values = EXPENSE_CATEGORIES.map(({ value }) => value);

    expect(new Set(values).size).toBe(values.length);
    expect(values).toContain("OTHER");
    expect(Object.keys(EXPENSE_CATEGORY_LABELS)).toHaveLength(values.length);
    expect(EXPENSE_CATEGORY_LABELS.FOOD).toBe("Food");
  });
});