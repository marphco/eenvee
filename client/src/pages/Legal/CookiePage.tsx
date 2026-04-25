import React from "react";
import LegalNoticesLayout from "./LegalNoticesLayout";

const UPDATED = "Versione: aprile 2026";

export default function CookiePage() {
  return (
    <LegalNoticesLayout
      eyebrow="Informativa"
      title="Cookie e tecnologie simili"
      updatedLabel={UPDATED}
    >
      <p>
        Questa informativa descrive l’uso di <strong>cookie</strong> e strumenti affini su <strong>eenvee</strong>{" "}
        (sito e applicazione web), in armonia con le linee guida applicabili e con la{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. Cosa sono i cookie</h2>
      <p>
        I cookie sono piccoli file che il browser memorizza. Servono, ad esempio, a mantenere l’accesso, a
        ricordare preferenze o a proteggere da abusi. Le tecnologie simili includono, ove usate, storage locale o
        identificativi in URL.
      </p>

      <h2>2. Cookie e storage strettamente necessari</h2>
      <p>Questa categoria consente al servizio di funzionare in modo sicuro, ad esempio per:</p>
      <ul>
        <li>
          <strong>Sessione e autenticazione</strong> — mantenere l’utente collegato dopo il login, inclusi cookie
          HTTP-only impostati dal server;
        </li>
        <li>
          <strong>Sicurezza e anti abuso</strong> (rate limit, prevenzione CSRF, ove attivi);
        </li>
        <li>
          <strong>Stato minimo in UI</strong> (es. chiusura di un messaggio) solo se indispensabile, senza
          profilazione.
        </li>
      </ul>
      <p>
        Questi strumenti si basano sull’<strong>esecuzione del servizio</strong> richiesto e non richiedono
        consenso, salvo i casi in cui la legge o le autorità richiedano informativa estesa: comunque ti
        informiamo in trasparenza.
      </p>

      <h2>3. Accesso con Google (OAuth)</h2>
      <p>
        Se scegli “Accedi con Google”, potrebbero essere impostati cookie o strumenti da parte di{" "}
        <strong>Google</strong> nel contesto del loro flusso di autenticazione. Ti invitiamo a consultare
        l’informativa Google relevante. eenvee riceve i dati necessari a creare/aggiornare il tuo account
        secondo la Privacy Policy.
      </p>

      <h2>4. Analitiche e marketing</h2>
      <p>
        <strong>Attualmente</strong> non usiamo cookie di profilazione o pubblicità di terze parti. Se
        introdusseremo strumenti analitici opzionali, aggiorneremo questa pagina, il banner di informativa e, ove
        necessario, raccoglieremo <strong>consenso</strong> in modo distinto dalle attività strettamente
        tecniche.
      </p>

      <h2>5. Come gestire i cookie</h2>
      <p>
        Puoi bloccare o cancellare i cookie dalle impostazioni del browser. Rimuovendo i cookie di sessione
        potresti uscire dall’account o dover rieffettuare l’accesso. Il bandierino del banner, ove mostrato,
        registra che hai preso visione di questa informativa (senza sostituire le impostazioni del browser sui
        cookie tecnici necessari in prima parte).
      </p>

      <h2>6. Contatti</h2>
      <p>
        Per domande: <a href="mailto:privacy@eenvee.com">privacy@eenvee.com</a> (sostituire con indirizzo aziendale
        definitivo).
      </p>
    </LegalNoticesLayout>
  );
}
