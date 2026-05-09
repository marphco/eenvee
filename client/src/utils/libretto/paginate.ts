/**
 * Auto-paginazione del libretto.
 *
 * Quando una pagina ha contenuto troppo lungo per stare in un'A5 portrait,
 * la dividiamo in più "slice" (sub-pagine fisiche). Ogni slice è una
 * `LibrettoPage` (clone della logica) con il body parzialmente troncato
 * + un campo transient `__part` che indica al renderer:
 *   - `isFirst`: mostra subtitle/titolo/ref (decorations di apertura)
 *   - `isLast`: mostra footer di chiusura (es. "Parola di Dio")
 *   - `idx` / `total`: per indicatori UI tipo "(parte 2/3)"
 *
 * Lo split avviene a confine paragrafo (`\n\n`) o frase (`. `) per
 * garantire leggibilità — niente parole spezzate.
 *
 * Stima capacità: empirica su A5 portrait, padding 28-32px, font 14px,
 * line-height 1.7. Numbers possono essere tarati col tempo.
 */

import {
  fillSpouses,
  TESTO_MEMORIA_BATTESIMO,
  TESTO_GLORIA,
  TESTO_COLLETTA,
  TESTO_ORAZIONE_OFFERTE,
  TESTO_RITO_PACE,
  TESTO_AGNELLO_DIO,
  TESTO_ORAZIONE_COMUNIONE,
  TESTO_ATTO_MATRIMONIO_CIVILE,
  findLettura,
  findBenedizioneNuziale,
} from './cei';
import type { LibrettoData, LibrettoPage } from './types';
import { filterVisiblePages } from './types';

/**
 * Capacità body per pagina A5 — TARATA PER TIPO DI PAGINA.
 *
 * NOMINAL canvas 420×583 px → area utile ~509px verticali (dopo padding).
 * Quanta parte di quei 509px va all'header decoration varia per tipo:
 *
 *   memoria/gloria/colletta/...   subtitle(38) + h1(62)               = ~100px
 *   intro/racconto/custom/dedica  h1(62)                               = ~62px
 *   lettura                       subtitle(38) + h1(62) + ref(28)      = ~128px
 *   vangelo                       subtitle(38) + h1(62) + ref(28) + ℟  = ~150px
 *   salmo (con ritornello bubble) subtitle(38) + h1(62) + ref(28) +    ~218px
 *                                 ritornello-bubble (90)
 *
 * Body utile = 509 - header. A 13px / line-height 1.55 ≈ 20px/line, con
 * paragraph spacing che eats ~12px per gap. Cap conservativo per non
 * superare ~14 righe effettive di body.
 *
 * Le slice di continuation skippano l'header ⇒ stesso cap (sopra-rappresentato
 * ma il greedy fill termina presto comunque).
 */
function capForPageType(type: LibrettoPage['type']): number {
  switch (type) {
    case 'salmo': return 750;     // bubble compatto (~28-45px), più body
    case 'vangelo': return 850;   // ref + ℟ Gloria a te (small)
    case 'lettura': return 950;   // ref + divider, body riempie quasi tutto
    // Benedizione nuziale: cap calibrato manualmente (DOM-measurement
    // bypassato per questo tipo, vedi paginatePage). Wrapper avail ≈ 447px
    // (no footer "Parola di Dio"). Densità ~0.6 px/char + paragraph
    // spacing → 800 char riempie la pagina senza clipping (in combo con
    // lineHeight più stretto 1.4 nel Body benedizione, vs 1.55 default).
    // Cap=800 fa entrare la 2ª formula (1432 char) in 2 pagine invece di 3.
    case 'benedizione-nuziale': return 800;
    default: return 950;          // memoria/gloria/colletta/intro/custom/...
  }
}

/** Info transient di slice attaccata alla page durante rendering. */
export interface PartContext {
  idx: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
}

