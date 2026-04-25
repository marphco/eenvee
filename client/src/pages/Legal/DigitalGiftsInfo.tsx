import React from "react";
import { useNavigate } from "react-router-dom";
import { Surface, Button } from "../../ui";
import {
  ShieldCheck,
  Gift,
  CreditCard,
  Wallet,
  Lock,
  Receipt,
  AlertTriangle,
  Globe2,
} from "lucide-react";

/**
 * Pagina informativa pubblica sul funzionamento dei Regali Digitali.
 * Copre: funzionamento end-to-end, commissioni, sicurezza, privacy, ruolo
 * di Stripe come processor e riferimenti a TOS/Privacy. Rende la feature
 * auto-esplicativa sia per gli host che per gli invitati che pagano.
 */
export default function DigitalGiftsInfo() {
  const navigate = useNavigate();

  const sectionStyle: React.CSSProperties = {
    padding: "2rem",
    marginBottom: "1.5rem",
  };

  const h2Style: React.CSSProperties = {
    margin: "0 0 1rem",
    fontFamily: "var(--font-display, serif)",
    fontSize: "1.6rem",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  };

  const pStyle: React.CSSProperties = {
    margin: "0.6rem 0",
    lineHeight: 1.6,
    color: "var(--text, #1a1a1a)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #f4f1ec)",
        padding: "2.5rem 1.25rem 5rem",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Indietro
        </Button>

        <header style={{ marginBottom: "1rem" }}>
          <p
            style={{
              margin: 0,
              color: "var(--accent, #3c4f76)",
              fontWeight: 800,
              letterSpacing: "0.25em",
              fontSize: "0.72rem",
            }}
          >
            REGALI DIGITALI
          </p>
          <h1
            style={{
              margin: "0.4rem 0 0.6rem",
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              lineHeight: 1.1,
            }}
          >
            Come funzionano i regali digitali su eenvee
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--text-muted, #6b6b6b)",
              lineHeight: 1.5,
              fontSize: "1.02rem",
              maxWidth: 640,
            }}
          >
            Una guida chiara per chi organizza l'evento e per chi vuole fare un regalo
            in denaro in tutta sicurezza, senza uscire da eenvee.
          </p>
        </header>

        <Surface variant="glass" style={sectionStyle}>
          <h2 style={h2Style}>
            <Gift size={22} /> Per gli invitati
          </h2>
          <p style={pStyle}>
            Quando sul sito dell'evento compare il blocco "Regali Digitali", puoi fare
            un regalo in denaro direttamente dalla pagina. Scegli un importo suggerito
            o inserisci il tuo, lasci un messaggio e paghi con carta in modo sicuro
            tramite Stripe.
          </p>
          <p style={pStyle}>
            Al termine del pagamento ricevi una ricevuta via email con i dettagli del
            regalo. Gli organizzatori vengono avvisati automaticamente del nuovo regalo
            ricevuto.
          </p>
        </Surface>

        <Surface variant="glass" style={sectionStyle}>
          <h2 style={h2Style}>
            <Wallet size={22} /> Per gli organizzatori
          </h2>
          <p style={pStyle}>
            Per attivare i regali digitali devi collegare un conto di pagamento tramite
            Stripe. L'attivazione avviene direttamente in eenvee con un breve onboarding
            guidato: inserisci i tuoi dati, collega il tuo IBAN e in pochi minuti sei
            pronto a ricevere.
          </p>
          <p style={pStyle}>
            I regali ricevuti vengono accreditati automaticamente sul tuo conto, con
            cadenza periodica decisa da Stripe. Dalla dashboard di eenvee puoi vedere
            tutti i regali ricevuti, scaricare il riepilogo in CSV, gestire rimborsi e
            rispondere ad eventuali contestazioni.
          </p>
        </Surface>

        <Surface variant="glass" style={sectionStyle}>
          <h2 style={h2Style}>
            <Receipt size={22} /> Commissioni trasparenti
          </h2>
          <p style={pStyle}>
            Su ogni regalo ricevuto, eenvee trattiene una commissione del{" "}
            <strong>3% + 0,50&nbsp;€</strong>. Questa commissione copre i costi di
            elaborazione del pagamento (Stripe), l'infrastruttura sicura e il
            mantenimento del servizio.
          </p>
          <p style={pStyle}>
            Esempio: per un regalo di 100&nbsp;€, 3,50&nbsp;€ vengono trattenuti come
            commissione e <strong>96,50&nbsp;€</strong> vengono accreditati sul tuo
            conto. Nessun costo fisso mensile, nessun costo di attivazione.
          </p>
        </Surface>

        <Surface variant="glass" style={sectionStyle}>
          <h2 style={h2Style}>
            <ShieldCheck size={22} /> Sicurezza e protezione dei pagamenti
          </h2>
          <p style={pStyle}>
            I pagamenti sono processati da <strong>Stripe</strong>, leader mondiale nei
            pagamenti digitali e certificato <strong>PCI DSS Level 1</strong>. I dati
            della carta non transitano mai sui server di eenvee: vengono trasmessi in
            forma cifrata direttamente a Stripe.
          </p>
          <p style={pStyle}>
            Tutti i pagamenti supportano l'autenticazione 3D Secure (SCA) richiesta
            dalla normativa europea PSD2, garantendo un ulteriore livello di sicurezza
            per l'invitato che paga.
          </p>
        </Surface>

        <Surface variant="glass" style={sectionStyle}>
          <h2 style={h2Style}>
            <Globe2 size={22} /> Pagamenti internazionali
          </h2>
          <p style={pStyle}>
            Gli invitati possono fare un regalo da qualsiasi Paese supportato da Stripe:
            basta una carta di credito o di debito. La conversione valutaria è gestita
            automaticamente da Stripe secondo il tasso di cambio del momento. Gli
            organizzatori ricevono i fondi nella loro valuta di conto.
          </p>
        </Surface>

        <Surface variant="glass" style={sectionStyle}>
          <h2 style={h2Style}>
            <Lock size={22} /> Privacy dei donatori
          </h2>
          <p style={pStyle}>
            eenvee non pubblica mai una lista pubblica con nomi e importi dei regali
            ricevuti: solo l'organizzatore dell'evento vede chi ha regalato e quanto,
            direttamente nella propria dashboard. Gli altri invitati non hanno accesso
            a queste informazioni.
          </p>
          <p style={pStyle}>
            I dati dell'invitato (nome, email, messaggio) vengono conservati per finalità
            di ricevuta, antifrode e obblighi di legge sui pagamenti. Per i dettagli
            completi consulta la nostra <a href="/privacy">Privacy Policy</a>.
          </p>
        </Surface>

        <Surface variant="glass" style={sectionStyle}>
          <h2 style={h2Style}>
            <CreditCard size={22} /> Rimborsi e contestazioni
          </h2>
          <p style={pStyle}>
            Se necessario, l'organizzatore può rimborsare un regalo ricevuto direttamente
            dalla dashboard entro i termini previsti da Stripe (di norma 180 giorni).
            Le commissioni trattenute da eenvee non vengono rimborsate sui singoli
            rimborsi parziali.
          </p>
          <p style={pStyle}>
            In caso di contestazione da parte del donatore (es. chargeback della carta),
            l'organizzatore riceve una notifica e può caricare documentazione a supporto
            tramite la vista Stripe integrata.
          </p>
        </Surface>

        <Surface variant="glass" style={{ ...sectionStyle, display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>
          <AlertTriangle size={22} color="var(--accent, #3c4f76)" />
          <div>
            <strong style={{ display: "block", marginBottom: "0.3rem" }}>
              Ruolo di eenvee e condizioni applicabili
            </strong>
            <p style={{ ...pStyle, margin: 0, fontSize: "0.92rem" }}>
              eenvee agisce come piattaforma tecnologica: fornisce gli strumenti per
              ricevere regali digitali, ma il rapporto di pagamento si instaura tra
              l'invitato (che paga), l'organizzatore (che riceve) e Stripe (che processa).
              L'utilizzo dei regali digitali è soggetto ai nostri{" "}
              <a href="/termini">Termini di servizio</a>, alla{" "}
              <a href="/privacy">Privacy Policy</a> di eenvee e ai{" "}
              <a
                href="https://stripe.com/it/legal/connect-account"
                target="_blank"
                rel="noopener noreferrer"
              >
                Termini di Servizio Stripe Connect
              </a>
              .
            </p>
          </div>
        </Surface>
      </div>
    </div>
  );
}
