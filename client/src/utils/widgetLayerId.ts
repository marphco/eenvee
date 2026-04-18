/**
 * Id "virtuale" del widget dentro un blocco (RSVP, mappa, galleria, video, payment).
 * Un blocco = un solo id, legato a `block.id` — così due sezioni dello stesso tipo
 * non condividono più la selezione (prima era es. sempre `widget-rsvp`).
 */
export function widgetLayerIdForBlock(blockId: string): string {
  return `widget-${blockId}`;
}
