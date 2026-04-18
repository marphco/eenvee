# eenvee

Portale all-in-one per inviti a eventi digitali (matrimoni, compleanni, beneficenza, …). Ogni evento ha una pagina pubblica personalizzabile con editor visuale, RSVP, galleria foto, video, mappa e — dalla Fase 1 — **Busta Digitale**: regali in denaro via Stripe Connect con commissione di piattaforma.

Stack: React + Vite (client) · Node.js + Express + Mongoose (server) · MongoDB · Cloudflare R2 · Stripe Connect Express + Embedded Components.

---

## Requisiti

- Node.js ≥ 18
- MongoDB locale o Atlas
- (opzionale) account Cloudflare R2 per upload in produzione
- (per Fase 1) account Stripe + Stripe CLI per i webhook in locale

## Quick start

```bash
# 1) Installazione dipendenze (root, client, server)
npm install
npm --prefix client install
npm --prefix server install

# 2) Configurazione env
cp server/.env.example server/.env
cp client/.env.example client/.env
# apri i due file e compila i valori (MongoDB, JWT, Stripe, …)

# 3) Avvio in locale (client + server in parallelo)
npm run dev
# client: http://localhost:5173
# server: http://localhost:4000
```

---

## Configurazione Stripe (Busta Digitale)

La Busta Digitale usa **Stripe Connect Express** con **Embedded Components**: gli host fanno onboarding senza lasciare eenvee e i pagamenti dei guest vengono inoltrati all'host trattenendo la commissione di piattaforma (default 3% + 0,50 €).

### 1. Creare l'account Stripe

