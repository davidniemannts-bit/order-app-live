export type Plan = "basic" | "pro";

/** Features that need the Pro plan. Everything else is available in Basic. */
export const PRO_FEATURES = ["branding", "pages"] as const;
export type ProFeature = (typeof PRO_FEATURES)[number];

/** Features open to every plan. */
export const BASIC_FEATURES = ["orders", "menu", "customer", "settings", "staff"] as const;
export type BasicFeature = (typeof BASIC_FEATURES)[number];

export type Feature = ProFeature | BasicFeature;

export type OrderType = "table" | "pickup" | "delivery" | "staff";

export function isProFeature(feature: Feature): feature is ProFeature {
  return (PRO_FEATURES as readonly string[]).includes(feature);
}

export function canUse(plan: Plan, feature: Feature): boolean {
  if (plan === "pro") return true;
  return !isProFeature(feature);
}

/** Every plan allows all order types; the restaurant switches them on or off. */
export function orderTypeAllowedByPlan(_plan: Plan, _type: OrderType): boolean {
  return true;
}

export function planLabel(plan: Plan): "Basic" | "Pro" {
  return plan === "pro" ? "Pro" : "Basic";
}

/** Compares an entered code with the configured Pro code without early exit. */
export function checkProCode(input: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = input.trim();
  const b = expected;
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
