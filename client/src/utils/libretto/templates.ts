/**
 * Template default per il Libretto Messa.
 * Quando l'utente attiva il widget, generiamo le pagine standard
 * "con Messa" già precompilate (16-18 pagine). Lui poi personalizza.
 */

import type { LibrettoData, LibrettoPage, LibrettoVariant } from './types';

let pageIdCounter = 0;
const newPageId = (): string =>
  `pg-${Date.now().toString(36)}-${(pageIdCounter++).toString(36)}`;

/**
 * Pagine default per matrimonio CON Messa.
 *
 * Struttura allineata al .doc esempio fornito (pattern reale italiano):
 *   Cover → Riti Introduzione → Liturgia Parola → Liturgia Matrimonio →
 *   Liturgia Eucaristica → Riti Conclusione → Ringraziamenti.
 *
 * 27 pagine. L'utente ovviamente può eliminare quello che non gli serve
 * (canti opzionali, atto civile, ecc.).
 */
function defaultPagesConMessa(): LibrettoPage[] {
  return [
    { id: newPageId(), type: 'cover' },
    // Indice auto-popolato (macro-sezioni). Sempre presente di default.
    { id: newPageId(), type: 'indice', profondita: 'macro', mostraNumeri: true },

    // ─── Riti di Introduzione ───
    // Pagina "saluto" col dialogo liturgico standard CEI ("Nel nome del
    // Padre…" / "Il Signore che guida i nostri cuori…"). Usa il tipo
    // `intro` con testo precompilato — l'utente può modificarlo.
    {
      id: newPageId(),
      type: 'intro',
      titolo: 'Riti di Introduzione',
      testo: 'Sac: Nel nome del Padre e del Figlio e dello Spirito Santo.\nTutti: Amen.\n\nSac: Il Signore che guida i nostri cuori nell\'amore e nella pazienza di Cristo, sia con tutti voi.\nTutti: E con il tuo spirito.',
      postura: 'piedi',
    },
    // CANTI OSCURATI (vedi HIDE_CANTI_PAGES in types.ts). Per riabilitare:
    // 1. mettere HIDE_CANTI_PAGES = false; 2. decommentare le righe canto qui.
    // { id: newPageId(), type: 'canto', momento: 'Canto d\'ingresso', titolo: '', postura: 'piedi' },
    { id: newPageId(), type: 'memoria-battesimo', useTemplate: true, postura: 'piedi' },
    { id: newPageId(), type: 'gloria', useTemplate: true, postura: 'piedi' },
    { id: newPageId(), type: 'colletta', useTemplate: true, postura: 'piedi' },

    // ─── Liturgia della Parola ───
    // Niente pagina "intro" placeholder: il subtitle/header di ogni
    // pagina mostra già la sezione, e nel TOC le pagine sono
    // raggruppate per `sezione`. Andare diretti al contenuto.
    { id: newPageId(), type: 'lettura', postura: 'seduti' },
    { id: newPageId(), type: 'salmo', postura: 'seduti' },
    { id: newPageId(), type: 'lettura', postura: 'seduti' },
    // { id: newPageId(), type: 'canto', momento: 'Alleluia', titolo: '', postura: 'piedi' },
    { id: newPageId(), type: 'vangelo', postura: 'piedi' },

    // ─── Liturgia del Matrimonio ───
    { id: newPageId(), type: 'interrogazioni', useTemplate: true, postura: 'piedi' },
    { id: newPageId(), type: 'consenso', forma: 'dichiarativo', postura: 'piedi' },
    { id: newPageId(), type: 'anelli', useTemplate: true, postura: 'piedi' },
    {
      id: newPageId(),
      type: 'preghiere-fedeli',
      intenzioni: [
        'Per la Chiesa, perché sia testimone di amore fedele nel mondo. Preghiamo.',
        'Per gli sposi, perché custodiscano con cura la grazia del sacramento ricevuto. Preghiamo.',
        'Per le famiglie, perché trovino nella loro casa un luogo di pace e accoglienza. Preghiamo.',
        'Per i nostri cari defunti, perché vivano nella luce di Dio. Preghiamo.',
      ],
      ritornello: 'Ascoltaci, Signore.',
      postura: 'piedi',
    },
    { id: newPageId(), type: 'litanie-santi', useTemplate: true, postura: 'piedi' },

    // ─── Liturgia Eucaristica ───
    // { id: newPageId(), type: 'canto', momento: 'Offertorio', titolo: '', postura: 'seduti' },
    { id: newPageId(), type: 'orazione-offerte', useTemplate: true, postura: 'piedi' },
    { id: newPageId(), type: 'padre-nostro', postura: 'piedi' },
    { id: newPageId(), type: 'benedizione-nuziale', formulaId: 'ben-85', useTemplate: true, postura: 'piedi' },
    { id: newPageId(), type: 'rito-pace', useTemplate: true, postura: 'piedi' },
    { id: newPageId(), type: 'agnello-dio', useTemplate: true, postura: 'ginocchio' },
    // { id: newPageId(), type: 'canto', momento: 'Comunione', titolo: '', postura: 'seduti' },
    { id: newPageId(), type: 'orazione-comunione', useTemplate: true, postura: 'piedi' },

    // ─── Riti di Conclusione ───
    { id: newPageId(), type: 'riti-conclusione', useTemplate: true, formulaId: 'fin-1', postura: 'piedi' },
    { id: newPageId(), type: 'atto-matrimonio-civile', useTemplate: true, postura: 'seduti' },
    // { id: newPageId(), type: 'canto', momento: 'Canto finale', titolo: '', postura: 'piedi' },
    {
      id: newPageId(),
      type: 'ringraziamenti',
      testo: 'Grazie di cuore per aver condiviso con noi questo giorno speciale. Il vostro affetto è il regalo più bello.',
    },
  ];
}

