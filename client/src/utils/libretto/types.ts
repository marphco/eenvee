/**
 * Modello dati Libretto Messa.
 *
 * Persistito dentro `block.widgetProps.libretto*`.
 * Le pagine sono un array ordinato (drag-drop nel sidebar).
 */

import type { Postura } from './cei';

/**
 * Macro-sezioni liturgiche per raggruppamento nell'indice + nav editor.
 * Derivate auto dal `type` se non specificato esplicitamente sulla pagina.
 */
export type SezioneLiturgica =
  | 'apertura'        // cover, indice, dedica iniziale, racconto pre-messa
  | 'introduzione'    // riti introduzione, gloria, colletta, memoria battesimo
  | 'parola'          // letture, salmo, vangelo, alleluia
  | 'matrimonio'      // interrogazioni, consenso, anelli, preghiere fedeli, litanie
  | 'eucaristica'     // offertorio, padre nostro, benedizione, comunione, agnello
  | 'conclusione'     // riti conclusione, atto civile, ringraziamenti
  | 'extra';          // photo, custom, racconto post-messa

export const LABEL_SEZIONE: Record<SezioneLiturgica, string> = {
  apertura: 'Apertura',
  introduzione: 'Riti di Introduzione',
  parola: 'Liturgia della Parola',
  matrimonio: 'Liturgia del Matrimonio',
  eucaristica: 'Liturgia Eucaristica',
  conclusione: 'Riti di Conclusione',
  extra: 'Extra',
};

export type LibrettoVariant = 'con-messa' | 'senza-messa';

/**
 * Forme foto cover.
 * v2 espone solo `circle` e `rectangle` nella UI. I valori legacy
 * (`square`, `wide`, `fullbleed`) rimangono per retrocompatibilità coi dati
 * salvati prima della semplificazione → trattati come rettangolo.
 */
export type FotoShape = 'circle' | 'rectangle' | 'square' | 'wide' | 'fullbleed';
export type FotoSize = 'sm' | 'md' | 'lg';
export type FotoPlacement = 'top' | 'bottom';

export interface LibrettoCover {
  /**
   * Convenzione fissa: `sposo1` = LO SPOSO (uomo), `sposo2` = LA SPOSA
   * (donna). I label dei field nel cover-editor lo rendono esplicito —
   * niente domande all'utente, niente ambiguità. I template liturgici
   * con ruolo distinto ({sposa}/{sposo}) usano questa convenzione.
   *
   * (Nota storica: la sposaIs flag è stata rimossa nel 2026-05 in favore
   * di questa convenzione hard-coded — solo coppie etero si sposano in
   * chiesa cattolica.)
   */
  sposo1: string;
  sposo2: string;
  data: string;        // formato libero, es. "12 settembre 2026"
  chiesa: string;      // es. "Chiesa di Santa Maria, Milano"
  fraseIniziale?: string | undefined; // citazione/versetto opzionale
  foto?: string | undefined;       // URL R2
  fotoShape?: FotoShape | undefined;
  fotoSize?: FotoSize | undefined;
  /** Posizione del frame della foto sulla copertina (sopra/sotto i nomi). */
  fotoPlacement?: FotoPlacement | undefined;
  /** object-position % (0-100) per inquadratura del contenuto dentro il frame. */
  fotoOffsetX?: number | undefined;
  fotoOffsetY?: number | undefined;
  /** Zoom moltiplicativo (1.0 - 3.0). Default 1. Permette di ingrandire dentro la maschera. */
  fotoZoom?: number | undefined;
  /**
   * Ordine in cui renderizzare gli elementi della copertina.
   * Default (se assente): ['foto', 'frase', 'nomi', 'data', 'chiesa'].
   * Elementi mancanti dall'array non vengono renderizzati;
   * elementi con contenuto vuoto sono saltati silenziosamente.
   */
  elementsOrder?: CoverElement[] | undefined;

