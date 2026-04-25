import React from "react";
import LegalNoticesLayout from "./LegalNoticesLayout";

const UPDATED = "Versione: aprile 2026";

export default function TermsPage() {
  return (
    <LegalNoticesLayout eyebrow="Condizioni" title="Termini di servizio" updatedLabel={UPDATED}>
      <p>
        I presenti <strong>Termini di servizio</strong> regolano l’accesso e l’uso di <strong>eenvee</strong> (la
        <strong> Piattaforma</strong>). Utilizzando la Piattaforma accetti questi termini. Se non sei d’accordo,
        non usare il servizio.
      </p>

      <h2>1. Natura del servizio</h2>
      <p>
        eenvee fornisce strumenti per creare inviti e pagine evento, raccogliere RSVP, gestire aspetti
        informativi e, ove abilitato, regali in denaro tramite <strong>Stripe</strong>. Nomi commerciali
        (Stripe, Google, altri) restano di proprietà dei rispettivi titolari.
      </p>

      <h2>2. Account e sicurezza</h2>
      <p>
        Devi fornire informazioni veritiere. Sei responsabile della segretezza dell’accesso. Ciò che pubblichi
        sotto il tuo account o nel contesto del tuo evento è tua responsabilità, entro i limiti di legge.
      </p>

      <h2>3. Contenuti e licenza</h2>
      <p>
        Detieni i diritti sui contenuti che carichi. Concedi a noi la licenza non esclusiva, mondiale, gratuita, di
        trattarli, ospitarli, mostrarli e distribuirli solo per fornire e migliorare il servizio, salvo
        disposizione diversa. Non devi caricare materiali illeciti, diffamatori o che violino diritti di terzi.
      </p>

      <h2>4. Pagamenti e piano</h2>
      <p>
        I pagamenti (piano “Evento”, add-on, donazioni) seguono le condizioni proposte al momento
        dell’acquisto e l’eventuale integrazione con <strong>Stripe</strong> (commissioni, rimborsi, contestazioni
        a carico del circuito, salvo quanto specificato in app). I prezzi e le funzioni possono evolvere: le
        modifiche sostanziali su servizi già prepagati saranno comunicate con ragionevole preavviso ove
        opportuno.
      </p>

      <h2>5. Sospensione e chiusura</h2>
      <p>
        Possiamo sospendere o chiudere account in caso di violazione grave, rischio per la sicurezza, richieste
        legittime o obblighi di legge. Puoi interrompere l’uso in ogni momento; alcuni dati possono dover
        restare a fini fiscali o probatori secondo le norme applicabili.
      </p>

      <h2>6. Limitazione di responsabilità</h2>
      <p>
        Il servizio è fornito <strong>“così com’è”</strong>. Nella misura massima permessa dalle norme, decliniamo
        ogni responsabilità per danni indiretti, mancati guadagni, interruzioni, perdita di dati non imputabili a
        dolo o colpa grave. Restano salvi i diritti inderogabili del consumatore.
      </p>

      <h2>7. Legge applicabile e foro</h2>
      <p>
        Per i consumatori residenti in Italia, si applica la legge italiana. Per le controversie, è competente il
        foro del consumatore ove richiesto dalla legge, altrimenti il foro del territorio concordato in sede
        societaria una volta costituita la società operativa. Per professionisti, salvo strumenti
        ODR europei, si applica la disciplina vigente in Italia.
      </p>

      <h2>8. Privacy e cookie</h2>
      <p>
        Il trattamento dei dati personali è descritto nella{" "}
        <a href="/privacy">Privacy Policy</a> e nella <a href="/cookie">Cookie Policy</a>.
      </p>
    </LegalNoticesLayout>
  );
}
