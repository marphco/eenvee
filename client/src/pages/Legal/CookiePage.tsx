import React from "react";
import LegalNoticesLayout from "./LegalNoticesLayout";
import { LEGAL } from "../../config/legalEntity";

const UPDATED = "Versione: aprile 2026";

export default function CookiePage() {
  return (
    <LegalNoticesLayout eyebrow="Informativa" title="Cookie e tecnologie simili" updatedLabel={UPDATED}>
      <p>
        Questa informativa descrive l’uso di <strong>cookie</strong> e strumenti affini su <strong>eenvee</strong> (
        {LEGAL.publicDomain}, applicazione web), in armonia con la normativa applicabile e con la{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. Cosa sono i cookie</h2>
      <p>
        I cookie sono piccoli file che il browser può memorizzare. Servono, ad esempio, a mantenere l’accesso, a
        ricordare preferenze o a proteggere da abusi. Le tecnologie simili includono storage locale o
        identificativi in URL, ove usati in modo lecito e proporzionato.
      </p>

      <h2>2. Cookie e storage strettamente necessari</h2>
      <p>Questa categoria consente al servizio di funzionare in modo sicuro, ad esempio per:</p>
      <ul>
        <li>
          <strong>Sessione e autenticazione</strong> — mantenere l’utente collegato dopo il login, inclusi cookie
          HTTP-only ove impostati dal server;
        </li>
        <li>
          <strong>Sicurezza e anti abuso</strong> (rate limit, prevenzione CSRF, ove attivi);
        </li>
        <li>
          <strong>Stato minimo in UI</strong> (es. preferenza informativa sui cookie) se indispensabile, senza
          profilazione.
        </li>
      </ul>
      <p>
        Tali trattamenti si inquadrano nell’<strong>esecuzione del servizio</strong> richiesto e, per le
        categorie non analitiche non necessarie, nell’<strong>informativa</strong> e nelle scelte rese
        disponibili.
      </p>

      <h2>3. Accesso con Google (OAuth)</h2>
      <p>
        Se scegli &quot;Accedi con Google&quot;, possono essere usati strumenti di <strong>Google</strong> nel
        flusso di autenticazione, secondo l’informativa di Google. {LEGAL.company.legalName} riceve i dati
        necessari a creare o aggiornare il profilo, come descritto nella Privacy Policy.
      </p>

      <h2>4. Analitiche (statistiche d’uso)</h2>
      <p>
        <strong>È in previsione l’attivazione</strong> di strumenti di analisi delle visite o del comportamento
        (a titolo di esempio: metriche di utilizzo, per migliorare prodotto e prestazioni) che potrebbero
        comportare l’impiego di cookie o identificativi oltre quelli strettamente tecnici. Quando tali
        strumenti saranno attivati, aggiorneremo la presente pagina, il banner o le opzioni di scelta, e, ove
        richiesto dalla legge, raccoglieremo <strong>consenso</strong> specifico, distinto dalle attività
        necessarie al funzionamento.
      </p>
      <p>
        <strong>Script di profilazione o pubblicitari</strong> di terze parti <strong>non</strong> sono
        attualmente integrati nella Piattaforma; eventuali inserimenti futuri seguiranno le stesse regole di
        trasparenza e, se del caso, consenso.
      </p>

      <h2>5. Come gestire i cookie</h2>
      <p>
        Puoi bloccare o cancellare i cookie dalle impostazioni del browser. Rimuovendo i cookie di sessione
        potresti uscire dall’account o dover rieffettuare l’accesso. Le preferenze rese dal banner, ove
        mostrato, sono memorizzate in modo non invasivo lato dispositivo (es. <em>local storage</em> del browser)
        al solo fine di evitare di mostrare ripetutamente l’informativa breve.
      </p>

      <h2>6. Contatti</h2>
      <p>
        Contatti: <a href={`mailto:${LEGAL.publicEmail}`}>{LEGAL.publicEmail}</a>
      </p>
    </LegalNoticesLayout>
  );
}