1. Registrati su [https://dashboard.stripe.com](https://dashboard.stripe.com) (va bene anche un account personale per i test).
2. Assicurati di essere in **modalità Test** (toggle in alto a destra).
3. Vai su **Settings → Connect → Get started** e abilita Connect per la piattaforma (verrà chiesto un nome business — per ora basta quello di test).
4. In **Settings → Connect → Platform settings**:
   - imposta il tipo di account predefinito su **Express**;
   - controlla che i paesi supportati includano **Italia** (e gli altri Paesi UE se vuoi testare guest esteri).

### 2. Copiare le chiavi

1. **Developers → API keys**:
   - `Publishable key` → va in `VITE_STRIPE_PUBLISHABLE_KEY` (`client/.env`) e in `STRIPE_PUBLISHABLE_KEY` (`server/.env`);
   - `Secret key` → va in `STRIPE_SECRET_KEY` (`server/.env`).
2. **Non usare mai chiavi live in sviluppo.**

### 3. Webhook in locale con Stripe CLI

Il server verifica la firma dei webhook con `STRIPE_WEBHOOK_SECRET`. In locale lo otteniamo dalla Stripe CLI.

```bash
# Installazione (macOS con Homebrew)
brew install stripe/stripe-cli/stripe

# Login (apre il browser)
stripe login

# Forward dei webhook verso il server locale
stripe listen --forward-to http://localhost:4000/api/stripe/webhooks
```

Il comando stampa una riga tipo `> Ready! Your webhook signing secret is whsec_abc123...`: copia questo valore in `STRIPE_WEBHOOK_SECRET` nel file `server/.env` e riavvia il server.

Tieni il comando `stripe listen` attivo in un terminale separato durante i test.

### 4. Commissione di piattaforma

Default: `STRIPE_PLATFORM_FEE_PERCENT=3` + `STRIPE_PLATFORM_FEE_FIXED_CENTS=50` → **3% + 0,50 €** per ogni donazione, trattenuta automaticamente via `application_fee_amount` sul `PaymentIntent`. Modifica i due valori in `server/.env` solo se cambia la strategia di pricing.

---

## Checklist test end-to-end (modalità test)

Carte di prova utili ([riferimento Stripe](https://docs.stripe.com/testing)):

| Scenario             | Numero carta          | Note                       |
| -------------------- | --------------------- | -------------------------- |
| Pagamento OK         | `4242 4242 4242 4242` | qualsiasi CVC, data futura |
| 3D Secure richiesto  | `4000 0025 0000 3155` | sfida OTP in test          |
| Pagamento rifiutato  | `4000 0000 0000 0002` | `card_declined`            |
| Fondi insufficienti  | `4000 0000 0000 9995` | `insufficient_funds`       |

### Scenari da coprire

- [ ] **Onboarding host (Embedded Components)**
  - [ ] Apri l'editor di un evento → sidebar → aggiungi "Sezione Regali".
  - [ ] Nel pannello laterale clicca "Attiva Busta Digitale" → dialog embedded Stripe.
  - [ ] Completa con dati di test ([guida Stripe](https://docs.stripe.com/connect/testing) — usa BIC/IBAN fake di test).
  - [ ] Verifica che dopo la chiusura del dialog la sidebar mostri "Regali attivi".
  - [ ] Verifica che il webhook `account.updated` aggiorni `chargesEnabled/payoutsEnabled` in `StripeAccount`.
- [ ] **Donazione guest (carta standard)**
  - [ ] Apri pagina pubblica dell'evento → clicca "Fai un regalo" sul widget.
  - [ ] Modal: scegli importo preset (es. 50 €) → inserisci nome + email → prosegui.
  - [ ] Paga con `4242 4242 4242 4242` → success screen.
  - [ ] Controlla che arrivi la ricevuta al donatore (`sendDonorReceipt`).
  - [ ] Controlla che l'host riceva notifica con netto = 50 € − 3% − 0,50 € = **47,00 €** (`sendHostNotification`).
  - [ ] Dashboard `/events/:slug/donations` mostra la donazione in stato "Completato".
- [ ] **Donazione con 3D Secure**
  - [ ] Ripeti il flusso con `4000 0027 6000 3184` → superamento sfida OTP → success.
- [ ] **Donazione rifiutata**
  - [ ] Ripeti con `4000 0000 0000 0002` → messaggio di errore nel modal, nessuna email, donazione in stato `failed`.
- [ ] **Refund**
  - [ ] Da Stripe CLI: `stripe trigger charge.refunded` (o rimborsa manualmente da dashboard) → la donazione passa a `refunded` in dashboard host.
- [ ] **Dispute**
  - [ ] Da Stripe CLI: `stripe trigger charge.dispute.created` → la donazione passa a `disputed`, con banner nella dashboard host.
- [ ] **Idempotency webhook**
  - [ ] Ri-inviare lo stesso evento dallo `stripe listen` non deve duplicare record (`StripeWebhookEvent` ha `eventId` unique).
- [ ] **Validazioni server-side**
  - [ ] POST `/api/donations/create-intent` con amount < minAmount → 400.
  - [ ] POST con amount > maxAmount → 400.
  - [ ] POST senza email/nome → 400.
  - [ ] Rate limit: 10 POST rapidi dallo stesso IP → 429.
- [ ] **Export CSV dashboard host**
  - [ ] `/events/:slug/donations` → pulsante "Esporta CSV" → il file include tutte le colonne chiave.

Se qualcosa fallisce mandami log server + risposta API + screenshot e sistemiamo.

---

## Comandi utili

```bash
# Avvio separato
npm run dev:client
npm run dev:server

# Tipcheck client
npm --prefix client run build

# Stripe CLI — eventi comuni per i test
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
stripe trigger charge.dispute.created
```

---

## Struttura del progetto (essenziale)

```
eenvee/
├── client/                      # React + Vite
│   └── src/
│       ├── pages/
│       │   ├── Editor/          # editor visuale (desktop + mobile)
│       │   ├── PublicView/      # pagina pubblica evento
│       │   ├── Donations/       # dashboard host (EventDonations)
│       │   └── Legal/           # informative (TOS, Privacy, Digital Gifts)
│       └── components/
└── server/
    ├── config/env.ts            # validazione env, `stripeConfig`
    ├── models/                  # Event, StripeAccount, Donation, StripeWebhookEvent, …
    ├── routes/
    │   ├── stripeConnectRoutes.ts
    │   ├── donationRoutes.ts
    │   ├── stripeWebhookRoutes.ts   # montato PRIMA di express.json con raw body
    │   └── subscriptionRoutes.ts
    └── utils/
        ├── stripeClient.ts      # `getStripe()`, `calculateApplicationFee()`
        └── donationEmails.ts    # ricevuta donatore + notifica host
```

---

## Roadmap

Vedi [`ROADMAP.md`](./ROADMAP.md) per lo stato dettagliato delle fasi. Fase 1 (Busta Digitale) è implementata e in attesa di test end-to-end con credenziali Stripe reali.
