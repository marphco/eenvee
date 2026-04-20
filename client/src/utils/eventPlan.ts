/** Allineato al server: `paid` = piano Evento (49 €); `premium` solo legacy DB. */
export function isPaidPlan(plan: string | undefined | null): boolean {
  const p = (plan || "free").toLowerCase();
  return p === "paid" || p === "premium";
}