/** Page renderable con eventuale slice context. */
export type RenderablePage = LibrettoPage & {
  __part?: PartContext;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Risoluzione del body field per ogni page type
 * ──────────────────────────────────────────────────────────────────────── */

interface BodyResolution {
  /** Field name da rimpiazzare con la slice (transient). */
  field: 'testoCompleto' | 'testo' | 'testoCustom' | 'citazione';
  /** Testo completo da paginare. */
  text: string;
  /** Cap caratteri per pagina (varia per tipo, vedi capForPageType). */
  cap: number;
}

/**
 * Estrae il body completo da una page (incl. risoluzione template per pagine
 * standard liturgiche con `useTemplate`). Ritorna null se la pagina non ha
 * body paginabile (es. cover, photo, padre-nostro fisso).
 */
function resolveBody(page: LibrettoPage, libretto: LibrettoData): BodyResolution | null {
  const sposo1 = libretto.cover.sposo1;
  const sposo2 = libretto.cover.sposo2;

  switch (page.type) {
    case 'lettura':
    case 'salmo':
    case 'vangelo':
      // Body = testoCompleto se inserito; altrimenti incipit dal DB letture
      // (i passi senza testoCompleto stanno comunque sulla pagina con incipit).
      if (page.testoCompleto && page.testoCompleto.length > 0) {
        return { field: 'testoCompleto', text: page.testoCompleto, cap: capForPageType(page.type) };
      }
      // Caso: testoCompleto è derivato dal DB (incipit/full text del lettura)
      // e potrebbe essere lungo. Ricaviamolo dal DB se non è custom.
      if (!page.testoCompleto) {
        const idField = page.type === 'lettura' ? 'letturaId' : page.type === 'salmo' ? 'salmoId' : 'vangeloId';
        const id = (page as any)[idField];
        if (id) {
          const r = findLettura(id);
          if (r?.testoCompleto && r.testoCompleto.length > 0) {
            return { field: 'testoCompleto', text: r.testoCompleto, cap: capForPageType(page.type) };
          }
        }
      }
      return null;

    case 'intro':
    case 'racconto':
    case 'custom':
      if (page.testo && page.testo.length > 0) {
        return { field: 'testo', text: page.testo, cap: capForPageType(page.type) };
      }
      return null;

    case 'ringraziamenti':
    case 'dedica':
      if (page.testo && page.testo.length > 0) {
        return { field: 'testo', text: page.testo, cap: capForPageType(page.type) };
      }
      return null;

    // Pagine standard liturgiche: il body è il template fillSpouses se
    // useTemplate (default), altrimenti testoCustom dell'utente.
    case 'memoria-battesimo': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : fillSpouses(TESTO_MEMORIA_BATTESIMO, sposo1, sposo2);
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }
    case 'gloria': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : TESTO_GLORIA;
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }
    case 'colletta': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : fillSpouses(TESTO_COLLETTA, sposo1, sposo2);
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }
    case 'orazione-offerte': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : fillSpouses(TESTO_ORAZIONE_OFFERTE, sposo1, sposo2);
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }
    case 'rito-pace': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : TESTO_RITO_PACE;
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }
    case 'agnello-dio': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : TESTO_AGNELLO_DIO;
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }
    case 'orazione-comunione': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : fillSpouses(TESTO_ORAZIONE_COMUNIONE, sposo1, sposo2);
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }
    case 'atto-matrimonio-civile': {
      const text = page.useTemplate === false
        ? (page.testoCustom || '')
        : fillSpouses(TESTO_ATTO_MATRIMONIO_CIVILE, sposo1, sposo2);
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }

    case 'benedizione-nuziale': {
      // Le 4 formule CEI sono lunghe (~1500-2500 char) → quasi sempre
      // necessitano paginazione. Risolviamo template tramite formulaId
      // o fallback a testoCustom.
      const useTpl = page.useTemplate !== false;
      let text = '';
      if (useTpl && page.formulaId) {
        const f = findBenedizioneNuziale(page.formulaId);
        if (f) text = fillSpouses(f.testoCompleto, sposo1, sposo2);
      } else {
        text = page.testoCustom || '';
      }
      if (text.length > 0) {
        return { field: 'testoCustom', text, cap: capForPageType(page.type) };
      }
      return null;
    }

    default:
      return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Splitting del testo
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Body-height disponibile per il body wrapper nel canvas NOMINAL 420×583.
 *
 * Margine di sicurezza ~30-40px sotto l'area teorica per compensare:
 *  - font Inter non sempre completamente caricato al momento del measure
 *    (in offscreen div il fallback di sistema può avere line-height
 *    leggermente più compatta → measurement underestimates real height)
 *  - h1 che può wrappare a 2 righe per antifone lunghe (es. "Sia con noi
 *    ogni giorno la bontà del nostro Dio")
 *  - paragrafi `\n\n` che hanno spacing leggermente diverso col font reale
 *
 * Meglio una pagina in più che testo tagliato.
 */
function bodyHeightForPageType(type: LibrettoPage['type']): number {
  switch (type) {
    case 'salmo': return 360;     // bubble compatto + tighten margins
    case 'vangelo': return 340;   // tighten margins
    case 'lettura': return 400;   // no divider + tighten margins (h1 6px, ref 6px, footer 8px)
    // Benedizione nuziale: maschera ULTRA-conservativa. Le formule CEI
    // sono testi a versi corti — il DOM-measurement sotto-stima per
    // via del font Inter caricato async (fallback più denso). Andiamo
    // bassi per garantire NO clipping.
    case 'benedizione-nuziale': return 150;
    default: return 400;          // memoria/gloria/ecc.
  }
}

/** Larghezza body nel canvas NOMINAL (420 - 2×28 padding = 364px). */
const BODY_WIDTH = 364;

/** Pattern per riconoscere paragrafi che sono solo il responsorio (R. ...). */
const RESPONSE_PATTERN = /^R\.\s|^R\.$/;
const isResponseLine = (p: string): boolean => RESPONSE_PATTERN.test(p);

/**
 * Misura DOM-based: spezza il testo nei chunk che FISICAMENTE entrano
 * in un'area `BODY_WIDTH × maxHeight` con lo stile del Body component.
 *
 * Pattern "maschera": apre un div invisibile fuori schermo con le esatte
 * proprietà CSS del Body (font, line-height, width, white-space:pre-wrap),
 * accumula paragrafi finché scrollHeight ≤ maxHeight, poi chiude il chunk.
 *
 * Vantaggio sul char-cap: funziona indipendentemente da lunghezza testo,
 * font caricato, dimensione caratteri, paragraph spacing — è ESATTAMENTE
 * quello che il browser renderizzerà.
 *
 * Fallback: se SSR o non disponibile, ricade su greedySplit char-based.
 */
function measureChunksByDOM(
  text: string,
  maxHeight: number,
  fontFamily: string,
): string[] | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const host = document.createElement('div');
  host.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'pointer-events:none',
    'top:-99999px',
    'left:-99999px',
    `width:${BODY_WIDTH}px`,
    `font-family:${fontFamily}`,
    'font-size:13px',
    'line-height:1.55',
    'white-space:pre-wrap',
    'box-sizing:border-box',
    'margin:0',
    'padding:0',
  ].join(';');
  document.body.appendChild(host);

  try {
    const fits = (content: string): boolean => {
      host.textContent = content;
      return host.scrollHeight <= maxHeight;
    };

    const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let current: string[] = [];

    const pushCurrent = () => {
      if (current.length > 0) {
        chunks.push(current.join('\n\n'));
        current = [];
      }
    };

    for (const p of paragraphs) {
      const trial = current.length === 0 ? p : current.join('\n\n') + '\n\n' + p;
      if (fits(trial)) {
        current.push(p);
        continue;
      }
      // Override: se p è una R. (responsorio) e la pagina corrente termina
      // con una strofa, FORZIAMO l'inclusione di p qui — è solo 1 riga, lo
      // slight overflow è preferibile a orfanare la R. in cima alla pagina
      // successiva. La R. è sempre logicamente parte della strofa che precede.
      const lastInCurrent = current[current.length - 1];
      if (isResponseLine(p) && lastInCurrent && !isResponseLine(lastInCurrent)) {
        current.push(p);
        continue;
      }
      // Non entra. Se current vuoto, paragrafo da solo è troppo grande →
      // splittiamo in frasi.
      if (current.length === 0) {
        const sentences = p.split(/(?<=[.!?»])\s+/).filter(Boolean);
        let bucket: string[] = [];
        for (const s of sentences) {
          const trialB = bucket.length === 0 ? s : bucket.join(' ') + ' ' + s;
          if (fits(trialB)) {
            bucket.push(s);
          } else {
            if (bucket.length > 0) chunks.push(bucket.join(' '));
            bucket = [s];
          }
        }
        if (bucket.length > 0) {
          // L'ultimo bucket diventa current per provare ad aggiungerci il
          // paragrafo successivo.
          current = [bucket.join(' ')];
        }
      } else {
        // Chiudi current e prova p da solo.
        pushCurrent();
        if (fits(p)) {
          current = [p];
        } else {
          // p da solo non entra — split per frasi (recursive su singolo p)
          const sentences = p.split(/(?<=[.!?»])\s+/).filter(Boolean);
          let bucket: string[] = [];
          for (const s of sentences) {
            const trialB = bucket.length === 0 ? s : bucket.join(' ') + ' ' + s;
            if (fits(trialB)) {
              bucket.push(s);
            } else {
              if (bucket.length > 0) chunks.push(bucket.join(' '));
              bucket = [s];
            }
          }
          if (bucket.length > 0) current = [bucket.join(' ')];
        }
      }
    }
    pushCurrent();

    return chunks.length > 0 ? chunks : [text];
  } finally {
    document.body.removeChild(host);
  }
}