/** Pagine default per matrimonio SENZA Messa (più snello). */
function defaultPagesSenzaMessa(): LibrettoPage[] {
  return [
    { id: newPageId(), type: 'cover' },
    { id: newPageId(), type: 'indice', profondita: 'macro', mostraNumeri: true },
    {
      id: newPageId(),
      type: 'intro',
      titolo: 'Riti di Introduzione',
      testo: 'Sac: Nel nome del Padre e del Figlio e dello Spirito Santo.\nTutti: Amen.\n\nSac: Il Signore che guida i nostri cuori nell\'amore e nella pazienza di Cristo, sia con tutti voi.\nTutti: E con il tuo spirito.',
      postura: 'piedi',
    },
    // CANTI OSCURATI (vedi HIDE_CANTI_PAGES). Decommentare per riabilitare.
    // {
    //   id: newPageId(),
    //   type: 'canto',
    //   momento: 'Canto d\'ingresso',
    //   titolo: '',
    //   postura: 'piedi',
    // },
    {
      id: newPageId(),
      type: 'lettura',
      postura: 'seduti',
    },
    {
      id: newPageId(),
      type: 'salmo',
      postura: 'seduti',
    },
    {
      id: newPageId(),
      type: 'vangelo',
      postura: 'piedi',
    },
    {
      id: newPageId(),
      type: 'interrogazioni',
      useTemplate: true,
      postura: 'piedi',
    },
    {
      id: newPageId(),
      type: 'consenso',
      forma: 'dichiarativo',
      postura: 'piedi',
    },
    {
      id: newPageId(),
      type: 'anelli',
      useTemplate: true,
      postura: 'piedi',
    },
    {
      id: newPageId(),
      type: 'preghiere-fedeli',
      intenzioni: [
        'Per gli sposi, perché custodiscano la promessa di amore.',
        'Per le famiglie, perché siano luogo di accoglienza.',
      ],
      ritornello: 'Ascoltaci, Signore.',
      postura: 'piedi',
    },
    {
      id: newPageId(),
      type: 'padre-nostro',
      postura: 'piedi',
    },
    {
      id: newPageId(),
      type: 'benedizione-nuziale',
      formulaId: 'ben-85',
      useTemplate: true,
      postura: 'piedi',
    },
    // {
    //   id: newPageId(),
    //   type: 'canto',
    //   momento: 'Canto finale',
    //   titolo: '',
    //   postura: 'piedi',
    // },
    {
      id: newPageId(),
      type: 'ringraziamenti',
      testo: 'Grazie di cuore per aver condiviso con noi questo giorno speciale.',
    },
  ];
}

