/**
 * Libretto sfogliabile con animazione page-flip 3D realistica.
 *
 * Approccio (no librerie esterne):
 * - Sotto: due pagine "ferme" che mostrano lo stato CORRENTE (left/right).
 * - Sopra (durante un flip): una `FlippingPage` con due facce (front/back) che
 *   ruota intorno all'asse di rilegatura — `transformOrigin: 'left center'` per
 *   sfogliare in avanti, `'right center'` per sfogliare indietro.
 * - Le facce sono disposte con `backface-visibility: hidden` + back ruotata di
 *   180° in modo che durante la rotazione si rivelino correttamente.
 * - Sotto il flip mettiamo già parte dello stato successivo, così quando la
 *   pagina si solleva si rivela la pagina sottostante (effetto libro vero).
 *
 * Mobile (single page): swipe orizzontale + flip 3D a tutta pagina.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, animate as fmAnimate } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LibrettoData, LibrettoPage } from '../../../../../utils/libretto/types';
import { expandPaginated } from '../../../../../utils/libretto/paginate';
import LibrettoPageRenderer, { PageScaleContext } from './LibrettoPageRenderer';

interface Props {
  libretto: LibrettoData;
  /** Larghezza ottimale del contenitore. */
  maxWidth?: number | undefined;
  /** Forza modalità mobile (mobile preview nell'editor desktop). */
  forceMobile?: boolean | undefined;
}

const FLIP_DURATION = 0.7; // secondi

/* ─────────────────────────────────────────────────────────────────────────
 * PageSlot — hoisted a livello modulo (CRITICAL: se definito inline dentro
 * LibrettoBooklet React lo vedrebbe come componente nuovo ad ogni re-render
 * del parent → unmount/remount di TUTTI i PageSlot a ogni cambio di stato →
 * scatto visibile durante i flip). React.memo blocca re-render quando le
 * props sono shallow-equal.
 * ──────────────────────────────────────────────────────────────────────── */
const PageSlot: React.FC<{
  page: LibrettoPage | undefined;
  idx: number;
  side: 'left' | 'right' | 'single';
  bg: string;
  libretto: LibrettoData;
  totalPages: number;
  pageScale?: number;
}> = React.memo(({ page, idx, side, bg, libretto, totalPages, pageScale }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: bg,
      position: 'relative',
      boxShadow:
        side === 'left'
          ? 'inset -8px 0 12px -8px rgba(0,0,0,0.18)'
          : side === 'right'
            ? 'inset 8px 0 12px -8px rgba(0,0,0,0.18)'
            : '0 4px 12px rgba(0,0,0,0.08)',
    }}
  >
    <PageScaleContext.Provider value={pageScale ?? null}>
    {page ? (
      <LibrettoPageRenderer
        page={page}
        libretto={libretto}
        pageIndex={idx}
        totalPages={totalPages}
      />
    ) : (
      <div
        style={{
          width: '100%', height: '100%', background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#bbb', fontStyle: 'italic', fontSize: '13px',
        }}
        data-blank-reason={idx >= totalPages ? 'fine' : 'inside-cover'}
      >
        {idx >= totalPages ? 'Fine' : ''}
      </div>
    )}
    </PageScaleContext.Provider>
  </div>
));
PageSlot.displayName = 'PageSlot';

// Dimensioni nominali della pagina interna (usate da LibrettoPageRenderer).
// Sincronizzato con NOMINAL_WIDTH/HEIGHT del Frame in LibrettoPageRenderer.
const PAGE_NOMINAL_WIDTH = 420;