/**
 * Greedy first-fit: divide `text` in chunk rispettando confini di paragrafo
 * (`\n\n`) o, se un paragrafo è troppo grande, di frase (`. `).
 * Caps differenziati per prima/intermedie/ultima slice.
 */
function greedySplit(
  text: string,
  firstCap: number,
  middleCap: number,
  lastCap: number,
): string[] {
  if (text.length <= firstCap) return [text];

  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let current = '';
  let capForCurrent = firstCap;

  const pushAndReset = (next: string) => {
    if (current) chunks.push(current);
    current = next;
    capForCurrent = middleCap;
  };

  for (const p of paragraphs) {
    if (p.length > capForCurrent) {
      if (current) {
        chunks.push(current);
        current = '';
        capForCurrent = middleCap;
      }
      const sentences = p.split(/(?<=[.!?])\s+/).filter(Boolean);
      let bucket = '';
      for (const s of sentences) {
        if ((bucket + ' ' + s).length > capForCurrent) {
          if (bucket) chunks.push(bucket);
          bucket = s;
          capForCurrent = middleCap;
        } else {
          bucket = bucket ? bucket + ' ' + s : s;
        }
      }
      if (bucket) current = bucket;
      continue;
    }

    const candidate = current ? current + '\n\n' + p : p;
    if (candidate.length > capForCurrent) {
      // Override: R. responsorio dopo strofa → forza-incluso, non orfanare.
      // MA solo se il chunk risultante non sfora il limite visivo di righe.
      // Senza questo controllo, formule verse-heavy (es. 4ª nuziale ~26 righe)
      // overflowano la pagina visiva. Soglia 24 righe = max safe per
      // benedizione-nuziale lineHeight=1.4. Se sfora, R va a pagina successiva.
      const lastChunkPara = current.split('\n\n').pop() || '';
      const candLines = candidate.split('\n').length;
      const MAX_LINES_PER_CHUNK = 24;
      if (
        isResponseLine(p) && current && !isResponseLine(lastChunkPara) &&
        candLines <= MAX_LINES_PER_CHUNK
      ) {
        current = candidate;
      } else {
        pushAndReset(p);
      }
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  if (chunks.length > 0) {
    const last = chunks[chunks.length - 1];
    if (last && last.length > lastCap) {
      const half = Math.floor(last.length / 2);
      const splitAt = last.indexOf('\n\n', half) >= 0
        ? last.indexOf('\n\n', half)
        : last.indexOf('. ', half) >= 0
          ? last.indexOf('. ', half) + 2
          : half;
      const a = last.substring(0, splitAt).trim();
      const b = last.substring(splitAt).trim();
      chunks.splice(chunks.length - 1, 1, a, b);
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

/** Riempie ogni pagina fino al cap, poi va a capo. Comportamento "Word/Pages". */
function splitTextIntoChunks(
  text: string,
  firstCap: number,
  middleCap: number,
  lastCap: number,
): string[] {
  if (text.length <= firstCap) return [text];
  return greedySplit(text, firstCap, middleCap, lastCap);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Public API
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Pagina una `LibrettoPage` in 1+ slice se il body è troppo lungo per A5.
 * Ritorna sempre almeno 1 elemento (la pagina originale se non serve split).
 */
export function paginatePage(page: LibrettoPage, libretto: LibrettoData): RenderablePage[] {
  const body = resolveBody(page, libretto);
  if (!body) return [page];

  // Strategia di splitting per tipo:
  //
  // BENEDIZIONE-NUZIALE: usa SOLO char-cap, NON DOM-measurement.
  //   Le formule CEI sono testi a versi corti con molti paragrafi e
  //   font Inter caricato async — il DOM-measurement risulta non
  //   affidabile (sotto-stima 2-3x con clipping). Char-cap è prevedibile
  //   e tunabile manualmente. Niente misura DOM per questo tipo.
  //
  // ALTRI TIPI (lettura/salmo/vangelo/standard): DOM-measurement primary,
  //   char-cap come fallback per SSR/ambienti senza DOM.
  let chunks: string[];
  if (page.type === 'benedizione-nuziale') {
    chunks = splitTextIntoChunks(body.text, body.cap, body.cap, body.cap);
  } else {
    const fontFamily = libretto.style.fontBody || 'Inter';
    const measured = measureChunksByDOM(
      body.text,
      bodyHeightForPageType(page.type),
      fontFamily,
    );
    chunks = measured && measured.length > 0
      ? measured
      : splitTextIntoChunks(body.text, body.cap, body.cap, body.cap);
  }
  if (chunks.length <= 1) return [page];

  return chunks.map((chunk, i) => {
    const sliced: any = { ...page };
    sliced[body.field] = chunk;
    // Se la pagina usa template ma è uno split, dobbiamo forzare useTemplate=false
    // sulle slice per evitare che il renderer ricomputi il template intero
    // ignorando il chunk. Però vogliamo che il TESTO RIMANGA quello del
    // template (già messo nel chunk). Set useTemplate=false e testoCustom=chunk
    // funziona per le standard liturgical pages.
    if ('useTemplate' in page) {
      sliced.useTemplate = false;
      sliced.testoCustom = chunk;
    }
    sliced.__part = {
      idx: i,
      total: chunks.length,
      isFirst: i === 0,
      isLast: i === chunks.length - 1,
    };
    return sliced as RenderablePage;
  });
}

/** Espande tutte le pagine del libretto in una lista flat di slice.
 *  Filtra preventivamente le pagine oscurate via feature flag (canto). */
export function expandPaginated(libretto: LibrettoData): RenderablePage[] {
  return filterVisiblePages(libretto.pages).flatMap(p => paginatePage(p, libretto));
}