  /** Sacerdote che presiede la celebrazione (es. "Don Enzo Malizia"). */
  officiante?: string | undefined;
  /** Testimoni di matrimonio (di solito 2-4 nomi). */
  testimoni?: string[] | undefined;
}

export type CoverElement = 'foto' | 'frase' | 'nomi' | 'data' | 'chiesa' | 'officiante' | 'testimoni';

/** Feature flag: oscura tutte le pagine `canto`. I canti contemporanei
 *  italiani sono coperti da SIAE e non possono essere ridistribuiti senza
 *  licenza; quelli PD (gregoriani/latini) sono di nicchia e raramente usati
 *  nei matrimoni reali. Per riabilitare i canti:
 *    1. Mettere `HIDE_CANTI_PAGES = false`
 *    2. Decommentare le entry `type: 'canto'` in templates.ts
 *  Le pagine canto già presenti in libretti pre-flag vengono filtrate al
 *  rendering (vedi `filterVisiblePages`). */
export const HIDE_CANTI_PAGES = true;

/** Filtra dalle pagine quelle attualmente oscurate via feature flag.
 *  Da chiamare in TUTTI i consumer di `libretto.pages` (TOC, paginazione,
 *  preview, public render) per garantire coerenza. */
export function filterVisiblePages(pages: LibrettoPage[]): LibrettoPage[] {
  if (HIDE_CANTI_PAGES) return pages.filter((p) => p.type !== 'canto');
  return pages;
}

export const DEFAULT_COVER_ORDER: CoverElement[] = ['foto', 'frase', 'nomi', 'data', 'chiesa', 'officiante', 'testimoni'];

export const COVER_ELEMENT_LABEL: Record<CoverElement, string> = {
  foto: 'Foto',
  frase: 'Frase iniziale',
  nomi: 'Nomi degli sposi',
  data: 'Data',
  chiesa: 'Chiesa / luogo',
  officiante: 'Sacerdote',
  testimoni: 'Testimoni',
};

/** Ogni pagina del libretto ha un type discriminator + dati specifici. */
export type LibrettoPage =
  | LibrettoPageCover
  | LibrettoPageIntro
  | LibrettoPageLettura
  | LibrettoPageSalmo
  | LibrettoPageVangelo
  | LibrettoPageCanto
  | LibrettoPageInterrogazioni
  | LibrettoPageConsenso
  | LibrettoPageAnelli
  | LibrettoPagePreghiereFedeli
  | LibrettoPagePadreNostro
  | LibrettoPageBenedizioneNuziale
  | LibrettoPageDedica
  | LibrettoPageRingraziamenti
  | LibrettoPagePhoto
  | LibrettoPageCustom
  // Nuovi tipi (struttura tipica libretto messa Italia)
  | LibrettoPageMemoriaBattesimo
  | LibrettoPageGloria
  | LibrettoPageColletta
  | LibrettoPageLitanieSanti
  | LibrettoPageOrazioneOfferte
  | LibrettoPageRitoPace
  | LibrettoPageAgnelloDio
  | LibrettoPageOrazioneComunione
  | LibrettoPageRitiConclusione
  | LibrettoPageAttoCivile
  | LibrettoPageDedicaIniziale
  | LibrettoPageRacconto
  | LibrettoPageIndice;

interface PageBase {
  id: string;
  postura?: Postura;
  /** Sezione liturgica per raggruppamento indice. Se assente, derivata auto da `type`. */
  sezione?: SezioneLiturgica;
}

export interface LibrettoPageCover extends PageBase {
  type: 'cover';
}

export interface LibrettoPageIntro extends PageBase {
  type: 'intro';
  titolo: string;       // es. "Riti di Introduzione"
  testo?: string;       // opzionale: spiegazione/saluto del celebrante
}

export interface LibrettoPageLettura extends PageBase {
  type: 'lettura';
  letturaId?: string | undefined;   // ref a cei.LETTURE_AT/_NT
  testoCompleto?: string | undefined; // se l'utente vuole inserire il testo
  monizione?: string | undefined;   // breve introduzione
}

