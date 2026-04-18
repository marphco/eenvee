/**
 * Utility per gestire contrasto testo/sfondo nei widget di pagina.
 *
 * Perché esiste questo file:
 * I widget (RSVP, Mappa, Galleria, Video) vengono inseriti in sezioni che
 * possono avere colori di sfondo totalmente arbitrari (il creator sceglie
 * bianco per una sezione "clean", nero per una "cinema", pastello per una
 * "romantic"...). Se i testi e le icone sono hardcoded su `#1a1a1a` o su
 * `var(--text-main)` finiamo sempre col tagliare fuori il contrasto su
 * almeno metà dei temi.
 *
 * Qui centralizziamo la logica che storicamente era inline dentro
 * `RSVPWidget.tsx` (normalizeColor + getLuminance + getSafeColor) in modo da:
 *  - riusarla SENZA duplicazione in Map/Gallery/Video;
 *  - evitare drift fra le diverse soglie di luminance ("scuro < 0.6" vs "<0.5");
 *  - avere un unico punto di fix se in futuro vogliamo WCAG-grade (passare da
 *    relative luminance a contrast ratio 4.5:1).
 */

/** Normalizza qualunque stringa colore: null/undefined/transparent → null. */
export function normalizeColor(color?: string | null): string | null {
  if (!color) return null;
  const c = String(color).trim();
  if (!c) return null;
  if (c === 'transparent') return null;
  if (c === 'none') return null;
  return c;
}

/**
 * Relative luminance approssimata (0..1). Usiamo i coefficienti standard BT.709
 * (0.2126 / 0.7152 / 0.0722) senza gamma correction perché il fine è solo una
 * soglia chiaro/scuro, non un contrast ratio WCAG preciso.
 *
 * Accetta:
 *  - `#RGB` / `#RRGGBB` / `#RRGGBBAA`
 *  - `rgb(…)` / `rgba(…)`
 *  - tutto il resto ritorna 0 (trattato come scuro → default white text).
 */
export function getLuminance(color: string): number {
  if (!color) return 0;
  let r = 0, g = 0, b = 0;
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      r = parseInt((hex[0] || '0') + (hex[0] || '0'), 16);
      g = parseInt((hex[1] || '0') + (hex[1] || '0'), 16);
      b = parseInt((hex[2] || '0') + (hex[2] || '0'), 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match && match[1] && match[2] && match[3]) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    }
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Ritorna true se il colore è "percepibilmente scuro". Soglia 0.6: stessa usata
 * storicamente in `RSVPWidget.tsx`, volutamente più alta di 0.5 perché i grigi
 * medi (#888) sul nostro brand si comportano meglio in modalità "dark text".
 */
export function isDarkColor(color?: string | null): boolean {
  const normalized = normalizeColor(color);
  if (!normalized) return false; // trasparente/unset → assumiamo pagina chiara
  return getLuminance(normalized) < 0.6;
}

/**
 * Palette adattiva calcolata una sola volta per widget.
 *
 * @param bgColor       sfondo effettivo (già risolto dalle fallback del widget)
 * @param accentColor   colore brand da preservare (no adattamento, è un vincolo tema)
 */
export interface AdaptivePalette {
  isDark: boolean;
  text: string;          // testo principale (h1/h2/body)
  textSoft: string;      // secondario (descrizioni, hint)
  textMuted: string;     // terziario (caption, etichette)
  border: string;        // bordi leggeri (divider, card outline)
  surface: string;       // card interna (leggero velo sul bg)
  accent: string;        // passa-attraverso per consistenza
}

export function getAdaptivePalette(bgColor?: string | null, accentColor: string = 'var(--accent)'): AdaptivePalette {
  const isDark = isDarkColor(bgColor);
  return {
    isDark,
    text:      isDark ? '#ffffff'                : '#111111',
    textSoft:  isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
    textMuted: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
    border:    isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
    surface:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    accent:    accentColor,
  };
}

/**
 * Risoluzione a cascata del bg effettivo di un blocco, identica a quella
 * storica dentro `RSVPWidget.getSafeColor()`.
 *
 * Ordine di priorità:
 *  1) `sectionBg` esplicita (es. prop passata dall'editor)
 *  2) `block.props.bgColor` (dove la sidebar salva di preferenza)
 *  3) `block.bgColor` (valore sullo schema del blocco)
 *  4) `theme.background` (tema globale)
 *  5) fallback bianco (pagina tipica del browser)
 */
export function resolveBlockBg(args: {
  sectionBg?: string | null | undefined;
  blockPropsBg?: string | null | undefined;
  blockBg?: string | null | undefined;
  themeBg?: string | null | undefined;
}): string {
  const { sectionBg, blockPropsBg, blockBg, themeBg } = args;
  return (
    normalizeColor(sectionBg) ??
    normalizeColor(blockPropsBg) ??
    normalizeColor(blockBg) ??
    normalizeColor(themeBg) ??
    '#ffffff'
  );
}