export function createDefaultLibretto(
  variant: LibrettoVariant = 'con-messa',
  spouses: { sposo1?: string; sposo2?: string; data?: string; chiesa?: string } = {}
): LibrettoData {
  return {
    variant,
    cover: {
      sposo1: spouses.sposo1 || '',
      sposo2: spouses.sposo2 || '',
      data: spouses.data || '',
      chiesa: spouses.chiesa || '',
      fraseIniziale: '',
    },
    pages: variant === 'con-messa' ? defaultPagesConMessa() : defaultPagesSenzaMessa(),
    style: {
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Inter',
      // accentColor non settato: il widget cade sul `theme.accent` dell'evento,
      // così il default è coerente con il branding (libretto/tableau/payment/map
      // usano tutti lo stesso accent finché l'utente non lo cambia esplicitamente).
      decoroStyle: 'classico',
      pageBgColor: '#fffdf7',
    },
  };
}

/**
 * Migra librettì vecchi al nuovo schema.
 *
 * Cambiamenti applicati:
 * 1. Rimuove pagine `intro` placeholder usate come separator di sezione
 *    ("Liturgia della Parola", "Liturgia del Matrimonio", "Liturgia
 *    Eucaristica") — il TOC le raggruppa già via `sezione`.
 * 2. Aggiorna il testo della pagina `intro` "Riti di Introduzione" se
 *    contiene il vecchio placeholder generico al saluto liturgico CEI
 *    (dialogo Sac/Tutti). Solo se il testo è ancora il default vecchio.
 *
 * Idempotente: applicare più volte non altera il risultato.
 */
const OLD_RITI_INTRO_TEXT = 'Nel nome del Padre e del Figlio e dello Spirito Santo. La grazia del Signore nostro Gesù Cristo, l\'amore di Dio Padre e la comunione dello Spirito Santo siano con tutti voi.';
const NEW_RITI_INTRO_TEXT = 'Sac: Nel nome del Padre e del Figlio e dello Spirito Santo.\nTutti: Amen.\n\nSac: Il Signore che guida i nostri cuori nell\'amore e nella pazienza di Cristo, sia con tutti voi.\nTutti: E con il tuo spirito.';

const PLACEHOLDER_INTRO_TITLES = new Set([
  'Liturgia della Parola',
  'Liturgia del Matrimonio',
  'Liturgia Eucaristica',
]);

export function migrateLibretto(data: LibrettoData): LibrettoData {
  let changed = false;
  // Migration: rimuove il vecchio default hardcoded '#14b8a6' (turchese)
  // su style.accentColor — non corrispondeva al theme.accent dell'evento.
  // Undefined = fallback al theme.accent dal LibrettoWidget.
  let style = data.style;
  if (style.accentColor === '#14b8a6') {
    const { accentColor: _drop, ...rest } = style;
    style = rest;
    changed = true;
  }
  const pages = data.pages
    .filter((p) => {
      if (p.type !== 'intro') return true;
      // Drop solo placeholder con titolo di sezione standard E testo vuoto
      // o di placeholder noto. Se l'utente ha aggiunto contenuto, KEEP.
      if (!PLACEHOLDER_INTRO_TITLES.has(p.titolo)) return true;
      const text = (p.testo || '').trim();
      if (text === '' || text === 'Ascoltiamo con cuore aperto la Parola di Dio.') {
        changed = true;
        return false;
      }
      return true;
    })
    .map((p) => {
      if (p.type === 'intro' && p.titolo === 'Riti di Introduzione' && p.testo === OLD_RITI_INTRO_TEXT) {
        changed = true;
        return { ...p, testo: NEW_RITI_INTRO_TEXT };
      }
      return p;
    });

  return changed ? { ...data, pages, style } : data;
}