export interface LibrettoPageSalmo extends PageBase {
  type: 'salmo';
  salmoId?: string | undefined;
  ritornello?: string | undefined;
  testoCompleto?: string | undefined;
}

export interface LibrettoPageVangelo extends PageBase {
  type: 'vangelo';
  vangeloId?: string | undefined;
  testoCompleto?: string | undefined;
}

export interface LibrettoPageCanto extends PageBase {
  type: 'canto';
  momento: string;      // "Canto d'ingresso", "Offertorio", ecc.
  titolo: string;
  testo?: string;
}

export interface LibrettoPageInterrogazioni extends PageBase {
  type: 'interrogazioni';
  /** Se true usa il template CEI auto-popolato con i nomi. */
  useTemplate: boolean;
  testoCustom?: string;
}

export interface LibrettoPageConsenso extends PageBase {
  type: 'consenso';
  forma: 'dichiarativo' | 'interrogativo';
  testoCustom?: string;
}

export interface LibrettoPageAnelli extends PageBase {
  type: 'anelli';
  useTemplate: boolean;
  testoCustom?: string;
}

export interface LibrettoPagePreghiereFedeli extends PageBase {
  type: 'preghiere-fedeli';
  intenzioni: string[];
  ritornello?: string; // es. "Ascoltaci, Signore"
}

export interface LibrettoPagePadreNostro extends PageBase {
  type: 'padre-nostro';
}

export interface LibrettoPageBenedizioneNuziale extends PageBase {
  type: 'benedizione-nuziale';
  /** ID di una delle 4 formule ufficiali (ben-85, ben-86, ben-87, ben-88).
   *  Se valorizzato e useTemplate ≠ false, il renderer usa il testo standard
   *  da BENEDIZIONI_NUZIALI con i nomi degli sposi sostituiti. */
  formulaId?: string;
  /** Se false, usa testoCustom invece del template. */
  useTemplate?: boolean;
  /** Testo custom se l'utente ha scelto "scrivi a mano". */
  testoCustom?: string;
  titoloCustom?: string;
}

export interface LibrettoPageDedica extends PageBase {
  type: 'dedica';
  titolo: string;       // "Un pensiero per..."
  testo: string;
}

export interface LibrettoPageRingraziamenti extends PageBase {
  type: 'ringraziamenti';
  testo: string;
}

export interface LibrettoPagePhoto extends PageBase {
  type: 'photo';
  url: string;
  caption?: string;
}

