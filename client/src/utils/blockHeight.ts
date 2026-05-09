import type { Block } from "../types/editor";

/** Altezza logica minima consigliata per tipo (canvas editor 1000px largo).
 *  Aumentate dopo che il form RSVP è cresciuto (multi-guest names + allergie
 *  per persona) — 600px tagliava il bottone "Invia Conferma" su eventi
 *  appena creati. */
export const DEFAULT_BLOCK_HEIGHT: Record<string, number> = {
  map: 560,
  rsvp: 820,
  gallery: 660,
  video: 700,
  payment: 760,
  photo: 480,
  custom: 480,
  canvas: 480,
  tableau: 720,
  libretto: 980,
};

const LEGACY_FALLBACKS = [400, 600];

/**
 * Risolve l'altezza logica della sezione per l'editor (desktop/mobile preview).
 * - Se mancante: default per tipo.
 * - Se è il vecchio default universale 400px su blocchi "ricchi", alza al minimo tipo
 *   (evita mappa/RSVP/regali tagliati nei template vecchi).
 */
export function resolveBlockHeight(block: Pick<Block, "type" | "height">): number {
  const t = block.type || "custom";
  const minH = DEFAULT_BLOCK_HEIGHT[t] ?? DEFAULT_BLOCK_HEIGHT.custom!;
  const raw = block.height;

  if (typeof raw !== "number" || Number.isNaN(raw) || raw < 100) {
    return minH;
  }

  // Eventi/template salvati con valori legacy troppo bassi vengono alzati al
  // minimo del tipo (evita form/widget tagliati nei salvataggi storici).
  if (LEGACY_FALLBACKS.includes(raw) && ["map", "rsvp", "gallery", "video", "payment"].includes(t)) {
    return Math.max(raw, minH);
  }

  return raw;
}

export function normalizeBlocksForEditor(blocks: Block[] | undefined): Block[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => ({
    ...b,
    height: resolveBlockHeight(b),
  }));
}