export function newPage(type: LibrettoPage['type']): LibrettoPage {
  const base = { id: newPageId() };
  switch (type) {
    case 'cover': return { ...base, type: 'cover' };
    case 'intro': return { ...base, type: 'intro', titolo: '', testo: '' };
    case 'lettura': return { ...base, type: 'lettura', postura: 'seduti' };
    case 'salmo': return { ...base, type: 'salmo', postura: 'seduti' };
    case 'vangelo': return { ...base, type: 'vangelo', postura: 'piedi' };
    case 'canto': return { ...base, type: 'canto', momento: 'Canto', titolo: '' };
    case 'interrogazioni': return { ...base, type: 'interrogazioni', useTemplate: true, postura: 'piedi' };
    case 'consenso': return { ...base, type: 'consenso', forma: 'dichiarativo', postura: 'piedi' };
    case 'anelli': return { ...base, type: 'anelli', useTemplate: true, postura: 'piedi' };
    case 'preghiere-fedeli': return { ...base, type: 'preghiere-fedeli', intenzioni: [''], ritornello: 'Ascoltaci, Signore.', postura: 'piedi' };
    case 'padre-nostro': return { ...base, type: 'padre-nostro', postura: 'piedi' };
    case 'benedizione-nuziale': return { ...base, type: 'benedizione-nuziale', formulaId: 'ben-85', useTemplate: true, postura: 'piedi' };
    case 'dedica': return { ...base, type: 'dedica', titolo: 'Un pensiero per...', testo: '' };
    case 'ringraziamenti': return { ...base, type: 'ringraziamenti', testo: '' };
    case 'photo': return { ...base, type: 'photo', url: '', caption: '' };
    case 'custom': return { ...base, type: 'custom', titolo: '', testo: '' };
    // Nuovi tipi standardLiturgicalPage: tutti default useTemplate=true
    case 'memoria-battesimo': return { ...base, type: 'memoria-battesimo', useTemplate: true, postura: 'piedi' };
    case 'gloria': return { ...base, type: 'gloria', useTemplate: true, postura: 'piedi' };
    case 'colletta': return { ...base, type: 'colletta', useTemplate: true, postura: 'piedi' };
    case 'litanie-santi': return { ...base, type: 'litanie-santi', useTemplate: true, postura: 'piedi' };
    case 'orazione-offerte': return { ...base, type: 'orazione-offerte', useTemplate: true, postura: 'piedi' };
    case 'rito-pace': return { ...base, type: 'rito-pace', useTemplate: true, postura: 'piedi' };
    case 'agnello-dio': return { ...base, type: 'agnello-dio', useTemplate: true, postura: 'ginocchio' };
    case 'orazione-comunione': return { ...base, type: 'orazione-comunione', useTemplate: true, postura: 'piedi' };
    case 'riti-conclusione': return { ...base, type: 'riti-conclusione', useTemplate: true, formulaId: 'fin-1', postura: 'piedi' };
    case 'atto-matrimonio-civile': return { ...base, type: 'atto-matrimonio-civile', useTemplate: true, postura: 'seduti' };
    case 'dedica-iniziale': return { ...base, type: 'dedica-iniziale', citazione: '', autore: '' };
    case 'racconto': return { ...base, type: 'racconto', titolo: '', testo: '' };
    case 'indice': return { ...base, type: 'indice', profondita: 'macro', mostraNumeri: true };
  }
}