export interface LibrettoPageCustom extends PageBase {
  type: 'custom';
  titolo: string;
  testo: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Nuovi tipi pagina (struttura tipica libretto messa, vedi .doc esempio)
 *
 * Pattern comune: `useTemplate` (default true) → renderer usa il testo CEI
 * standard auto-popolato con i nomi degli sposi; se false, usa `testoCustom`.
 * Ogni tipo ha eventualmente un `titoloCustom` per sovrascrivere il titolo
 * default (es. "Riti di Conclusione" → "Saluto finale").
 * ──────────────────────────────────────────────────────────────────────── */

interface StandardLiturgicalPage extends PageBase {
  useTemplate?: boolean;
  testoCustom?: string;
  titoloCustom?: string;
}

export interface LibrettoPageMemoriaBattesimo extends StandardLiturgicalPage { type: 'memoria-battesimo' }
export interface LibrettoPageGloria extends StandardLiturgicalPage { type: 'gloria' }
export interface LibrettoPageColletta extends StandardLiturgicalPage { type: 'colletta' }
export interface LibrettoPageLitanieSanti extends StandardLiturgicalPage {
  type: 'litanie-santi';
  /** Lista santi customizzabile; se vuota usa quella default. */
  santi?: string[];
}
export interface LibrettoPageOrazioneOfferte extends StandardLiturgicalPage { type: 'orazione-offerte' }
export interface LibrettoPageRitoPace extends StandardLiturgicalPage { type: 'rito-pace' }
export interface LibrettoPageAgnelloDio extends StandardLiturgicalPage { type: 'agnello-dio' }
export interface LibrettoPageOrazioneComunione extends StandardLiturgicalPage { type: 'orazione-comunione' }
export interface LibrettoPageRitiConclusione extends StandardLiturgicalPage {
  type: 'riti-conclusione';
  /** ID formula CEI ufficiale ('fin-1' | 'fin-2' | 'fin-3'). */
  formulaId?: string;
  /** Se true (default) usa la formula CEI; se false usa `benedizioniCustom`. */
  useTemplate?: boolean;
  /** Benedizioni custom dell'utente (usate solo se useTemplate=false). */
  benedizioniCustom?: string[];
  /** @deprecated Campo legacy pre-formule. Se valorizzato, viene trattato
   *  come custom (useTemplate=false). Nuovi libretti usano formulaId. */
  benedizioni?: string[];
}
export interface LibrettoPageAttoCivile extends StandardLiturgicalPage { type: 'atto-matrimonio-civile' }
export interface LibrettoPageDedicaIniziale extends PageBase {
  type: 'dedica-iniziale';
  citazione: string;       // testo della citazione
  autore?: string;         // es. "Sant'Agostino"
}
export interface LibrettoPageRacconto extends PageBase {
  type: 'racconto';
  titolo: string;
  testo: string;
}

/**
 * Pagina Indice — auto-popolata dalle altre pagine del libretto.
 * `profondita: 'macro'` mostra solo le 5-6 macro-sezioni; `'dettaglio'`
 * elenca tutte le pagine (escluse cover, indice stessa, photo).
 */
export interface LibrettoPageIndice extends PageBase {
  type: 'indice';
  titoloCustom?: string;        // default "Indice"
  profondita?: 'macro' | 'dettaglio'; // default 'macro'
  mostraNumeri?: boolean;       // default true
}

export interface LibrettoStyle {
  fontHeading?: string;
  fontBody?: string;
  accentColor?: string;
  decoroStyle?: 'minimal' | 'classico' | 'fiori' | 'oro';
  pageBgColor?: string;
}

export interface LibrettoData {
  variant: LibrettoVariant;
  cover: LibrettoCover;
  pages: LibrettoPage[];
  style: LibrettoStyle;
  isPublished?: boolean;
}

/** Etichette UI per ogni tipo di pagina, in italiano. */
export const PAGE_TYPE_LABEL: Record<LibrettoPage['type'], string> = {
  'cover': 'Copertina',
  'intro': 'Introduzione',
  'lettura': 'Lettura',
  'salmo': 'Salmo Responsoriale',
  'vangelo': 'Vangelo',
  'canto': 'Canto',
  'interrogazioni': 'Interrogazioni',
  'consenso': 'Consenso e Promesse',
  'anelli': 'Scambio degli Anelli',
  'preghiere-fedeli': 'Preghiere dei Fedeli',
  'padre-nostro': 'Padre Nostro',
  'benedizione-nuziale': 'Benedizione Nuziale',
  'dedica': 'Dedica',
  'ringraziamenti': 'Ringraziamenti',
  'photo': 'Foto',
  'custom': 'Pagina libera',
  'memoria-battesimo': 'Memoria del Battesimo',
  'gloria': 'Gloria',
  'colletta': 'Colletta',
  'litanie-santi': 'Litanie dei Santi',
  'orazione-offerte': 'Orazione sulle offerte',
  'rito-pace': 'Rito della pace',
  'agnello-dio': 'Agnello di Dio',
  'orazione-comunione': 'Orazione dopo la comunione',
  'riti-conclusione': 'Riti di Conclusione',
  'atto-matrimonio-civile': 'Atto di Matrimonio',
  'dedica-iniziale': 'Dedica iniziale',
  'racconto': 'Racconto / Lettura libera',
  'indice': 'Indice',
};

/**
 * Mapping default tipo pagina → sezione liturgica.
 * Override possibile via `page.sezione` esplicito.
 */
export const SEZIONE_DEFAULT_BY_TYPE: Record<LibrettoPage['type'], SezioneLiturgica> = {
  'cover': 'apertura',
  'indice': 'apertura',
  'dedica-iniziale': 'apertura',
  'intro': 'introduzione',
  'memoria-battesimo': 'introduzione',
  'gloria': 'introduzione',
  'colletta': 'introduzione',
  'lettura': 'parola',
  'salmo': 'parola',
  'vangelo': 'parola',
  'canto': 'parola', // canti possono essere ovunque, default Parola
  'interrogazioni': 'matrimonio',
  'consenso': 'matrimonio',
  'anelli': 'matrimonio',
  'preghiere-fedeli': 'matrimonio',
  'litanie-santi': 'matrimonio',
  'orazione-offerte': 'eucaristica',
  'rito-pace': 'eucaristica',
  'agnello-dio': 'eucaristica',
  'orazione-comunione': 'eucaristica',
  'padre-nostro': 'eucaristica',
  'benedizione-nuziale': 'eucaristica',
  'riti-conclusione': 'conclusione',
  'atto-matrimonio-civile': 'conclusione',
  'ringraziamenti': 'conclusione',
  'racconto': 'extra',
  'photo': 'extra',
  'dedica': 'extra',
  'custom': 'extra',
};

/** Risolve la sezione di una pagina (override esplicito o default per tipo). */
export function resolveSezione(p: LibrettoPage): SezioneLiturgica {
  return p.sezione || SEZIONE_DEFAULT_BY_TYPE[p.type] || 'extra';
}

/**
 * Tipi "fluidi" — pagine che liturgicamente non hanno una sezione fissa,
 * ma appartengono al momento in cui si trovano. Es: il "Canto d'ingresso"
 * apre i Riti di Introduzione, "Alleluia" sta nella Liturgia della Parola,
 * "Canto offertorio" apre la Liturgia Eucaristica, ecc.
 *
 * Per questi tipi il TOC inferisce la sezione dalla POSIZIONE: eredita
 * dal prossimo ancoraggio liturgico avanti (e se assente, da quello
 * indietro). Così l'indice rispetta l'ordinamento sequenziale anziché
 * sbalzare i numeri di pagina ("3 dopo 6, 17 dopo 11" — comportamento
 * pre-fix che spezzava la lettura).
 */
const FLUID_TYPES = new Set<LibrettoPage['type']>([
  'canto', 'intro', 'photo', 'custom', 'dedica', 'racconto',
]);

/**
 * Risolve la sezione tenendo conto del CONTESTO (posizione nella lista).
 * Per i tipi fluidi, eredita dalla pagina ancoraggio più vicina (avanti
 * → indietro). Se la pagina ha `sezione` esplicita, ha sempre precedenza.
 */
export function resolveSezioneInContext(
  idx: number,
  pages: LibrettoPage[],
): SezioneLiturgica {
  const p = pages[idx];
  if (!p) return 'extra';
  if (p.sezione) return p.sezione;
  if (!FLUID_TYPES.has(p.type)) {
    return SEZIONE_DEFAULT_BY_TYPE[p.type] || 'extra';
  }

  // Walk forward finché trovi un'ancora (non-fluid).
  for (let i = idx + 1; i < pages.length; i++) {
    const next = pages[i];
    if (next && !FLUID_TYPES.has(next.type)) {
      return next.sezione || SEZIONE_DEFAULT_BY_TYPE[next.type] || 'extra';
    }
  }
  // Walk backward.
  for (let i = idx - 1; i >= 0; i--) {
    const prev = pages[i];
    if (prev && !FLUID_TYPES.has(prev.type)) {
      return prev.sezione || SEZIONE_DEFAULT_BY_TYPE[prev.type] || 'extra';
    }
  }
  // Fallback al default statico.
  return SEZIONE_DEFAULT_BY_TYPE[p.type] || 'extra';
}
