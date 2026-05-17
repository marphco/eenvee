/**
 * Viewer mobile single-page del libretto.
 *
 * Pattern preso dal LibrettoEditorModal (riga ~539-554) — wrapper aspect-ratio
 * + LibrettoPageRenderer diretto + nav prev/next semplici. Niente flip 3D
 * (LibrettoBooklet `forceMobile`) che su mobile soffre di artefatti di scala
 * e clipping del contenuto.
 *
 * Usato:
 * - in LibrettoWidget quando `previewMobile` è true (editor mobile preview)
 * - eventualmente anche nel public mobile (se vogliamo coerenza)
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LibrettoData } from '../../../../../utils/libretto/types';
import LibrettoPageRenderer from './LibrettoPageRenderer';
import { LibrettoPreviewContext } from './LibrettoPreviewContext';

interface Props {
  libretto: LibrettoData;
  maxWidth?: number;
}

const LibrettoMobileViewer: React.FC<Props> = ({ libretto, maxWidth = 360 }) => {
  // Se siamo dentro un LibrettoPreviewProvider (editor mobile), il pageIdx
  // è condiviso con la sidebar — tap chip sidebar e frecce viewer restano in
  // sync. Senza Provider (public standalone) fallback a state interno.
  const previewCtx = React.useContext(LibrettoPreviewContext);
  const [localPageIdx, setLocalPageIdx] = React.useState(0);
  const pageIdx = previewCtx?.pageIdx ?? localPageIdx;
  const setPageIdx = (next: number | ((i: number) => number)) => {
    if (previewCtx) {
      const value = typeof next === 'function' ? next(previewCtx.pageIdx) : next;
      previewCtx.setPageIdx(value);
    } else {
      setLocalPageIdx(next);
    }
  };
  const totalPages = libretto.pages.length;
  // Clamp pageIdx in case the libretto pages array shrinks (delete page) o il
  // context viene inizializzato con un indice rimasto da un libretto diverso.
  const safePageIdx = Math.max(0, Math.min(pageIdx, totalPages - 1));
  const currentPage = libretto.pages[safePageIdx];
  const accent = libretto.style.accentColor || '#1ABC9C';

  if (!currentPage) return null;

  const goPrev = () => setPageIdx(i => Math.max(0, i - 1));
  const goNext = () => setPageIdx(i => Math.min(totalPages - 1, i + 1));

  return (
    <div style={{
      width: '100%',
      // Manteniamo maxWidth pieno (360px) per non rendere il testo della pagina
      // illeggibile. Se il libretto è più alto del canvas disponibile (drawer
      // aperto), l'utente scrolla naturalmente per vedere il resto. Il drawer
      // compatto (45dvh, vedi `.mobile-tab-panel--compact`) garantisce comunque
      // di vedere buona parte della pagina.
      maxWidth,
      margin: '0 auto',
      userSelect: 'none',
    }}>
      {/* Pagina: aspect-ratio 0.72 (A4-ish portrait) + LibrettoPageRenderer dentro.
          Pattern identico al LibrettoEditorModal desktop. */}
      <div style={{
        width: '100%',
        aspectRatio: '0.72',
        background: libretto.style.pageBgColor || '#fffdf7',
        borderRadius: '4px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <LibrettoPageRenderer
          page={currentPage}
          libretto={libretto}
          pageIndex={safePageIdx}
          totalPages={totalPages}
        />
      </div>

      {/* Nav prev/next + counter pagine. Pattern coerente con LibrettoBooklet
          (Indietro / X di Y / Avanti). */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '14px',
        padding: '0 4px',
        gap: '8px',
      }}>
        <button
          type="button"
          onClick={goPrev}
          disabled={safePageIdx === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'transparent',
            border: 'none',
            padding: '8px 4px',
            cursor: safePageIdx === 0 ? 'default' : 'pointer',
            color: safePageIdx === 0 ? 'var(--text-soft)' : accent,
            opacity: safePageIdx === 0 ? 0.4 : 1,
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          <ChevronLeft size={16} />
          Indietro
        </button>

        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-soft)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {safePageIdx + 1} / {totalPages}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={safePageIdx === totalPages - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'transparent',
            border: 'none',
            padding: '8px 4px',
            cursor: safePageIdx === totalPages - 1 ? 'default' : 'pointer',
            color: safePageIdx === totalPages - 1 ? 'var(--text-soft)' : accent,
            opacity: safePageIdx === totalPages - 1 ? 0.4 : 1,
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Avanti
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default LibrettoMobileViewer;
