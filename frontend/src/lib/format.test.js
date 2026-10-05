import { describe, expect, it } from "vitest";
import {
  avatarHue,
  currencySymbol,
  formatDate,
  formatDateTime,
  formatMoney,
  formatSignedMoney,
  initials,
} from "./format";

describe("money formatting", () => {
  it("formats amounts with the requested currency and two decimals", () => {
    expect(formatMoney("12.5", "USD")).toBe("$12.50");
    expect(currencySymbol("BDT")).toBe("৳");
  });

  it("formats absolute and signed amounts distinctly", () => {
    expect(formatMoney(-4, "USD")).toBe("$4.00");
    expect(formatSignedMoney(4, "USD")).toBe("+$4.00");
    expect(formatSignedMoney(-4, "USD")).toBe("-$4.00");
    expect(formatSignedMoney(0, "USD")).toBe("$0.00");
  });
});

describe("date and avatar formatting", () => {
  it("returns an empty label for absent dates", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDateTime(undefined)).toBe("");
  });

  it("formats valid calendar dates", () => {
    const date = new Date(2024, 0, 2, 12).toISOString();
    expect(formatDate(date)).toContain("2024");
    expect(formatDateTime(date)).toContain("Jan");
  });

  it("uses initials and stable avatar hues", () => {
    expect(initials("Dev Fahim")).toBe("DF");
    expect(initials("  single  ")).toBe("S");
    expect(initials("")).toBe("?");
    expect(avatarHue(42)).toBe((42 * 47) % 360);
    expect(avatarHue("BLNCR")).toBe(5 * 47 % 360);
  });
});