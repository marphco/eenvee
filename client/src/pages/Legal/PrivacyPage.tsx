import React from "react";
import LegalNoticesLayout from "./LegalNoticesLayout";

const UPDATED = "Versione: aprile 2026";

export default function PrivacyPage() {
  return (
    <LegalNoticesLayout eyebrow="Informativa" title="Privacy Policy" updatedLabel={UPDATED}>
      <p>
        La presente informativa descrive come <strong>eenvee</strong> (di seguito, la
        <strong> Piattaforma</strong> o <strong>noi</strong>) tratta i dati personali degli utenti e degli ospiti
        degli eventi, ai sensi del Regolamento (UE) 2016/679 (GDPR) e della normativa italiana in materia di
        protezione dei dati personali.
      </p>

      <div className="legal-page__box">
        Il <strong>titolare del trattamento</strong> identificativo a fini legittimi va completato in sede
        commerciale (ragione sociale, sede, P.IVA, PEC) e replicato qui e nel footer. Fino a tale adeguamento,
        per ogni richiesta in materia di privacy scrivere a{" "}
        <a href="mailto:privacy@eenvee.com">privacy@eenvee.com</a>.
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
          possiamo ricevere identificativi del pagamento, importi e metadati necessari a erogare il servizio;
        </li>
        <li>
          <strong>Dati di navigazione e sicurezza</strong> (log, indirizzi IP, timestamp, errori) per
          manutenzione, prevenzione abusi e funzionamento del servizio;
        </li>
        <li>
          <strong>Cookie e tecnologie simili</strong> come descritto nella{" "}
          <a href="/cookie">Cookie Policy</a>.
        </li>
      </ul>

      <h2>2. Finalità e basi giuridiche</h2>
      <p>Esempi principali (non elenco esclusivo):</p>
      <ul>
        <li>
          <strong>Erogazione del servizio</strong> (creazione e pubblicazione di inviti, pagina evento, RSVP, invii)
          — base giuridica: <strong>esecuzione del contratto</strong> o misure precontrattuali;
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
          <strong>Consenso</strong> ove obbligatorio (es. marketing non parimenti necessario, cookie non tecnici, se
          e quando introdotti) — ogni trattamento basato su consenso è specifico e revocabile.
        </li>
      </ul>

      <h2>3. Destinatari e responsabili</h2>
      <p>
        I dati possono essere trattati da personale autorizzato e da fornitori che agiscono come{" "}
        <strong>responsabili del trattamento</strong> o sub-responsabili, tra cui, a titolo esemplificativo: hosting,
        servizi di posta, storage (es. cloud object storage per media), e <strong>Stripe</strong> per i pagamenti.
        Alcuni fornitori possono operare in paesi al di fuori dello Spazio Economico Europeo, con garanzie adeguate
        (es. clausole contrattuali standard) ove richiesto.
      </p>

      <h2>4. Conservazione</h2>
      <p>
        Conserviamo i dati per il tempo strettamente necessario alle finalità indicate e agli obblighi di legge.
        I contenuti dell’evento e le RSVP possono essere cancellati o anonimizzati in seguito a richiesta, salvo
        doveri di conservazione (es. documentazione fiscale) o impostazioni tecniche del tuo account.
      </p>

      <h2>5. Diritti dell’interessato</h2>
      <p>
        In qualità di interessato hai diritto di chiedere <strong>accesso, rettifica, cancellazione, limitazione,
        portabilità</strong> ove applicabile, e di opporti a trattamenti basati sull’interesse legittimo. Puoi
        revocare un consenso in qualsiasi momento senza pregiudicare le basi pregresse. Hai diritto di proporre
        reclamo al <strong>Garante per la Protezione dei Dati Personali</strong> (www.gpdp.it).
      </p>

      <h2>6. Minori</h2>
      <p>
        Il servizio non è diretto a minori di 16 anni. Se vengono trattati dati di minori in contesto
        d’evento, la responsabilità del titolare dei dati della manifestazione resta in capo
        all’organizzatore secondo le regole d’invito.
      </p>

      <h2>7. Modifiche</h2>
      <p>
        Potremo aggiornare questa informativa. La data di versione in testa al documento indica l’ultimo
        aggiornamento sostanziale. Continuare a usare la Piattaforma dopo la pubblicazione implica, ove
        applicabile, accettazione delle modifiche in conformità a legge.
      </p>
    </LegalNoticesLayout>
  );
}
