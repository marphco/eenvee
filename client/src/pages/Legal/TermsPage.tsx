import React from "react";
import LegalNoticesLayout from "./LegalNoticesLayout";
import { LEGAL, companyFullAddress } from "../../config/legalEntity";

const UPDATED = "Versione: aprile 2026";

export default function TermsPage() {
  return (
    <LegalNoticesLayout eyebrow="Condizioni" title="Termini di servizio" updatedLabel={UPDATED}>
      <p>
        I presenti <strong>Termini di servizio</strong> regolano l’accesso e l’uso della piattaforma e del marchio
        <strong> {LEGAL.brand}</strong> (il <strong>Servizio</strong>), resi da{" "}
        <strong>{LEGAL.company.legalName}</strong>, con sede in {companyFullAddress()}, P.IVA{" "}
        {LEGAL.company.vat}, in qualità di distributrice del marchio, tramite i siti e le applicazioni resi
        disponibili (es. {LEGAL.publicDomain}).
      </p>
      <p>
        I prezzi, ove presenti, sono espressi in <strong>€ (euro)</strong> salvo esplicita diversa indicazione. Il
        Servizio è offerto a <strong>consumatori</strong> (ai sensi del Codice del consumo) e a{" "}
        <strong>professionisti o imprese</strong>; dove la legge riconosce tutele diverse, ciascuna parte userà
        i rimedi previsti dallo stato di fatto o dal ruolo.
      </p>
      <p>
        Accedendo o utilizzando il Servizio, accetti questi Termini. Se non sei d’accordo, non usare la
        Piattaforma.
      </p>

      <h2>1. Natura del servizio</h2>
      <p>
        {LEGAL.brand} fornisce strumenti per creare inviti e pagine evento, raccogliere RSVP, gestire aspetti
        informativi e, ove abilitato, regali in denaro tramite <strong>Stripe</strong> (l’infrastruttura di
        pagamento in sandbox o in produzione secondo l’andamento del servizio). I marchi e nomi “Stripe”,
        “Google” o altri restano di proprietà dei rispettivi titolari.
      </p>

      <h2>2. Account e sicurezza</h2>
      <p>
        Devi fornire informazioni veritiere. Sei responsabile della riservatezza delle credenziali. Ciò che
        pubblichi sotto il tuo account o nel contesto del tuo evento è, nei limiti di legge, tua
        responsabilità.
      </p>

      <h2>3. Contenuti e licenza</h2>
      <p>
        Detieni i diritti sui contenuti che carichi. Concedi a {LEGAL.company.legalName} la licenza non
        esclusiva, a livello necessario, di trattarli, ospitarli, mostrarli e distribuirli al solo scopo di
        erogare e migliorare il Servizio, salvo disposizione diversa. È fatto divieto di caricare materiali
        illeciti, diffamatori o che violino diritti di terzi.
      </p>

      <h2>4. Pagamenti, prezzi e diritti in caso di recesso (consumatori)</h2>
      <p>
        I pagamenti (piano &quot;Evento&quot;, add-on, donazioni) seguono le condizioni e i prezzi mostrati
        al momento dell’acquisto e l’integrazione con <strong>Stripe</strong> (commissioni, rimborsi, contestazioni
        secondo le regole del circuito, salvo quanto indicato in app). I prezzi in euro e le funzionalità possono
        evolvere: eventuali variazioni pregiudizievoli a servizi già acquistati saranno rese note con
        ragionevole preavviso, ove richiesto dalla legge o dal buon fede contrattuale.
      </p>
      <p>
        Laddove siano applicabili, per i <strong>consumatori</strong> (contratti a distanza o fuori
        dalle locali imprenditoriali) resta valido, nei limiti e con le esclusioni di legge (compresa la prestazione
        piena di un servizio digitale a richiesta e le eccezioni al diritto di recesso, se previste), il
        <strong>diritto di recesso</strong> entro i termini previsti. Le richieste di rientro, rimborso o
        chiarimento saranno trattate <strong>caso per caso</strong>, in conformità a norme inderogabili e, laddove
        ammesso, in modo coerente con l’esigenza di standardizzare un prodotto digitale, contattando{" "}
        <a href={`mailto:${LEGAL.publicEmail}`}>{LEGAL.publicEmail}</a>.
      </p>
      <p>
        I contratti con <strong>professionisti o imprese</strong> seguono le rispettive clausole e la disciplina
        commerciale applicabile, fermo quanto inderogabile a favore del contraente meno protezione.
      </p>

      <h2>5. Sospensione e chiusura</h2>
      <p>
        {LEGAL.company.legalName} può sospendere o chiudere account in caso di violazione grave, rischi per
        la sicurezza, richieste legittime o obblighi di legge. Puoi interrompere l’uso in ogni momento; la
        conservazione di certi dati potrà essere imposta a fini fiscali o difensivi secondo le norme applicabili.
      </p>

      <h2>6. Limitazione di responsabilità</h2>
      <p>
        Il Servizio è fornito <strong>così com’è</strong>. Nella misura massima consentita dalle norme, si esclude
        la responsabilità per danni indiretti, mancati guadagni, interruzioni, perdite di dati non imputabili a
        dolo o colpa grave. Restano salvi i diritti inderogabili del consumatore ove sussistano.
      </p>

      <h2>7. Legge applicabile e fori competenza</h2>
      <p>
        I presenti Termini sono regolati dalla <strong>legge italiana</strong>, ove applicabile. Per
        l’<strong>utente consumatore</strong> restano ferme le disposizioni a tutela del consumatore (incluso
        il foro del consumatore ove previsto). Per le controversie con <strong>professionisti o imprese</strong>{" "}
        (clienti non consumatori), competente in via generale il <strong>Foro di Napoli</strong>, salvo norme
        inderogabili o diversa competenza per legge.
      </p>

      <h2>8. Privacy e cookie</h2>
      <p>
        Il trattamento dei dati personali è descritto nella <a href="/privacy">Privacy Policy</a> e nella{" "}
        <a href="/cookie">Cookie Policy</a>. Per contatti: <a href={`mailto:${LEGAL.publicEmail}`}>{LEGAL.publicEmail}</a>.
      </p>
    </LegalNoticesLayout>
  );
}
