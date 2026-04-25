import React from "react";
import LegalNoticesLayout from "./LegalNoticesLayout";
import { LEGAL, companyFullAddress } from "../../config/legalEntity";

const UPDATED = "Versione: aprile 2026";

export default function PrivacyPage() {
  return (
    <LegalNoticesLayout eyebrow="Informativa" title="Privacy Policy" updatedLabel={UPDATED}>
      <p>
        La presente informativa descrive come trattiamo i dati personali in relazione al marchio e alla
        piattaforma <strong>{LEGAL.brand}</strong> ({LEGAL.publicDomain}), ai sensi del Regolamento (UE) 2016/679
        (<strong>GDPR</strong>: regolamento europeo sulla protezione dei dati personali) e della normativa
        italiana applicabile. Con <strong>noi</strong> o <strong>titolare</strong> si intende{" "}
        {LEGAL.company.legalName}, come indicata più sotto.
      </p>

      <div className="legal-page__box">
        <p style={{ margin: 0, marginBottom: "0.65rem" }}>
          <strong>Titolare del trattamento:</strong> {LEGAL.company.legalName}, con sede legale in{" "}
          {companyFullAddress()} — P.IVA {LEGAL.company.vat} — iscrizione R.E.A. {LEGAL.company.rea} — PEC:{" "}
          <a href={`mailto:${LEGAL.company.pec}`}>{LEGAL.company.pec}</a>.
        </p>
        <p style={{ margin: 0 }}>
          Il marchio <strong>{LEGAL.brand}</strong> è distribuito dal titolare. Per l’esercizio dei diritti
          sotto elencati (artt. 15–22 GDPR) e per ogni domanda:{" "}
          <a href={`mailto:${LEGAL.publicEmail}`}>{LEGAL.publicEmail}</a>.
        </p>
      </div>

      <h2>1. Dati trattati</h2>
      <p>Tra i dati possono essere inclusi, a seconda delle funzioni usate:</p>
      <ul>
        <li>
          <strong>Dati di account</strong> (es. indirizzo email, credenziali in forma cifrata, identificativo
          fornito da Google se accedi con Google);
        </li>
        <li>
          <strong>Contenuti dell’evento</strong> (testi, immagini, impostazioni di invito e pagina pubblica) e
          metadati necessari a salvaguardare l’esperienza d’editor;
        </li>
        <li>
          <strong>Dati di RSVP e ospitalità</strong> (nomi, numero ospiti, eventuali intolleranze, contatti, risposte
          a campi aggiuntivi) inseriti dagli invitati o aggiunti manualmente dall’organizzatore;
        </li>
        <li>
          <strong>Dati di pagamento</strong> relativi all’acquisto del piano o ai regali digitali: i dati
          bancarizzati (PAN completo) sono trattati da <strong>Stripe</strong> quale fornitore autonomo; noi
          possiamo ricevere identificativi del pagamento, importi e metadati necessari a erogare il servizio
          (in ambiente di test o di produzione, secondo l’avanzamento del servizio);
        </li>
        <li>
          <strong>Invio email</strong> transazionali: le comunicazioni necessarie (es. conferme) possono transitare
          attraverso l’infrastruttura di posta messa a disposizione dal titolare, senza terzo fornitore esterno
          ove così organizzata;
        </li>
        <li>
          <strong>Dati di navigazione e sicurezza</strong> (log, indirizzi IP, timestamp, errori) per
          manutenzione, prevenzione abusi e funzionamento del servizio;
        </li>
        <li>
          <strong>Cookie e tecnologie simili</strong> come descritto nella <a href="/cookie">Cookie Policy</a>
          (includendo eventuali strumenti di analytics se e quando abilitati, con le modalità rese note lì e nel
          banner informativo).
        </li>
      </ul>

      <h2>2. Finalità e basi giuridiche</h2>
      <p>Esempi principali (non elenco esclusivo):</p>
      <ul>
        <li>
          <strong>Erogazione del servizio</strong> (creazione e pubblicazione di inviti, pagina evento, RSVP, invii)
          — <strong>esecuzione del contratto</strong> o misure precontrattuali;
        </li>
        <li>
          <strong>Adempimenti fiscali e contabili</strong> ove applicabili — <strong>obbligo legale</strong>;
        </li>
        <li>
          <strong>Sicurezza, debug e prevenzione frodi</strong> — <strong>interesse legittimo</strong>, nel
          rispetto dei diritti e delle aspettative dell’utente;
        </li>
        <li>
          <strong>Comunicazioni su aggiornamenti importanti o informative sul prodotto</strong>, ove consentito —
          in conformità a preferenze e normativa;
        </li>
        <li>
          <strong>Consenso</strong> ove obbligatorio (es. strumenti analitici non strettamente necessari, ove
          introdotti; marketing) — revocabile in ogni momento.
        </li>
      </ul>

      <h2>3. Destinatari, hosting e fornitori</h2>
      <p>
        I dati possono essere trattati da personale autorizzato e da fornitori che trattano dati in qualità di{" "}
        <strong>responsabili</strong> o <strong>sub-responsabili</strong>, a seconda dei casi, tra cui (stato
        all’informativa): <strong>Cloudflare, Inc.</strong> (rete, DNS, protezioni, storage a oggetti “R2” o
        servizi connessi); <strong>Railway</strong> o equivalente (hosting del backend e database); <strong>Vercel</strong>{" "}
        o equivalente (erogazione del front-end e distribuzione). I pagamenti sono gestiti da{" "}
        <strong>Stripe</strong> secondo le sue informative. L’accesso con <strong>Google</strong> è soggetto
        all’informativa Google. Alcuni fornitori operano al di fuori dello Spazio Economico Europeo: in tali casi
        adottiamo o richiediamo idonee garanzie (es. clausole standard CE), ove applicabile.
      </p>

      <h2>4. Trasferimenti extra-UE e ambito</h2>
      <p>
        Il servizio è pensato in primo luogo per utenti in <strong>Italia</strong> e, più in generale, nello
        Spazio Economico Europeo, con prospettiva di respiro internazionale. Ove i dati transitino o siano
        conservati in paesi terzi, ciò avviene nelle forme e con le tutele previste dalla legge.
      </p>

      <h2>5. Conservazione</h2>
      <p>
        Conserviamo i dati per il tempo strettamente necessario alle finalità indicate e agli obblighi di legge.
        I contenuti dell’evento e le RSVP possono essere oggetto di richiesta di cancellazione o
        anonimizzazione, salvo doveri di conservazione (es. fatturazione) o impostazioni tecniche del tuo account.
      </p>

      <h2>6. Diritti dell’interessato</h2>
      <p>
        Puoi chiedere <strong>accesso, rettifica, cancellazione, limitazione, portabilità</strong> ove
        applicabile, opporti a trattamenti basati sull’interesse legittimo, revocare i consensi ove usati, e
        proporre <strong>reclamo al Garante</strong> (www.gpdp.it). L’esercizio è gratuito salvo eccessi o
        infondatezza, nelle forme di legge. Indirizzo: <a href={`mailto:${LEGAL.publicEmail}`}>{LEGAL.publicEmail}</a>.
      </p>

      <h2>7. Minori</h2>
      <p>
        Il servizio non è diretto a minori di 16 anni. Dati inseriti in contesto d’evento restano a carico
        dell’organizzatore per quanto previsto dalle regole d’invito.
      </p>

      <h2>8. Modifiche</h2>
      <p>
        Potremo aggiornare questa informativa. La dicitura in cima al documento indica l’ultima revisione
        sostanziale. L’uso continuato del servizio dopo l’aggiornamento, ove le modifiche siano sostanziali e
        consentibili, seguirà le regole applicabili in materia di trasparenza.
      </p>
    </LegalNoticesLayout>
  );
}
