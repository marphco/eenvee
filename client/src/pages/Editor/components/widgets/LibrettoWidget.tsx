/**
 * Widget Libretto Messa — wrapper paywall + booklet sfogliabile.
 *
 * Pattern identico a TableauWidget:
 * - editor: preview sempre visibile (l'utente deve vedere cosa configura)
 * - public + paywall not paid: overlay "modulo Premium"
 * - public + paid + draft: messaggio "in preparazione"
 * - public + paid + published: booklet pubblico
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import { getAdaptivePalette } from '../../../../utils/colorUtils';
import type { Block } from '../../../../types/editor';
import type { LibrettoData } from '../../../../utils/libretto/types';
import { createDefaultLibretto, migrateLibretto } from '../../../../utils/libretto/templates';
import LibrettoBooklet from './libretto/LibrettoBooklet';
import LibrettoMobileViewer from './libretto/LibrettoMobileViewer';

interface LibrettoWidgetProps {
  block: Block;
  isEditor?: boolean | undefined;
  hasLibrettoAccess?: boolean | undefined;
  onUpdateBlock?: ((blockId: string, updates: Partial<Block>) => void) | undefined;
  accentColor?: string | undefined;
  sectionBg?: string | undefined;
  previewMobile?: boolean | undefined;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

const LibrettoWidget: React.FC<LibrettoWidgetProps> = ({
  block,
  isEditor,
  hasLibrettoAccess = false,
  onUpdateBlock,
  accentColor,
  sectionBg: propSectionBg,
  previewMobile,
}) => {
  // Il libretto è persistito sotto widgetProps.libretto.
  // Se manca (widget appena creato), mostriamo template di fallback.
  // Migration: i librettì creati col vecchio default avevano 3 pagine
  // `intro` placeholder ("Liturgia della Parola/Matrimonio/Eucaristica")
  // che ora rimuoviamo, e un testo "Riti di Introduzione" generico che
  // sostituiamo col saluto liturgico CEI corretto. La migration è
  // idempotente — `migrateLibretto` ritorna lo stesso oggetto se non
  // c'è nulla da modificare.
  const config = block.widgetProps || {};
  const rawLibretto = (config.libretto as LibrettoData) || createDefaultLibretto();
  const libretto: LibrettoData = React.useMemo(
    () => migrateLibretto(rawLibretto),
    [rawLibretto],
  );

  // Persiste la migration se ha effettivamente modificato i dati, così
  // la prossima volta che si apre il widget non ricalcoliamo (e l'utente
  // vede la versione pulita anche dopo refresh / sul booklet pubblico).
  React.useEffect(() => {
    if (!isEditor || !onUpdateBlock || !block.id) return;
    if (libretto === rawLibretto) return; // nessuna modifica
    onUpdateBlock(block.id, {
      widgetProps: { ...(block.widgetProps || {}), libretto },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libretto, rawLibretto]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-resize: la sezione cresce con il contenuto effettivo del booklet
  // (header + booklet aspect-ratio + nav). Misuriamo via ResizeObserver +
  // multiple snapshot a delay crescenti per catturare layout asincroni.
  // Stessa strategia di TableauWidget per coerenza.
  const blockHeightRef = React.useRef(block.height || 980);
  React.useEffect(() => { blockHeightRef.current = block.height || 980; }, [block.height]);

  const measureAndUpdate = React.useCallback(() => {
    if (!isEditor || !onUpdateBlock || !containerRef.current) return;
    const widgetH = containerRef.current.scrollHeight;
    const currentH = blockHeightRef.current;
    const requiredH = Math.max(widgetH + 60, 600);
    if (Math.abs(requiredH - currentH) > 8) {
      const oldH = currentH;
      const oldY = (block.widgetProps as any)?.librettoY;
      blockHeightRef.current = requiredH;
      const updates: any = { height: requiredH };
      if (typeof oldY === 'number' && !isNaN(oldY) && oldH > 0) {
        const newY = (oldY / oldH) * requiredH;
        updates.widgetProps = { ...(block.widgetProps || {}), librettoY: newY };
      }
      onUpdateBlock(block.id!, updates);
    }
  }, [isEditor, onUpdateBlock, block.id, block.widgetProps]);

  React.useEffect(() => {
    if (!isEditor || !onUpdateBlock || !containerRef.current) return;
    const el = containerRef.current;
    let debounceTimer: number | undefined;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(measureAndUpdate, 80);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(debounceTimer);
    };
  }, [isEditor, onUpdateBlock, measureAndUpdate]);

  // Trigger snapshots a 100/350/800ms per catturare cambi pagina + font.
  const pagesSig = libretto.pages.length + ':' + previewMobile;
  React.useEffect(() => {
    if (!isEditor || !onUpdateBlock) return;
    const t1 = window.setTimeout(measureAndUpdate, 100);
    const t2 = window.setTimeout(measureAndUpdate, 350);
    const t3 = window.setTimeout(measureAndUpdate, 800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pagesSig, isEditor, onUpdateBlock, measureAndUpdate]);

  const showPaywall = !isEditor && !hasLibrettoAccess;
  const isDraft = !isEditor && hasLibrettoAccess && !libretto.isPublished;

  // Sanifico libretto.style.accentColor: i libretti creati prima del fix
  // accent-default avevano '#14b8a6' hardcoded che non corrisponde al theme.
  const styleAccent = libretto.style.accentColor === '#14b8a6' ? undefined : libretto.style.accentColor;
  // Default hex tiffany brand (#1ABC9C) per consentire derivazione accent-rgb.
  const accent = accentColor || styleAccent || '#1ABC9C';
  const isHex = accent.startsWith('#');
  const accentRgb = isHex ? hexToRgb(accent) : null;
  const sectionBg = propSectionBg || block.props?.bgColor || block.bgColor || 'transparent';
  const palette = getAdaptivePalette(sectionBg, accent);
  const customStyles = {
    '--accent': accent,
    ...(accentRgb ? { '--accent-rgb': accentRgb } : {}),
    '--text-primary': palette.text,
    '--text-soft': palette.textSoft,
  };

  if (isDraft) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
          background: block.bgColor || 'transparent',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(var(--accent-rgb), 0.1)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            border: '1px dashed var(--accent)',
            ...customStyles as React.CSSProperties,
          }}
        >
          <BookOpen size={32} />
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px', fontFamily: 'var(--font-heading)' }}>
          Libretto della Cerimonia
        </h3>
        <p style={{ maxWidth: '360px', margin: 0, fontSize: '15px', opacity: 0.6, lineHeight: 1.6 }}>
          Il libretto è in fase di ultimazione. Torna a trovarci tra poco per scoprire la cerimonia in
          dettaglio.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="libretto-widget"
      style={{
        ...(customStyles as React.CSSProperties),
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Mobile: padding aggressivo ridotto per dare il massimo spazio alla
        // pagina del libretto sopra il drawer toolbar. Desktop: padding standard.
        padding: previewMobile ? '12px 8px 12px' : '40px 20px 32px',
        color: 'var(--text-primary)',
        minHeight: previewMobile ? '0' : '400px',
        position: 'relative',
      }}
    >
      {showPaywall && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            backdropFilter: 'blur(20px)',
            background: palette.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '28px',
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '28px',
              boxShadow: '0 20px 40px rgba(var(--accent-rgb), 0.3)',
            }}
          >
            <BookOpen size={40} />
          </div>
          <h3
            style={{
              fontSize: '32px',
              fontWeight: 900,
              margin: '0 0 16px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Libretto Messa
          </h3>
          <p style={{ maxWidth: '420px', margin: 0, fontSize: '17px', opacity: 0.8, lineHeight: 1.6 }}>
            Sfoglia il libretto personalizzato della cerimonia. Disponibile con il pacchetto Premium.
          </p>
        </div>
      )}

      {/* Header — pattern allineato al TableauWidget per coerenza visiva
          (var(--font-heading) + fontWeight 800 + letter-spacing 0.02em).
          Mobile: compresso al minimo (titolo piccolo, niente sottotitolo,
          icona ridotta) per lasciare spazio alla pagina del libretto sopra
          il drawer toolbar. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: previewMobile ? '4px' : '10px',
          textAlign: 'center',
          marginBottom: previewMobile ? '10px' : '28px',
        }}
      >
        {!previewMobile && (
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(var(--accent-rgb), 0.1)',
              border: '1px solid rgba(var(--accent-rgb), 0.25)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={24} />
          </div>
        )}
        <h3
          style={{
            fontSize: previewMobile ? '16px' : '32px',
            fontWeight: 800,
            margin: 0,
            fontFamily: 'var(--font-heading, serif)',
            color: 'var(--text-primary)',
            letterSpacing: '0.01em',
            lineHeight: 1.15,
          }}
        >
          Libretto della Cerimonia
        </h3>
        {!previewMobile && (
          <p style={{ fontSize: '14px', opacity: 0.7, margin: 0, maxWidth: '420px' }}>
            Sfoglia le pagine per seguire la celebrazione passo dopo passo.
          </p>
        )}
      </div>

      {/* Mobile (previewMobile=true OR public mobile): viewer single-page
          semplice (pattern LibrettoEditorModal desktop) — aspect-ratio + nav
          prev/next, niente flip 3D. Stabile, no artefatti scala/clipping del
          forceMobile precedente.
          Desktop: LibrettoBooklet a doppia pagina (anteprima sidebar che
          funziona perfettamente). */}
      <div style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>
        {previewMobile ? (
          <LibrettoMobileViewer libretto={libretto} maxWidth={360} />
        ) : (
          <LibrettoBooklet
            libretto={libretto}
            maxWidth={900}
          />
        )}
      </div>
    </div>
  );
};

export default LibrettoWidget;
