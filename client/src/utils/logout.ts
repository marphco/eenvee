import { apiFetch } from "./apiFetch";

/**
 * Esegue il logout server-side (cookie cleared) e ritorna a `redirectTo`
 * (default home). Il cookie JWT è `httpOnly` quindi non possiamo cancellarlo
 * lato client — l'endpoint server `/api/auth/logout` è l'unica via.
 *
 * Se la chiamata fallisce continuiamo comunque col redirect: l'utente vuole
 * uscire, meglio una sessione che resta valida lato server (scadrà sola)
 * che un blocco UX.
 */
export async function performLogout(redirectTo: string = "/"): Promise<void> {
  try {
    await apiFetch(`/api/auth/logout`, { method: "POST" });
  } catch (err) {
    // Non blocchiamo: log e prosegui col redirect.
    console.warn("Logout request failed, proceeding with client-side redirect:", err);
  }
  // Hard reload del path per resettare qualsiasi state in memoria
  // (useMarketingSession, contexts vari) — più affidabile di un navigate().
  window.location.assign(redirectTo);
}
