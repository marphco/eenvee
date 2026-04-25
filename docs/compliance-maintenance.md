# Manutenzione compliance (analytics, script terze parti)

Quando aggiungi o modifichi **analytics**, **pixel**, **widget di supporto** o qualsiasi **script di tracciamento** lato client:

1. **`client/src/pages/Legal/CookiePage.tsx`** — Categorie cookie: indicare se sono analitici/marketing, base legale (consenso o interesse legittimo a seconda dello strumento), riferimenti a documentazione fornitore.
2. **`client/src/pages/Legal/PrivacyPage.tsx`** — Dati trattati, finalità, destinatari (anche extra-UE e garanzie), conservazione, link opt-out ove previsto.
3. **`client/src/components/legal/CookieBanner.tsx` / `.css`** — Se il consenso deve essere acquisito **prima** del caricamento (es. strumenti non strettamente necessari), allineare testo, pulsanti (es. Rifiuta / Accetta) e `localStorage` o CMP come da policy scelta.
4. **Subprocessor / DPA** — Se usi fornitori (Stripe, host, R2, ecc. già citati in Privacy), aggiungere i nuovi alla lista o alla tabella informativa.
5. **`ROADMAP.md`** — Voce breve in **Storico** con data e cosa è stato attivato.

> Non costituisce consulenza legale: in dubbio chiedi verifica a un professionista. La regola `.cursor/rules/compliance-analytics.mdc` richiede a chi modifica il codice di non dimenticare questi passaggi.
