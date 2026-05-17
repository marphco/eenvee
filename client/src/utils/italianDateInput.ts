/** Input testuale gg/mm/aaaa ↔ ISO yyyy-mm-dd per form senza dipendere dal locale del date picker nativo. */

export function isoToItalianDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/** Solo cifre, max 8; inserisce `/` dopo gg e mm mentre si digita (gg/mm/aaaa).
 *  Clamp soft as-you-type:
 *    - giorno: ≤ 31 (es. "45" → "31")
 *    - mese: ≤ 12 (es. "13" → "12")
 *  La validazione COMPLETA (febbraio bisestile, 30/04, ecc.) avviene a
 *  `italianDisplayToIso` via `new Date()` overflow check — qui solo i cap
 *  ovvi che non dipendono dall'anno.
 */
export function formatItalianDateAsYouType(raw: string): string {
  let digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length >= 2) {
    const dd = parseInt(digits.slice(0, 2), 10);
    if (dd > 31) digits = "31" + digits.slice(2);
  }
  if (digits.length >= 4) {
    const mm = parseInt(digits.slice(2, 4), 10);
    if (mm > 12) digits = digits.slice(0, 2) + "12" + digits.slice(4);
  }
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** True se `display` è una stringa gg/mm/aaaa che si risolve a una data reale
 *  (es. 29/02/2023 → false perché non bisestile; 29/02/2024 → true).
 *  Stringhe parziali (es. "12/05/") ritornano false: l'utente sta ancora digitando. */
export function isValidItalianDate(display: string): boolean {
  return italianDisplayToIso(display) !== null;
}

/** True se l'utente ha completato la digitazione (gg/mm/aaaa = 10 caratteri). */
export function isCompleteItalianDate(display: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(display.trim());
}

export function italianDisplayToIso(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 2100) return null;
  const dt = new Date(yyyy, mm - 1, dd);
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}