const LibrettoBooklet: React.FC<Props> = ({ libretto, maxWidth = 800, forceMobile = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Scale stabile della pagina, calcolato dal container booklet (NON dai
  // singoli Frame): durante il flip 3D la width visiva dei Frame può
  // fluttuare via ResizeObserver causando "vibrazione" del content. Misurando
  // sul container esterno (che non ruota) lo scale resta costante.
  const [pageScale, setPageScale] = useState(1);

  // displayedIdx = indice della pagina SINISTRA mostrata in fondo. In mobile è
  // direttamente la pagina visibile (single column).
  const [displayedIdx, setDisplayedIdx] = useState(0);
  // Stato di un flip in corso: dir=1 (forward) o dir=-1 (backward), toIdx target.
  const [flipping, setFlipping] = useState<{ dir: 1 | -1; toIdx: number } | null>(null);
  // Libro chiuso (desktop only): all'inizio mostra solo la copertina come pagina
  // singola — come un libro vero appoggiato sul tavolo. Si "apre" al primo
  // click "Avanti" rivelando lo spread cover+pagina1. Al primo "Indietro" da
  // displayedIdx=0 il libro si richiude.
  const [bookOpen, setBookOpen] = useState(false);

  // Cover-flip animation: gestita interamente da framer-motion via animate
  // sui valori derivati da bookOpen. Niente render-tree separato per la
  // transizione → niente boundary glitch tra chiuso/aperto. `coverAnimating`
  // serve solo a bloccare doppio-click durante l'animazione.
  const [coverAnimating, setCoverAnimating] = useState(false);
  const COVER_FLIP_MS = 700;

  // contentIdx: laggato di 1 frame rispetto a displayedIdx. Usato per il
  // contenuto dei flippers always-mounted. Il lag fa sì che il content update
  // (= PageSlot re-render con nuove pagine, lavoro pesante) avvenga DOPO la
  // fine del flip, quando i flippers sono già invisibili → niente
  // main-thread blocking durante l'animazione.
  const [contentIdx, setContentIdx] = useState(0);
  useEffect(() => {
    if (!flipping) setContentIdx(displayedIdx);
  }, [flipping, displayedIdx]);

  // Motion values per rotateY: controllo esplicito tramite fmAnimate() invece
  // di animate dichiarativo. Evita race conditions con `transition.duration`
  // dinamica durante rapid clicks (con il dichiarativo, framer-motion poteva
  // talvolta usare la vecchia duration=0 della snap → animazione skippata).
  const fwdRotateY = useMotionValue(0);
  const bwdRotateY = useMotionValue(0);

  // Trigger animazioni esplicite quando flipping cambia.
  useEffect(() => {
    if (!flipping) {
      // Idle state: reset entrambi a 0. Set istantaneo (no animazione).
      fwdRotateY.set(0);
      bwdRotateY.set(0);
      return;
    }
    if (flipping.dir === 1) {
      // Forward flip: animate fwd da 0 a -180 deterministicamente.
      fwdRotateY.set(0); // explicit start (anche se già 0, ridondante per safety)
      const controls = fmAnimate(fwdRotateY, -180, {
        duration: FLIP_DURATION,
        ease: [0.42, 0, 0.58, 1],
      });
      const toIdx = flipping.toIdx;
      controls.then(() => {
        // onFlipComplete inline per evitare stale closure su flipping.
        setDisplayedIdx(toIdx);
        requestAnimationFrame(() => {
          setFlipping((prev) => (prev ? null : prev));
        });
      });
      return () => { controls.stop(); };
    } else {
      // Backward flip
      bwdRotateY.set(0);
      const controls = fmAnimate(bwdRotateY, 180, {
        duration: FLIP_DURATION,
        ease: [0.42, 0, 0.58, 1],
      });
      const toIdx = flipping.toIdx;
      controls.then(() => {
        setDisplayedIdx(toIdx);
        requestAnimationFrame(() => {
          setFlipping((prev) => (prev ? null : prev));
        });
      });
      return () => { controls.stop(); };
    }
  }, [flipping, fwdRotateY, bwdRotateY]);

  // Drag-to-flip rimosso: l'animazione era glitchata e turnava 2 pagine per
  // volta. Navigazione resta su BookletControls + tasti freccia + swipe touch.

  // Espande le pagine paginate (slice) in flat list. Per i testi lunghi
  // (es. Memoria del Battesimo che si divide in 2 slice) ogni slice diventa
  // una "pagina vera" dello sfogliabile, così la public view non salta i
  // chunk continuation. Memoizzato sui campi che impattano lo splitting.
  const paginatedPages = useMemo(
    () => expandPaginated(libretto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [libretto.pages, libretto.cover.sposo1, libretto.cover.sposo2],
  );

  const totalPages = paginatedPages.length;
  const step = isMobile ? 1 : 2;

  // Rilevamento mobile via ResizeObserver per supportare resize editor preview.
  // Guard funzionale: aggiorna `isMobile` solo se il valore cambia davvero,
  // così micro-fluttuazioni di layout (hover, re-render parent) non causano
  // re-render a cascata né flicker dell'aspect-ratio del booklet.
  useEffect(() => {
    if (forceMobile) {
      setIsMobile((prev) => (prev === true ? prev : true));
      return;
    }
    const update = () => {
      const w = containerRef.current?.offsetWidth || window.innerWidth;
      const next = w < 720;
      setIsMobile((prev) => (prev === next ? prev : next));
      // Page scale: pagina = metà del booklet (desktop) o tutto il container
      // (mobile single-page). Updated solo qui (container resize utente), MAI
      // durante un flip → niente fluttuazioni del content.
      const slotW = next ? w : w / 2;
      const nextScale = slotW / PAGE_NOMINAL_WIDTH;
      setPageScale((prev) => Math.abs(prev - nextScale) > 0.004 ? nextScale : prev);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [forceMobile]);

  // Su desktop chiuso: si può solo andare avanti (apre il libro) e back è disabilitato.
  // Su desktop aperto a displayedIdx=0: back chiude il libro invece di flippare.
  const closedDesktop = !isMobile && !bookOpen;
  const canGoBack = closedDesktop ? false : (displayedIdx > 0 || (!isMobile && bookOpen)) && !flipping && !coverAnimating;
  const canGoForward = closedDesktop
    ? !flipping && !coverAnimating
    : displayedIdx + step < totalPages && !flipping && !coverAnimating;

  const goForward = () => {
    if (flipping || coverAnimating) return;
    // Guard: contentIdx non ancora sincronizzato (lag 1 frame post-flip).
    // Senza questo, un click ravvicinato al precedente flip user-erebbe
    // contenuto stale per il flipping element → wrong page visible.
    if (contentIdx !== displayedIdx) return;
    // Desktop chiuso → apre il libro: framer-motion anima x + clip-path +
    // cover.rotateY automaticamente quando bookOpen flip a true.
    if (closedDesktop) {
      setBookOpen(true);
      setCoverAnimating(true);
      window.setTimeout(() => setCoverAnimating(false), COVER_FLIP_MS);
      return;
    }
    if (!canGoForward) return;
    const newIdx = Math.min(displayedIdx + step, totalPages - 1);
    if (newIdx === displayedIdx) return;
    setFlipping({ dir: 1, toIdx: newIdx });
  };

  const goBack = () => {
    if (flipping || coverAnimating) return;
    if (contentIdx !== displayedIdx) return;
    // Desktop aperto a pagina 0 → chiude il libro: bookOpen=false innesca
    // animazione inversa via framer-motion.
    if (!isMobile && bookOpen && displayedIdx === 0) {
      setBookOpen(false);
      setCoverAnimating(true);
      window.setTimeout(() => setCoverAnimating(false), COVER_FLIP_MS);
      return;
    }
    if (!canGoBack) return;
    const newIdx = Math.max(displayedIdx - step, 0);
    if (newIdx === displayedIdx) return;
    setFlipping({ dir: -1, toIdx: newIdx });
  };

  const onFlipComplete = () => {
    if (!flipping) return;
    // Strategia per evitare glitch end-of-flip: aggiorniamo subito displayedIdx
    // (così le PageSlot underneath iniziano il re-render con le pagine NEW),
    // ma deferiamo lo smontaggio del flipping element di 1 frame via rAF.
    // Durante questo frame il flipping element resta visibile a ±180° con la
    // back face mostrando la pagina che è appena "atterrata" — esattamente la
    // stessa pagina che l'underneath sta renderizzando sotto. Quando rAF fire,
    // l'underneath è già pronto, lo smontaggio del flipping element rivela
    // contenuto identico → niente flash di pagina vecchia / nuova.
    setDisplayedIdx(flipping.toIdx);
    requestAnimationFrame(() => {
      setFlipping((prev) => (prev ? null : prev));
    });
  };

  // Tasti freccia desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') goForward();
      if (e.key === 'ArrowLeft') goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedIdx, flipping, totalPages, isMobile]);

  // Swipe touch su mobile
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goForward();
      else goBack();
    }
    touchStart.current = null;
  };

  const accent = libretto.style.accentColor || '#1ABC9C';
  const bg = libretto.style.pageBgColor || '#fffdf7';

  // Aspect ratio: desktop = due pagine A5 affiancate (1.4), mobile = singola A5 portrait (0.7).
  const aspectRatio = isMobile ? 0.7 : 1.4;

  // Indici delle pagine "sotto" (fondo statico). Durante un flip mostriamo già
  // parte dello stato successivo per dare l'illusione di "rivelare" la pagina
  // sottostante quando quella sopra si solleva.
  const underLeftIdx = !flipping
    ? displayedIdx
    : flipping.dir === -1
      ? flipping.toIdx
      : displayedIdx;

  const underRightIdx = !flipping
    ? displayedIdx + 1
    : flipping.dir === 1
      ? flipping.toIdx + 1
      : displayedIdx + 1;

  // Indici delle facce della pagina che sta volando
  const flipFrontIdx = !flipping
    ? -1
    : flipping.dir === 1
      ? displayedIdx + 1   // forward: front = vecchia destra
      : displayedIdx;       // backward: front = vecchia sinistra

  const flipBackIdx = !flipping
    ? -1
    : flipping.dir === 1
      ? flipping.toIdx     // forward: back = nuova sinistra
      : flipping.toIdx + 1; // backward: back = nuova destra

  const safeGet = (i: number): LibrettoPage | undefined => paginatedPages[i];
  /**
   * `getSpreadLeft(idx)`: come `safeGet` ma restituisce `undefined` quando
   * `idx === 0` mentre il libro è aperto. Pages[0] è la copertina e nello
   * spread aperto la sua faccia interna è una pagina BIANCA — non vogliamo
   * ripetere la copertina dentro al libretto. Tutti gli altri indici si
   * comportano normalmente.
   */
  const getSpreadLeft = (i: number): LibrettoPage | undefined =>
    bookOpen && i === 0 ? undefined : paginatedPages[i];

  const underLeft = getSpreadLeft(underLeftIdx);
  const underRight = safeGet(underRightIdx);
  const flipFront = safeGet(flipFrontIdx);
  // flipBack diventa la pagina sinistra dello spread successivo: se è idx=0
  // con libro aperto, è il retro-bianco della copertina.
  const flipBack = getSpreadLeft(flipBackIdx);

  // Helper per renderizzare un PageSlot con i parametri di contesto.
  // PageSlot vero è hoisted a livello modulo (vedi sotto) per stabilità di
  // identity React → niente unmount/remount sui re-render del parent.
  const slot = (page: LibrettoPage | undefined, idx: number, side: 'left' | 'right' | 'single') => (
    <PageSlot page={page} idx={idx} side={side} bg={bg} libretto={libretto} totalPages={totalPages} pageScale={pageScale} />
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Mobile: single-page flip
   * ─────────────────────────────────────────────────────────────────── */

  if (isMobile) {
    // In mobile la pagina visibile è displayedIdx. Durante un flip la pagina
    // ruota a tutta pagina (transformOrigin asse della direzione del flip).
    const isForward = flipping?.dir === 1;
    const flipOrigin = isForward ? 'left center' : 'right center';
    const flipTo = isForward ? -180 : 180;

    return (
      <div
        ref={containerRef}
        style={{ width: '100%', maxWidth: `${maxWidth}px`, margin: '0 auto', userSelect: 'none' }}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            width: '100%',
            aspectRatio: `${aspectRatio}`,
            position: 'relative',
            perspective: '2200px',
          }}
        >
          {/* SOTTO: pagina che si rivelerà a fine flip (toIdx). Se non flippa, mostra current. */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '6px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}>
            {slot(safeGet(flipping ? flipping.toIdx : displayedIdx), flipping ? flipping.toIdx : displayedIdx, 'single')}
          </div>

          {/* FLIPPING: pagina che si solleva (sopra). Su mobile flip pieno. */}
          {flipping && (
            <motion.div
              key={`flip-${displayedIdx}-${flipping.toIdx}`}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: flipTo }}
              transition={{ duration: FLIP_DURATION, ease: [0.42, 0, 0.58, 1] }}
              onAnimationComplete={onFlipComplete}
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                transformOrigin: flipOrigin,
                zIndex: 10,
                borderRadius: '6px',
              }}
            >
              {/* Front */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  borderRadius: '6px', overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                }}
              >
                {slot(flipFront, flipFrontIdx, 'single')}
              </div>
              {/* Back (ruotata di 180° per essere visibile dall'altra parte) */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: '6px', overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                }}
              >
                {slot(flipBack, flipBackIdx, 'single')}
              </div>
            </motion.div>
          )}
        </div>

        <BookletControls
          accent={accent}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          currentLabel={`${Math.min(displayedIdx + 1, totalPages)} / ${totalPages}`}
          onBack={goBack}
          onForward={goForward}
        />
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────
   * Desktop UNIFICATO (chiuso + aperto + transizione): un singolo render-tree
   * con il container 2-pagine sempre presente. framer-motion anima:
   *  1. Container `x` (-25% ↔ 0): chiuso ha la cover sulla colonna destra
   *     centrata; aperto ha lo spread intero centrato. Delta = W/2 ⇒
   *     traduzione apparente verso destra durante l'apertura.
   *  2. Container `clipPath` (inset(0 0 0 50%) ↔ inset(0)): chiuso clippa la
   *     metà sinistra (utente non vede colonna sinistra, solo cover); aperto
   *     mostra tutto.
   *  3. Cover overlay `rotateY` (0 ↔ -180): ruota attorno al dorso (= bordo
   *     sinistro della cover). 0 = front face visibile a destra (chiuso);
   *     -180 = back face visibile a sinistra (aperto, lying flat).
   *
   * Niente render-tree separato per le transizioni → niente boundary glitch
   * (= niente piccolo scatto verticale, niente fade indice). Tutto è una
   * sola motion.div che cambia stato fluidamente.
   * ─────────────────────────────────────────────────────────────────── */

  const dur = COVER_FLIP_MS / 1000;
  const easeBezier: [number, number, number, number] = [0.42, 0, 0.58, 1];

  // Cover overlay rendered solo se siamo "in zona cover" (idx=0 oppure flip
  // in corso che parte/arriva a 0). Rotazione driven da bookOpen.
  const showCoverOverlay = !isMobile && (
    displayedIdx === 0 ||
    (flipping !== null && (flipping.toIdx === 0 || displayedIdx === 0))
  );

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', maxWidth: `${maxWidth}px`, margin: '0 auto', userSelect: 'none' }}
    >
      {/* Wrapper di clipping ESTERNO al container 3D: overflow:hidden qui
          assorbe le proiezioni 3D durante i flip senza interferire col
          rendering preserve-3d. Padding ai 4 lati per dare spazio alla
          box-shadow del libretto (prima si vedeva un taglio brutto a sx
          della pagina sinistra perché overflow:hidden clippava l'ombra). */}
      <div style={{
        overflow: 'hidden',
        padding: '40px 40px 80px',
        margin: '-40px -40px -80px',
      }}>
      <motion.div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        animate={{
          // x: -25% chiuso (cover su col destra al centro schermo); 0 aperto.
          x: closedDesktop ? '-25%' : '0%',
        }}
        transition={{ duration: dur, ease: easeBezier }}
        style={{
          width: '100%',
          aspectRatio: `${aspectRatio}`,
          position: 'relative',
          perspective: '2200px',
          background: 'transparent',
          // Ombra più contenuta: prima 0 24 60 sforava di 60px e veniva
          // clippata dal parent (EventPublic section ha overflow: hidden),
          // dando l'effetto di "ombra tagliata". 0 8 24 sta dentro al margin
          // del wrapper di clipping ed è comunque elegante.
          boxShadow: closedDesktop ? 'none' : '0 8px 24px rgba(0,0,0,0.12)',
          borderRadius: '4px',
        }}
      >
        {/* SOTTO: due pagine fisse — durante un flip mostrano già parte dello
            stato successivo (la pagina sottostante che viene "rivelata"). */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          {/* Colonna sinistra: opacity controlled via CSS (no motion.div per
              evitare overhead framer-motion durante i flip interni). Step-
              function al midpoint del cover-flip via transition-delay. */}
          <div
            style={{
              width: '100%', height: '100%',
              opacity: closedDesktop ? 0 : 1,
              transition: closedDesktop
                ? 'opacity 0s 0s'
                : `opacity 0s ${dur * 0.5}s`,
            }}
          >
            {slot(underLeft, underLeftIdx, 'left')}
          </div>
          {slot(underRight, underRightIdx, 'right')}
        </div>

        {/* Linea di rilegatura sottile (decorativa) */}
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%',
            width: '2px', transform: 'translateX(-50%)',
            background: `linear-gradient(to right, transparent, ${accent}30, transparent)`,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* COVER OVERLAY — copertina vera (front face) + back-of-cover blank.
            Ruota attorno al dorso quando bookOpen toggles, framer-motion
            anima fluidamente. zIndex 8 < flipping (10) per non intralciare i
            page-flip interni. */}
        {showCoverOverlay && (
          <motion.div
            key="cover-overlay"
            initial={false}
            animate={{ rotateY: bookOpen ? -180 : 0 }}
            transition={{ duration: dur, ease: easeBezier }}
            style={{
              position: 'absolute',
              top: 0, bottom: 0,
              left: '50%', right: 0,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              zIndex: 8,
              willChange: 'transform',
              cursor: closedDesktop ? 'pointer' : 'default',
            }}
            onClick={closedDesktop ? goForward : undefined}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              overflow: 'hidden',
              borderRadius: '4px 8px 8px 4px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.22), inset 6px 0 12px -6px rgba(0,0,0,0.18)',
            }}>
              {slot(safeGet(0), 0, 'single')}
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              overflow: 'hidden',
              background: bg,
              borderRadius: '8px 4px 4px 8px',
              boxShadow: 'inset -8px 0 12px -8px rgba(0,0,0,0.12)',
            }} />
          </motion.div>
        )}

        {/* FLIPPING PAGES — DUE motion.div sempre montati, contenuto basato
            su `contentIdx` (laggato di 1 frame rispetto a displayedIdx).
            Pre-mount evita il mount delay al click (fix glitch START side).
            Content lag evita PageSlot re-render durante l'animazione (fix
            glitch END side della 2-flipper version precedente). */}
        {(() => {
          const fwdFrontIdx = contentIdx + 1;
          const fwdBackIdx = contentIdx + 2;
          const bwdFrontIdx = contentIdx;
          const bwdBackIdx = contentIdx - 1;
          const fwdFront = safeGet(fwdFrontIdx);
          const fwdBack = bookOpen && fwdBackIdx === 0 ? undefined : safeGet(fwdBackIdx);
          const bwdFront = bookOpen && bwdFrontIdx === 0 ? undefined : safeGet(bwdFrontIdx);
          const bwdBack = safeGet(bwdBackIdx);
          const isFwd = flipping?.dir === 1;
          const isBwd = flipping?.dir === -1;
          return (
            <>
              {/* FORWARD flipper — colonna destra, ruota 0 ↔ -180. */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0,
                  left: '50%', right: 0,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  zIndex: 10,
                  willChange: 'transform',
                  pointerEvents: 'none',
                  rotateY: fwdRotateY,
                  opacity: isFwd ? 1 : 0,
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  overflow: 'hidden',
                  background: bg,
                }}>
                  {slot(fwdFront, fwdFrontIdx, 'right')}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(0,0,0,0) 70%, rgba(0,0,0,0.08))',
                    pointerEvents: 'none',
                  }} />
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  overflow: 'hidden',
                  background: bg,
                }}>
                  {slot(fwdBack, fwdBackIdx, 'left')}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to left, rgba(0,0,0,0) 70%, rgba(0,0,0,0.08))',
                    pointerEvents: 'none',
                  }} />
                </div>
              </motion.div>

              {/* BACKWARD flipper — colonna sinistra, ruota 0 ↔ 180. */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0,
                  left: 0, right: '50%',
                  transformOrigin: 'right center',
                  transformStyle: 'preserve-3d',
                  zIndex: 10,
                  willChange: 'transform',
                  pointerEvents: 'none',
                  rotateY: bwdRotateY,
                  opacity: isBwd ? 1 : 0,
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  overflow: 'hidden',
                  background: bg,
                }}>
                  {slot(bwdFront, bwdFrontIdx, 'left')}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to left, rgba(0,0,0,0) 70%, rgba(0,0,0,0.08))',
                    pointerEvents: 'none',
                  }} />
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  overflow: 'hidden',
                  background: bg,
                }}>
                  {slot(bwdBack, bwdBackIdx, 'right')}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(0,0,0,0) 70%, rgba(0,0,0,0.08))',
                    pointerEvents: 'none',
                  }} />
                </div>
              </motion.div>
            </>
          );
        })()}

      </motion.div>
      </div>

      <BookletControls
        accent={accent}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        currentLabel={closedDesktop ? 'Chiuso' : `${Math.min(displayedIdx + 1, totalPages)} / ${totalPages}`}
        onBack={goBack}
        onForward={goForward}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 * Controlli sotto al booklet (livello modulo per soddisfare lint)
 * ──────────────────────────────────────────────────────────────────────── */

