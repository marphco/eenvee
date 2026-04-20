export type InvoiceKind = "private" | "professional" | "company";

function norm(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function up(s: string): string {
  return s.replace(/\s/g, "").toUpperCase();
}

/** CF persona italiana (16 alfanumerici) — solo formato, niente checksum (omocodia / edge case). */
export function isPersonCodiceFiscale(s: string): boolean {
  const x = up(s);
  return x.length === 16 && /^[A-Z0-9]{16}$/.test(x);
}

/** CF azienda (11 cifre) — solo formato. */
export function isCompanyCodiceFiscale(s: string): boolean {
  return /^\d{11}$/.test(up(s));
}

/** P.IVA italiana 11 cifre (opz. prefisso IT). */
export function normalizePartitaIva(raw: string): string {
  const x = up(raw);
  if (/^IT\d{11}$/.test(x)) return x.slice(2);
  if (/^\d{11}$/.test(x)) return x;
  return "";
}

/** Codice SDI / destinatario: 7 caratteri alfanumerici. */
export function isValidSdi(s: string): boolean {
  const x = up(s);
  return x.length === 7 && /^[A-Z0-9]{7}$/.test(x);
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InvoiceValidationResult = { ok: true; metadata: Record<string, string> } | { ok: false; message: string };

const SDI_DEFAULT_PRIVATE = "0000000";

/**
 * Valida i dati fattura dal body `create-unlock-intent` e produce metadata Stripe (chiavi `inv_*`).
 */
export function validateInvoiceForIntent(body: Record<string, unknown>): InvoiceValidationResult {
  if (!body.invoiceRequested) return { ok: true, metadata: {} };

  const kind = norm(body.invoiceKind, 20).toLowerCase() as InvoiceKind;
  if (kind !== "private" && kind !== "professional" && kind !== "company") {
    return { ok: false, message: "Seleziona il tipo di intestatario per la fattura" };
  }

  const denomination = norm(body.invoiceDenomination, 120);
  const street = norm(body.invoiceStreet, 100);
  const cap = norm(body.invoiceCap, 5);
  const city = norm(body.invoiceCity, 80);
  const province = up(norm(body.invoiceProvince, 2)).slice(0, 2);
  const pec = norm(body.invoicePec, 200).toLowerCase();

  if (!denomination) return { ok: false, message: "Indica l'intestazione per la fattura" };
  if (!street || !cap || !city || province.length !== 2) {
    return { ok: false, message: "Completa indirizzo: via, CAP, città e provincia" };
  }
  if (!/^\d{5}$/.test(cap)) return { ok: false, message: "CAP non valido" };

  const baseMeta: Record<string, string> = {
    invoice_requested: "true",
    inv_kind: kind,
    inv_den: denomination,
    inv_street: street,
    inv_cap: cap,
    inv_city: city,
    inv_prov: province,
  };

  /** Persona fisica: SDI standard + PEC facoltativa. */
  if (kind === "private") {
    if (pec && !emailRe.test(pec)) return { ok: false, message: "PEC non valida" };
    const cf = up(norm(body.invoiceCfPerson, 20));
    if (!isPersonCodiceFiscale(cf)) return { ok: false, message: "Codice fiscale non valido" };
    return {
      ok: true,
      metadata: {
        ...baseMeta,
        inv_sdi: SDI_DEFAULT_PRIVATE,
        ...(pec ? { inv_pec: pec } : {}),
        inv_cf16: cf,
      },
    };
  }

  const sdiRaw = norm(body.invoiceSdi, 10);
  const sdi = sdiRaw ? up(sdiRaw) : "";
  if (pec && !emailRe.test(pec)) return { ok: false, message: "PEC non valida" };
  if (sdi && !isValidSdi(sdi)) return { ok: false, message: "Codice SDI non valido" };
  if (!sdi && !pec) {
    return { ok: false, message: "Inserisci il codice SDI oppure una PEC per il recapito della fattura" };
  }

  const meta: Record<string, string> = {
    ...baseMeta,
    ...(sdi ? { inv_sdi: sdi } : {}),
    ...(pec ? { inv_pec: pec } : {}),
  };

  if (kind === "professional") {
    const piva = normalizePartitaIva(norm(body.invoiceVat, 20));
    const cf = up(norm(body.invoiceCfPerson, 20));
    if (!piva) return { ok: false, message: "Partita IVA non valida" };
    if (!isPersonCodiceFiscale(cf)) {
      return { ok: false, message: "Codice fiscale della persona non valido" };
    }
    return { ok: true, metadata: { ...meta, inv_piva: piva, inv_cf16: cf } };
  }

  const piva = normalizePartitaIva(norm(body.invoiceVat, 20));
  const cf11 = up(norm(body.invoiceCfCompany, 20));
  if (!piva) return { ok: false, message: "Partita IVA non valida" };
  if (!isCompanyCodiceFiscale(cf11)) {
    return { ok: false, message: "Codice fiscale società non valido" };
  }
  return { ok: true, metadata: { ...meta, inv_piva: piva, inv_cf11: cf11 } };
}
