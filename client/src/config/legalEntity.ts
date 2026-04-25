/**
 * Dati anagrafici e contatti ufficiali (Basic ADV) — usati in pagine legali.
 * Unico posto da aggiornare se cambia sede, P.IVA o canali.
 */
export const LEGAL = {
  brand: "eenvee",
  publicDomain: "https://eenvee.com",
  /** Contatto unico lato prodotto e privacy, come da indicazione titolare */
  publicEmail: "info@eenvee.com",
  company: {
    legalName: "Basic ADV S.r.l.s.",
    vat: "09456771212",
    rea: "NA-1033272",
    addressLine: "Via Enrico Pessina, 13",
    zipCityProvince: "80046 San Giorgio a Cremano (NA)",
    pec: "pec@pec.basicadv.com",
  },
} as const;

export function companyFullAddress(): string {
  return `${LEGAL.company.addressLine} — ${LEGAL.company.zipCityProvince}`;
}
