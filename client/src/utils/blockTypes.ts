/**
 * Helper centralizzato per distinguere blocchi "widget" (auto-dimensionati,
 * con contenuto strutturato gestito da un widget interno) da blocchi
 * "canvas" (sezione vuota libera con layer testo/immagine drag&drop).
 *
 * I blocchi widget NON devono essere selezionabili come block-root né
 * accettare nuovi layer testo/immagine: la selezione/editing avviene
 * sul widget interno (`widgetLayerIdForBlock(blockId)`).
 *
 * I blocchi canvas restano free-form: drag&drop layer, aggiungi testo/
 * immagine, outline visibile sul block-root selezionato.
 */

export const WIDGET_BLOCK_TYPES = [
  'rsvp',
  'map',
  'gallery',
  'video',
  'payment',
  'tableau',
  'libretto',
] as const;

export type WidgetBlockType = (typeof WIDGET_BLOCK_TYPES)[number];

/**
 * Ritorna `true` se il blocco è un widget chiuso (no selezione root,
 * no aggiungi testo/immagine, no drag root).
 */
export function isWidgetBlock(blockType: string | undefined | null): boolean {
  if (!blockType) return false;
  return (WIDGET_BLOCK_TYPES as readonly string[]).includes(blockType);
}

/**
 * Inverso di `isWidgetBlock` — il blocco è canvas free-form?
 */
export function isCanvasBlock(blockType: string | undefined | null): boolean {
  return blockType === 'canvas' || (!!blockType && !isWidgetBlock(blockType));
}

/**
 * Vecchi default accent hardcoded che NON sono mai stati una scelta
 * intenziale dell'utente: turchese libretto (#14b8a6), oro payment
 * (#C9A961), nero tableau (#1a1a1a). Trattati come undefined al
 * rendering così che fallback al brand tiffany del progetto.
 *
 * Migrazione "soft": il valore resta nel DB (no write in rendering) ma
 * non viene applicato visivamente. L'utente con scelta intenzionale di
 * uno di questi colori deve ri-selezionarlo dal color picker.
 */
const LEGACY_ACCENT_DEFAULTS = new Set<string>([
  '#14b8a6', // turchese libretto
  '#C9A961', // oro payment
  '#c9a961',
  '#1a1a1a', // nero tableau
  '#1A1A1A',
]);

/**
 * Ritorna `accentColor` salvato se valido (non un vecchio default hardcoded),
 * altrimenti undefined → il caller dovrà mettere `var(--accent)` (tiffany
 * brand del progetto) come fallback finale. Il `themeAccent` dell'evento
 * NON è più considerato fallback: il brand tiffany è il default ovunque.
 */
export function resolveAccentColor(
  widgetAccent: string | undefined | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _themeAccent?: string | undefined | null
): string | undefined {
  if (widgetAccent && !LEGACY_ACCENT_DEFAULTS.has(widgetAccent)) {
    return widgetAccent;
  }
  return undefined;
}
