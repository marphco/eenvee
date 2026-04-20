/**
 * Piano evento (roadmap: tier «Evento» a pagamento vs free solo in fase lancio).
 * Valore persistito: `free` | `paid`. `premium` è solo legacy pre-migrazione DB.
 */
export function isPaidPlan(plan: string | undefined | null): boolean {
  const p = (plan || "free").toLowerCase();
  return p === "paid" || p === "premium";
}

/** Accetta solo free|paid in input API; mappa legacy premium → paid. */
export function normalizePlanFromClient(plan: unknown): "free" | "paid" | undefined {
  if (plan === undefined || plan === null) return undefined;
  const p = String(plan).toLowerCase();
  if (p === "premium" || p === "paid") return "paid";
  if (p === "free") return "free";
  return undefined;
}
