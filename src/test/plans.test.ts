import { describe, expect, it } from "vitest";
import { canUse, checkProCode, orderTypeAllowedByPlan, planLabel } from "@/lib/plans";

describe("Basic vs Pro", () => {
  it("Basic cannot use branding (logo, colors, background)", () => {
    expect(canUse("basic", "branding")).toBe(false);
  });
  it("Basic cannot edit customer pages", () => {
    expect(canUse("basic", "pages")).toBe(false);
  });
  it("Basic can edit the menu and receive orders", () => {
    expect(canUse("basic", "menu")).toBe(true);
    expect(canUse("basic", "orders")).toBe(true);
    expect(canUse("basic", "customer")).toBe(true);
  });
  it("Pro can use branding and pages", () => {
    expect(canUse("pro", "branding")).toBe(true);
    expect(canUse("pro", "pages")).toBe(true);
  });
  it("Basic allows every order type", () => {
    for (const t of ["table", "pickup", "delivery", "staff"] as const) {
      expect(orderTypeAllowedByPlan("basic", t)).toBe(true);
    }
  });
  it("labels free as Basic and paid as Pro", () => {
    expect(planLabel("basic")).toBe("Basic");
    expect(planLabel("pro")).toBe("Pro");
  });
});

describe("Pro code", () => {
  const code = "09730973David!";
  it("accepts the exact code including the exclamation mark", () => {
    expect(checkProCode("09730973David!", code)).toBe(true);
  });
  it("ignores surrounding spaces", () => {
    expect(checkProCode("  09730973David!  ", code)).toBe(true);
  });
  it("rejects the code without the exclamation mark", () => {
    expect(checkProCode("09730973David", code)).toBe(false);
  });
  it("is case sensitive", () => {
    expect(checkProCode("09730973david!", code)).toBe(false);
  });
  it("rejects everything when no code is configured", () => {
    expect(checkProCode("09730973David!", undefined)).toBe(false);
  });
});