const BookletControls: React.FC<{
  accent: string;
  canGoBack: boolean;
  canGoForward: boolean;
  currentLabel: string;
  onBack: () => void;
  onForward: () => void;
}> = ({ accent, canGoBack, canGoForward, currentLabel, onBack, onForward }) => (
  <div
    style={{
      marginTop: '16px',
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
      fontSize: '12px', color: '#888',
    }}
  >
    <button
      onClick={onBack}
      disabled={!canGoBack}
      style={{
        background: 'transparent', border: 'none',
        color: canGoBack ? accent : '#ccc',
        cursor: canGoBack ? 'pointer' : 'default',
        padding: '4px 8px', fontSize: '12px',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}
    >
      <ChevronLeft size={14} /> Indietro
    </button>
    <span style={{ minWidth: '60px', textAlign: 'center' }}>{currentLabel}</span>
    <button
      onClick={onForward}
      disabled={!canGoForward}
      style={{
        background: 'transparent', border: 'none',
        color: canGoForward ? accent : '#ccc',
        cursor: canGoForward ? 'pointer' : 'default',
        padding: '4px 8px', fontSize: '12px',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}
    >
      Avanti <ChevronRight size={14} />
    </button>
  </div>
);

// React.memo: blocca re-render quando parent cambia ma props del booklet
// sono shallow-equal (es. hover state nell'editor che muove il mouse tra
// canvas e sidebar). Riduce glitch visivi.
export default React.memo(LibrettoBooklet);
