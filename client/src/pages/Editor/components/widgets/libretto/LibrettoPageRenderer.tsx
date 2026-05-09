/**
 * Renderizza una singola pagina del Libretto Messa.
 * Usato sia in editor preview sia nella public view (sfogliabile).
 *
 * I sub-componenti (Frame, H1, Body, Subtle, Divider) sono dichiarati al
 * livello modulo per soddisfare la regola lint del progetto
 * `react-hooks/static-components` (no creazione componenti durante render).
 * Ricevono via props i token tematici risolti dal componente padre.
 */

import React, { useEffect, useRef, useState } from 'react';
import type {
  LibrettoPage, LibrettoData, LibrettoPageCover, LibrettoPageIntro, LibrettoPageLettura,
  LibrettoPageSalmo, LibrettoPageVangelo, LibrettoPageCanto, LibrettoPageInterrogazioni,
  LibrettoPageConsenso, LibrettoPageAnelli, LibrettoPagePreghiereFedeli, LibrettoPagePadreNostro,
  LibrettoPageBenedizioneNuziale, LibrettoPageDedica, LibrettoPageRingraziamenti,
  LibrettoPagePhoto, LibrettoPageCustom, CoverElement,
  LibrettoPageMemoriaBattesimo, LibrettoPageGloria, LibrettoPageColletta, LibrettoPageLitanieSanti,
  LibrettoPageOrazioneOfferte, LibrettoPageRitoPace, LibrettoPageAgnelloDio,
  LibrettoPageOrazioneComunione, LibrettoPageRitiConclusione, LibrettoPageAttoCivile,
  LibrettoPageDedicaIniziale, LibrettoPageRacconto, LibrettoPageIndice,
} from '../../../../../utils/libretto/types';
import { DEFAULT_COVER_ORDER, LABEL_SEZIONE, resolveSezione, resolveSezioneInContext } from '../../../../../utils/libretto/types';
import {
  findLettura,
  fillSpouses,
  TESTO_INTERROGAZIONI,
  TESTO_CONSENSO_DICHIARATIVO,
  TESTO_CONSENSO_INTERROGATIVO,
  TESTO_BENEDIZIONE_ANELLI,
  findBenedizioneNuziale,
  findBenedizioneFinale,
  LABEL_POSTURA,
  TESTO_MEMORIA_BATTESIMO, TESTO_GLORIA, TESTO_COLLETTA, SANTI_DEFAULT,
  TESTO_LITANIE_SANTI_INTRO, TESTO_LITANIE_RESPONSE, TESTO_ORAZIONE_OFFERTE,
  TESTO_RITO_PACE, TESTO_AGNELLO_DIO, TESTO_ORAZIONE_COMUNIONE,
  BENEDIZIONI_FINALI_DEFAULT, TESTO_RITI_CONCLUSIONE_CHIUSURA,
  TESTO_ATTO_MATRIMONIO_CIVILE,
} from '../../../../../utils/libretto/cei';
import { getAdaptivePalette } from '../../../../../utils/colorUtils';

interface Theme {
  accent: string;
  bg: string;
  fontHeading: string;
  fontBody: string;
  /** Palette adattiva basata sullo sfondo della pagina (pageBgColor).
   *  Garantisce contrasto leggibile sia su sfondi chiari che scuri. */
  text: string;
  textSoft: string;
  textMuted: string;
  border: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Sub-componenti (livello modulo)
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Canvas nominale (proporzioni A5 portrait, 0.72 ratio):
 *   420×583 px. Tutto il rendering interno al Frame avviene a queste
 *   dimensioni FISSE indipendentemente dalla dimensione reale del contenitore;
 *   uno `transform: scale(actualWidth / NOMINAL_WIDTH)` ridimensiona poi il
 *   layout in modo proporzionale e leggibile a qualsiasi width (mobile,
 *   half-screen desktop, fullscreen).
 *
 * Vantaggio: i font/spaziature non cambiano con la window — il libretto
 *   appare identico a parte le dimensioni assolute. La paginazione
 *   (`paginate.ts`) può quindi tarare i char-cap su un canvas costante.
 */
const NOMINAL_WIDTH = 420;
const NOMINAL_HEIGHT = 583;

const Frame: React.FC<{
  children: React.ReactNode;
  centered?: boolean;
  theme: Theme;
  page: LibrettoPage;
  pageIndex: number;
  totalPages: number;
}> = ({ children, centered, theme, page, pageIndex, totalPages }) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / NOMINAL_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: theme.bg,
      }}
    >
      <div
    style={{
      width: NOMINAL_WIDTH,
      height: NOMINAL_HEIGHT,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: theme.bg,
      // Padding bottom 44px riserva spazio per il numero di pagina così
      // i testi non gli finiscono sopra. Top 30 / sides 28 sufficiente.
      padding: '30px 28px 44px',
      boxSizing: 'border-box',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: centered ? 'center' : 'stretch',
      justifyContent: centered ? 'center' : 'flex-start',
      textAlign: centered ? 'center' : 'left',
      fontFamily: theme.fontBody,
      color: theme.text,
      overflow: 'hidden',
    }}
  >
    {page.postura && page.postura !== 'nessuna' && page.type !== 'cover' && !((page as any).__part && !(page as any).__part.isFirst) && (
      <div
        style={{
          // Centrato in alto: meno invadente del corner-right.
          // Mostrato SOLO sulla prima slice di una page paginata, perché
          // la postura suggerita riguarda l'inizio del momento liturgico.
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '7px',
          fontFamily: theme.fontBody,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: theme.textMuted,
          padding: '1px 7px',
          border: `1px solid ${theme.border}`,
          borderRadius: '999px',
          fontWeight: 500,
          zIndex: 2,
          opacity: 0.55,
          whiteSpace: 'nowrap',
        }}
      >
        {LABEL_POSTURA[page.postura]}
      </div>
    )}
    {/* Wrapper contenuto: flex:1 + overflow:hidden fa sì che il body resti
        bounded all'interno dell'area utile, NON sconfinando nel padding
        bottom dove sta il numero di pagina. Quando centered, il wrapper
        diventa esso stesso flex-column centrato → il contenuto è
        verticalmente centrato anche se è poco (es: cover senza testimoni). */}
    <div
      style={{
        width: '100%',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        ...(centered ? {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        } : {}),
      }}
    >{children}</div>
    {page.type !== 'cover' && (
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '9px',
          color: theme.textMuted,
          fontFamily: theme.fontBody,
          opacity: 0.7,
          letterSpacing: '0.04em',
        }}
      >
        {pageIndex} / {totalPages - 1}
      </div>
    )}
      </div>
    </div>
  );
};

const H1: React.FC<{ children: React.ReactNode; small?: boolean; fontHeading: string; color?: string }> = ({ children, small, fontHeading, color }) => (
  <h2
    style={{
      fontFamily: fontHeading,
      fontSize: small ? '20px' : '26px',
      fontWeight: 500,
      color: color || 'inherit',
      // Margin compatto — tighten per liberare spazio body in pagine lettura/vangelo
      // dove le decorations rubavano troppo.
      margin: '0 0 6px 0',
      textAlign: 'center',
      letterSpacing: '0.02em',
      lineHeight: 1.25,
    }}
  >
    {children}
  </h2>
);

const Subtle: React.FC<{ children: React.ReactNode; accent: string }> = ({ children, accent }) => (
  <div
    style={{
      fontSize: '11px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: accent,
      textAlign: 'center',
      margin: '0 0 4px 0',
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

/**
 * Pattern dei soggetti liturgici a inizio riga: "Sac:", "Tutti:", "Sposo:",
 * "Sposa:", "Celebrante:", "Sposi:", "R." (responsoriale). Il prefisso viene
 * renderizzato in <strong> per leggibilità (è tipografia standard nei
 * libretti reali — chi parla è sempre in grassetto).
 */
const SPEAKER_REGEX = /^(Sac|Tutti|Sposo|Sposa|Celebrante|Sposi|R)(\.|:)\s/;

/**
 * Context per i nomi degli sposi: il renderer top-level lo provvede così
 * `Body` può grassettare AUTOMATICAMENTE le occorrenze dei nomi nel testo
 * (sia nei template che nei testi scritti a mano dall'utente). Evitiamo di
 * propagare `libretto` attraverso ogni livello di renderer.
 */
const BoldNamesContext = React.createContext<string[]>([]);

/** Escape regex special chars per interpolazione sicura in `new RegExp`. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renderizza testo con:
 *  - prefissi-soggetto liturgici (Sac:, Tutti:, …) in <strong>
 *  - nomi degli sposi (boldNames) in <strong>, su parola intera
 *    (case-insensitive, ma preservando il casing originale)
 *  - \n preservati
 */
function formatBodyText(raw: string | React.ReactNode, boldNames: string[]): React.ReactNode {
  if (typeof raw !== 'string') return raw;

  // Pre-compute regex per i nomi (escluso valori vuoti / placeholder ___).
  // \b funziona per ASCII; per nomi con apostrofi/accenti usiamo lookaround
  // sui non-letter così "Sara" ≠ "Saraceno" e "Mario" matcha "Mario," ma
  // NON "Mariotti".
  const validNames = boldNames.filter((n) => n && n.trim().length >= 2 && n !== '___');
  const nameRegex = validNames.length > 0
    ? new RegExp(`(?<![\\p{L}\\p{N}])(${validNames.map(escapeRegex).join('|')})(?![\\p{L}\\p{N}])`, 'giu')
    : null;

  /** Spezza una stringa in parti — text plain + <strong>nome</strong>. */
  const boldNamesIn = (text: string, baseKey: string): React.ReactNode[] => {
    if (!nameRegex || !text) return [text];
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let m: RegExpExecArray | null;
    let counter = 0;
    nameRegex.lastIndex = 0;
    while ((m = nameRegex.exec(text)) !== null) {
      if (m.index > lastIdx) parts.push(text.substring(lastIdx, m.index));
      parts.push(<strong key={`${baseKey}-n${counter++}`}>{m[0]}</strong>);
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) parts.push(text.substring(lastIdx));
    return parts.length > 0 ? parts : [text];
  };

  const lines = raw.split('\n');
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    const m = line.match(SPEAKER_REGEX);
    if (m) {
      const prefix = m[0]; // es. "Sac: "
      const rest = line.substring(prefix.length);
      nodes.push(
        <React.Fragment key={`s-${i}`}>
          <strong>{prefix.trim()}</strong>{' '}{boldNamesIn(rest, `s-${i}`)}
        </React.Fragment>
      );
    } else {
      nodes.push(<React.Fragment key={`l-${i}`}>{boldNamesIn(line, `l-${i}`)}</React.Fragment>);
    }
    if (i < lines.length - 1) nodes.push('\n');
  });
  return nodes;
}

const Body: React.FC<{ children: React.ReactNode; align?: 'left' | 'center'; color?: string; lineHeight?: number }> = ({ children, align = 'left', color, lineHeight = 1.55 }) => {
  const boldNames = React.useContext(BoldNamesContext);
  return (
    <p
      style={{
        fontSize: '13px',
        lineHeight,
        textAlign: align,
        whiteSpace: 'pre-wrap',
        color: color || 'inherit',
        margin: 0,
      }}
    >
      {formatBodyText(children, boldNames)}
    </p>
  );
};

const Divider: React.FC<{ accent: string }> = ({ accent }) => (
  <div style={{ width: '40px', height: '1px', background: accent, opacity: 0.6, margin: '12px auto' }} />
);

/** Helpers per page slice context (paginazione auto). Quando una pagina è
 *  spezzata in più slice fisiche, le decorazioni di apertura (subtitle,
 *  titolo, ref) e di chiusura (footer "Parola di Dio") non devono ripetersi
 *  ad ogni slice — appaiono solo su prima e ultima rispettivamente. */
function isContinuation(page: LibrettoPage): boolean {
  const part = (page as any).__part;
  return !!(part && !part.isFirst);
}
function isNotLast(page: LibrettoPage): boolean {
  const part = (page as any).__part;
  return !!(part && !part.isLast);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Renderer per ogni tipo di pagina (livello modulo)
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Risolve dimensioni/forma del frame foto cover.
 * v2 semplificata: solo 2 forme (cerchio | rettangolo), dimensione fissa,
 * posizione foto sempre in alto. L'inquadratura usa offsetX/Y + zoom
 * controllati dal crop tool interattivo nella sidebar.
 *
 * Render via `background-image` (non `<img>`) perché ci serve il triplo
 * controllo: position (X, Y) + size (zoom). object-position dà solo posizione,
 * non zoom — background-size + background-position dà entrambi puliti.
 */
export function resolveCoverPhotoStyle(cover: LibrettoData['cover'], accent: string): React.CSSProperties {
  const shape = cover.fotoShape || 'circle';
  const offsetX = typeof cover.fotoOffsetX === 'number' ? cover.fotoOffsetX : 50;
  const offsetY = typeof cover.fotoOffsetY === 'number' ? cover.fotoOffsetY : 50;
  const zoom = typeof cover.fotoZoom === 'number' && cover.fotoZoom > 0 ? cover.fotoZoom : 1;

  const base: React.CSSProperties = {
    border: `2px solid ${accent}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    display: 'block',
    margin: '0 auto',
    backgroundImage: cover.foto ? `url(${cover.foto})` : undefined,
    backgroundRepeat: 'no-repeat',
    // background-size cover * zoom: cover riempie il frame, zoom moltiplica.
    // Usiamo size pari a max(width, height) calcolato dal browser via "cover" con
    // un trick: imposta size auto e moltiplica via 'cover' + transform? No — soluzione
    // più semplice e affidabile: imposta size esplicito tramite calc su % dell'elemento.
    // Per cerchio (1:1) e rettangolo (4:3) impostiamo size in modo che lato corto = 100%/zoom*100.
    // Più pratico: usiamo "auto, cover" via background-size: cover non scala con zoom.
    // Quindi calcoliamo size manualmente: l'immagine viene scalata per coprire,
    // poi noi aumentiamo del fattore zoom usando 'auto' e percentuali.
    // Soluzione semplice: scaliamo via transform su un wrapper interno.
    backgroundSize: 'cover',
    backgroundPosition: `${offsetX}% ${offsetY}%`,
    overflow: 'hidden',
    position: 'relative',
  };
  void zoom; // zoom applicato via wrapper interno nel renderer (vedi sotto)

  // Trattiamo 'rectangle' e legacy 'wide'/'fullbleed'/'square' come rettangolo orizzontale.
  const isRect = shape === 'rectangle' || shape === 'wide' || shape === 'fullbleed' || shape === 'square';

  if (isRect) {
    return {
      ...base,
      width: '70%',
      maxWidth: 280,
      aspectRatio: '4 / 3',
      borderRadius: '12px',
    };
  }
  return {
    ...base,
    width: 160,
    height: 160,
    borderRadius: '50%',
  };
}

const renderCover = (page: LibrettoPageCover, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) => {
  const { cover } = libretto;
  const photoStyle = resolveCoverPhotoStyle(cover, theme.accent);
  const zoom = typeof cover.fotoZoom === 'number' && cover.fotoZoom > 0 ? cover.fotoZoom : 1;
  const offsetX = typeof cover.fotoOffsetX === 'number' ? cover.fotoOffsetX : 50;
  const offsetY = typeof cover.fotoOffsetY === 'number' ? cover.fotoOffsetY : 50;

  // Ordine elementi configurabile dall'utente. Se mancante, default
  // (foto → frase → nomi → data → chiesa). Sanifichiamo aggiungendo
  // alla fine elementi mancanti dall'array salvato (per garantire
  // retro-compat se aggiungiamo nuovi elementi in futuro).
  const customOrder = cover.elementsOrder;
  const order: CoverElement[] = customOrder && customOrder.length
    ? [...customOrder, ...DEFAULT_COVER_ORDER.filter((e) => !customOrder.includes(e))]
    : DEFAULT_COVER_ORDER;

  const renderElement = (el: CoverElement) => {
    switch (el) {
      case 'foto':
        if (!cover.foto) return null;
        return (
          <div
            key="foto"
            style={{
              ...photoStyle,
              marginBottom: '20px',
              backgroundSize: zoom === 1 ? 'cover' : `${100 * zoom}% ${100 * zoom}%`,
              backgroundPosition: `${offsetX}% ${offsetY}%`,
            }}
          />
        );
      case 'frase':
        if (!cover.fraseIniziale) return null;
        return (
          <p
            key="frase"
            style={{
              fontFamily: theme.fontHeading,
              fontStyle: 'italic',
              fontSize: '14px',
              color: theme.textSoft,
              margin: '0 auto 22px',
              maxWidth: '80%',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            «{cover.fraseIniziale}»
          </p>
        );
      case 'nomi':
        return (
          <div key="nomi" style={{ marginBottom: '18px', width: '100%' }}>
            <h1 style={{ fontFamily: theme.fontHeading, fontSize: '32px', fontWeight: 400, margin: '0 0 4px 0', color: theme.text, letterSpacing: '0.04em', textAlign: 'center' }}>
              {cover.sposo1 || '___'}
            </h1>
            <div style={{ fontFamily: theme.fontHeading, fontSize: '20px', color: theme.accent, fontStyle: 'italic', margin: '2px 0', textAlign: 'center' }}>&amp;</div>
            <h1 style={{ fontFamily: theme.fontHeading, fontSize: '32px', fontWeight: 400, margin: 0, color: theme.text, letterSpacing: '0.04em', textAlign: 'center' }}>
              {cover.sposo2 || '___'}
            </h1>
            <div style={{ marginTop: '14px' }}>
              <Divider accent={theme.accent} />
            </div>
          </div>
        );
      case 'data':
        if (!cover.data) return null;
        return (
          <div key="data" style={{ fontSize: '14px', color: theme.textSoft, marginTop: '4px', marginBottom: '4px', textAlign: 'center' }}>
            {cover.data}
          </div>
        );
      case 'chiesa':
        if (!cover.chiesa) return null;
        return (
          <div key="chiesa" style={{ fontSize: '12px', color: theme.textSoft, marginTop: '2px', textAlign: 'center' }}>
            {cover.chiesa}
          </div>
        );
      case 'officiante':
        if (!cover.officiante) return null;
        return (
          // Spazio uniforme sopra (dal blocco chiesa) e sotto (verso testimoni).
          <div key="officiante" style={{ marginTop: '40px', marginBottom: '8px', textAlign: 'center' }}>
            <div style={{
              fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: theme.textSoft, marginBottom: '4px', fontWeight: 600,
            }}>
              Presiede la celebrazione
            </div>
            <div style={{ fontSize: '14px', color: theme.text, fontFamily: theme.fontHeading }}>
              {cover.officiante}
            </div>
          </div>
        );
      case 'testimoni': {
        const items = (cover.testimoni || []).filter(s => s && s.trim().length > 0);
        if (items.length === 0) return null;
        return (
          // Testimoni in basso copertina: margine top maggiore per dare aria.
          <div key="testimoni" style={{ marginTop: '48px', textAlign: 'center', width: '100%' }}>
            <div style={{
              fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: theme.textSoft, marginBottom: '8px', fontWeight: 600,
            }}>
              Testimoni
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: items.length > 1 ? '1fr 1fr' : '1fr',
              gap: '4px 12px',
              fontSize: '13px',
              color: theme.text,
              fontFamily: theme.fontHeading,
            }}>
              {items.map((name, i) => (
                <div key={i}>{name}</div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Frame centered theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center' }}>
        {order.map(renderElement)}
      </div>
    </Frame>
  );
};

const renderIntro = (page: LibrettoPageIntro, theme: Theme, pageIndex: number, totalPages: number) => {
  const cont = isContinuation(page);
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <H1 fontHeading={theme.fontHeading}>{page.titolo}</H1>}
      {page.testo && <Body align="center">{page.testo}</Body>}
    </Frame>
  );
};

const renderLettura = (page: LibrettoPageLettura, theme: Theme, pageIndex: number, totalPages: number) => {
  const lett = page.letturaId ? findLettura(page.letturaId) : undefined;
  const isAT = lett?.type === 'at';
  const cont = isContinuation(page);
  const notLast = isNotLast(page);
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <Subtle accent={theme.accent}>{isAT ? 'Prima Lettura' : 'Seconda Lettura'}</Subtle>}
      {!cont && (lett ? (
        <>
          <H1 small fontHeading={theme.fontHeading}>{lett.titolo}</H1>
          <div style={{ textAlign: 'center', fontSize: '12px', color: theme.textSoft, marginBottom: 6 }}>{lett.ref}</div>
        </>
      ) : (
        <H1 small fontHeading={theme.fontHeading}>Lettura</H1>
      ))}
      {!cont && page.monizione && (
        <Body align="center">
          <em style={{ color: theme.textSoft }}>{page.monizione}</em>
        </Body>
      )}
      {(page.testoCompleto || lett?.testoCompleto) ? (
        // Niente Divider per le letture: liberare ~25px di body margine
        // permette a paragrafi finali brevi (es. "La grazia del Signore...
        // Parola di Dio") di restare sulla stessa pagina invece di creare
        // una pagina 2 quasi vuota. Il ref già separa visivamente l'header.
        <Body>{page.testoCompleto || lett?.testoCompleto}</Body>
      ) : (
        <Body align="center">
          <em style={{ color: theme.textMuted }}>Il testo verrà letto durante la celebrazione.</em>
        </Body>
      )}
      {!notLast && (
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: '12px', color: theme.textSoft }}>Parola di Dio.</div>
      )}
    </Frame>
  );
};

const renderSalmo = (page: LibrettoPageSalmo, theme: Theme, pageIndex: number, totalPages: number) => {
  const sal = page.salmoId ? findLettura(page.salmoId) : undefined;
  const cont = isContinuation(page);
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <Subtle accent={theme.accent}>Salmo Responsoriale</Subtle>}
      {!cont && (sal ? (
        <>
          <H1 small fontHeading={theme.fontHeading}>{sal.titolo}</H1>
          <div style={{ textAlign: 'center', fontSize: '12px', color: theme.textSoft, marginBottom: 6 }}>{sal.ref}</div>
        </>
      ) : (
        <H1 small fontHeading={theme.fontHeading}>Salmo</H1>
      ))}
      {!cont && (page.ritornello || sal?.ritornello) && (
        // Bubble compatto: ridotto a ~28px (1 riga) / ~45px (2 righe).
        // Padding tight + font 12px così non ruba spazio prezioso al body.
        <div style={{
          background: theme.accent + '10',
          padding: '6px 12px',
          borderRadius: '6px',
          marginBottom: '14px',
          textAlign: 'center',
          fontStyle: 'italic',
          fontSize: '12px',
          lineHeight: 1.4,
          color: theme.text,
          borderLeft: `3px solid ${theme.accent}`,
        }}>
          ℟ {page.ritornello || sal?.ritornello}
        </div>
      )}
      {(page.testoCompleto || sal?.testoCompleto) ? (
        <Body>{page.testoCompleto || sal?.testoCompleto}</Body>
      ) : (
        <Body align="center">
          <em style={{ color: theme.textMuted }}>Il testo verrà cantato durante la celebrazione.</em>
        </Body>
      )}
    </Frame>
  );
};

const renderVangelo = (page: LibrettoPageVangelo, theme: Theme, pageIndex: number, totalPages: number) => {
  const vg = page.vangeloId ? findLettura(page.vangeloId) : undefined;
  const cont = isContinuation(page);
  const notLast = isNotLast(page);
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <Subtle accent={theme.accent}>Vangelo</Subtle>}
      {!cont && (vg ? (
        <>
          <H1 small fontHeading={theme.fontHeading}>{vg.titolo}</H1>
          <div style={{ textAlign: 'center', fontSize: '12px', color: theme.textSoft, marginBottom: 6 }}>{vg.ref}</div>
        </>
      ) : (
        <H1 small fontHeading={theme.fontHeading}>Vangelo</H1>
      ))}
      {!cont && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: theme.textSoft, marginBottom: 8 }}>℟ Gloria a te, o Signore.</div>
      )}
      {(page.testoCompleto || vg?.testoCompleto) ? (
        <Body>{page.testoCompleto || vg?.testoCompleto}</Body>
      ) : (
        <Body align="center">
          <em style={{ color: theme.textMuted }}>Il Vangelo verrà letto durante la celebrazione.</em>
        </Body>
      )}
      {!notLast && (
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: '12px', color: theme.textSoft }}>Parola del Signore.</div>
      )}
    </Frame>
  );
};

const renderCanto = (page: LibrettoPageCanto, theme: Theme, pageIndex: number, totalPages: number) => {
  const cont = isContinuation(page);
  // Subtitle "Canto d'ingresso/Offertorio/…" rimosso: la posizione della
  // pagina nel libretto basta a contestualizzare il momento, l'etichetta
  // ridondava. `momento` resta come metadato per il TOC navigazionale.
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <H1 small fontHeading={theme.fontHeading}>{page.titolo || '—'}</H1>}
      {page.testo ? (
        <>
          {!cont && <Divider accent={theme.accent} />}
          <Body align="center">{page.testo}</Body>
        </>
      ) : (
        <Body align="center">
          <em style={{ color: theme.textMuted }}>Il canto sarà eseguito dal coro.</em>
        </Body>
      )}
    </Frame>
  );
};

const renderInterrogazioni = (page: LibrettoPageInterrogazioni, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) => {
  const text = page.useTemplate
    ? fillSpouses(TESTO_INTERROGAZIONI, libretto.cover.sposo1, libretto.cover.sposo2)
    : page.testoCustom || '';
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <Subtle accent={theme.accent}>Liturgia del Matrimonio</Subtle>
      <H1 small fontHeading={theme.fontHeading}>Interrogazioni prima del consenso</H1>
      <Body>{text}</Body>
    </Frame>
  );
};

const renderConsenso = (page: LibrettoPageConsenso, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) => {
  const tpl = page.forma === 'dichiarativo' ? TESTO_CONSENSO_DICHIARATIVO : TESTO_CONSENSO_INTERROGATIVO;
  const text = page.testoCustom || fillSpouses(tpl, libretto.cover.sposo1, libretto.cover.sposo2);
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <Subtle accent={theme.accent}>Consenso e Promesse</Subtle>
      <H1 small fontHeading={theme.fontHeading}>Manifestazione del consenso</H1>
      <Body>{text}</Body>
    </Frame>
  );
};

const renderAnelli = (page: LibrettoPageAnelli, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) => {
  const text = page.useTemplate
    ? fillSpouses(TESTO_BENEDIZIONE_ANELLI, libretto.cover.sposo1, libretto.cover.sposo2)
    : page.testoCustom || '';
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <Subtle accent={theme.accent}>Scambio degli Anelli</Subtle>
      <H1 small fontHeading={theme.fontHeading}>Benedizione e consegna</H1>
      <Body>{text}</Body>
    </Frame>
  );
};

const renderPreghiereFedeli = (page: LibrettoPagePreghiereFedeli, theme: Theme, pageIndex: number, totalPages: number) => (
  <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
    <Subtle accent={theme.accent}>Preghiera dei Fedeli</Subtle>
    <H1 small fontHeading={theme.fontHeading}>Preghiamo insieme</H1>
    <ul style={{ paddingLeft: '0', listStyle: 'none', margin: 0 }}>
      {page.intenzioni.map((int, i) => (
        <li key={i} style={{ marginBottom: '14px', paddingLeft: '20px', position: 'relative', fontSize: '14px', lineHeight: 1.6 }}>
          <span style={{ position: 'absolute', left: 0, color: theme.accent, fontWeight: 600 }}>{i + 1}.</span>
          {int}
        </li>
      ))}
    </ul>
    {page.ritornello && (
      <div style={{ marginTop: '20px', padding: '12px', background: theme.accent + '10', borderRadius: '8px', textAlign: 'center', fontStyle: 'italic', color: theme.accent, fontWeight: 600 }}>
        ℟ {page.ritornello}
      </div>
    )}
  </Frame>
);

const renderPadreNostro = (page: LibrettoPagePadreNostro, theme: Theme, pageIndex: number, totalPages: number) => (
  <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
    <Subtle accent={theme.accent}>Liturgia Eucaristica</Subtle>
    <H1 small fontHeading={theme.fontHeading}>Padre Nostro</H1>
    <Body align="center">
      Padre nostro, che sei nei cieli,{'\n'}
      sia santificato il tuo nome,{'\n'}
      venga il tuo regno,{'\n'}
      sia fatta la tua volontà,{'\n'}
      come in cielo così in terra.{'\n\n'}
      Dacci oggi il nostro pane quotidiano,{'\n'}
      e rimetti a noi i nostri debiti{'\n'}
      come anche noi li rimettiamo ai nostri debitori,{'\n'}
      e non abbandonarci alla tentazione,{'\n'}
      ma liberaci dal male. Amen.
    </Body>
  </Frame>
);

const renderBenedizioneNuziale = (page: LibrettoPageBenedizioneNuziale, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) => {
  const cont = isContinuation(page);
  // Risolvo il testo: se useTemplate non è false ed esiste formulaId,
  // uso la formula CEI selezionata. Altrimenti testoCustom dell'utente.
  const formula = page.formulaId ? findBenedizioneNuziale(page.formulaId) : undefined;
  const useTpl = page.useTemplate !== false;
  const text = useTpl && formula
    ? fillSpouses(formula.testoCompleto, libretto.cover.sposo1, libretto.cover.sposo2)
    : (page.testoCustom || '');
  // Niente h1 di default per la benedizione: "Benedizione Nuziale" come
  // subtitle è già autoesplicativo, e mostrare "Prima formula" / "Seconda
  // formula" in pagina è informazione tecnica fuori contesto. L'h1 appare
  // SOLO se l'utente ha esplicitamente impostato un titoloCustom.
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <Subtle accent={theme.accent}>Benedizione Nuziale</Subtle>}
      {!cont && page.titoloCustom && <H1 small fontHeading={theme.fontHeading}>{page.titoloCustom}</H1>}
      {text ? (
        <Body lineHeight={1.4}>{text}</Body>
      ) : (
        <Body align="center">
          <em style={{ color: theme.textSoft }}>
            Il celebrante invoca su {libretto.cover.sposo1 || '___'} e {libretto.cover.sposo2 || '___'} la solenne benedizione nuziale, perché Dio sia testimone e custode del loro amore.
          </em>
        </Body>
      )}
    </Frame>
  );
};

const renderDedica = (page: LibrettoPageDedica, theme: Theme, pageIndex: number, totalPages: number) => {
  const cont = isContinuation(page);
  return (
    <Frame centered theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <H1 small fontHeading={theme.fontHeading}>{page.titolo}</H1>}
      {!cont && <Divider accent={theme.accent} />}
      <Body align="center">{page.testo}</Body>
    </Frame>
  );
};

const renderRingraziamenti = (page: LibrettoPageRingraziamenti, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) => {
  const cont = isContinuation(page);
  const notLast = isNotLast(page);
  return (
    <Frame centered theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <Subtle accent={theme.accent}>Grazie</Subtle>}
      <Body align="center">{page.testo}</Body>
      {!notLast && <Divider accent={theme.accent} />}
      {!notLast && (
        <div style={{ marginTop: '12px', fontFamily: theme.fontHeading, fontStyle: 'italic', color: theme.accent, fontSize: '18px' }}>
          {libretto.cover.sposo1 || '___'} & {libretto.cover.sposo2 || '___'}
        </div>
      )}
    </Frame>
  );
};

const renderPhoto = (page: LibrettoPagePhoto, theme: Theme, pageIndex: number, totalPages: number) => (
  <Frame centered theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
    {page.url ? (
      <img
        src={page.url}
        alt={page.caption || ''}
        style={{ maxWidth: '100%', maxHeight: '75%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      />
    ) : (
      <div style={{ width: '100%', aspectRatio: '4/3', background: theme.border, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '13px' }}>
        Nessuna foto caricata
      </div>
    )}
    {page.caption && (
      <div style={{ marginTop: '12px', fontFamily: theme.fontHeading, fontStyle: 'italic', color: theme.textSoft, fontSize: '14px' }}>
        {page.caption}
      </div>
    )}
  </Frame>
);

const renderCustom = (page: LibrettoPageCustom, theme: Theme, pageIndex: number, totalPages: number) => {
  const cont = isContinuation(page);
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {!cont && <H1 small fontHeading={theme.fontHeading}>{page.titolo}</H1>}
      <Body>{page.testo}</Body>
    </Frame>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 * Renderer nuovi tipi pagina (memoria battesimo, gloria, ecc.)
 *
 * Pattern unificato: titolo (overridable) + corpo testuale (template auto
 * popolato con i nomi degli sposi se useTemplate, altrimenti testoCustom).
 * ──────────────────────────────────────────────────────────────────────── */

/** Helper generico: titolo + corpo testo (con fillSpouses se ha placeholder). */
const renderStandardLiturgical = (
  page: LibrettoPage & { useTemplate?: boolean; testoCustom?: string; titoloCustom?: string },
  defaultTitle: string,
  defaultText: string,
  libretto: LibrettoData,
  theme: Theme,
  pageIndex: number,
  totalPages: number,
  options?: { centered?: boolean; subtitle?: string },
) => {
  const titolo = (page.titoloCustom && page.titoloCustom.trim()) || defaultTitle;
  const useTpl = page.useTemplate !== false;
  const text = useTpl
    ? fillSpouses(defaultText, libretto.cover.sposo1, libretto.cover.sposo2)
    : (page.testoCustom || '');
  const cont = isContinuation(page);
  return (
    <Frame {...(options?.centered ? { centered: true } : {})} theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      {/* Subtitle + h1 solo sulla prima slice (le continuation hanno solo body
          per massimizzare lo spazio testuale ed evitare ripetizioni rumorose). */}
      {!cont && options?.subtitle && <Subtle accent={theme.accent}>{options.subtitle}</Subtle>}
      {!cont && <H1 small fontHeading={theme.fontHeading}>{titolo}</H1>}
      <Body>{text}</Body>
    </Frame>
  );
};

const renderMemoriaBattesimo = (page: LibrettoPageMemoriaBattesimo, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Memoria del Battesimo', TESTO_MEMORIA_BATTESIMO, libretto, theme, pageIndex, totalPages,
    { subtitle: 'Riti di Introduzione' });

const renderGloria = (page: LibrettoPageGloria, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Gloria', TESTO_GLORIA, libretto, theme, pageIndex, totalPages,
    { subtitle: 'Inno di Lode' });

const renderColletta = (page: LibrettoPageColletta, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Colletta', TESTO_COLLETTA, libretto, theme, pageIndex, totalPages);

/**
 * Risposta liturgica per un'invocazione: "prega per noi" (singolare) se
 * il nome inizia con Santa/San/Sant'; "pregate per noi" (plurale) se
 * Santi/Sante/Tutti/Tutte. Default: singolare (caso più comune).
 */
function responseForSaint(name: string): string {
  const trimmed = name.trim();
  if (/^(Santi\b|Sante\b|Tutti\b|Tutte\b)/i.test(trimmed)) {
    return 'pregate per noi';
  }
  return 'prega per noi';
}

const renderLitanieSanti = (page: LibrettoPageLitanieSanti, theme: Theme, pageIndex: number, totalPages: number) => {
  // Filtriamo righe vuote (l'editor accetta linee vuote in fase di typing —
  // vedi LitanieSantiEditor — ma non vanno renderizzate).
  const cleaned = (page.santi || []).filter((s) => s && s.trim().length > 0);
  const santi = cleaned.length > 0 ? cleaned : SANTI_DEFAULT;
  const useTpl = page.useTemplate !== false;
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <Subtle accent={theme.accent}>Invocazione dei Santi</Subtle>
      <H1 small fontHeading={theme.fontHeading}>{page.titoloCustom || 'Litanie dei Santi'}</H1>
      {useTpl && (
        <Body align="center">
          <em style={{ color: theme.textSoft }}>{TESTO_LITANIE_SANTI_INTRO}</em>
        </Body>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
        {santi.map((s, i) => (
          <li key={i} style={{ fontSize: '13px', lineHeight: 1.7, padding: '2px 0', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>{s}</span>
            {/* paddingRight 3px: il corsivo italic ha overhang sull'ultima
                lettera (l'asta della 'i' di "noi" sporge a destra) e veniva
                clippato dal bordo destro del wrapper. */}
            <span style={{ color: theme.accent, fontStyle: 'italic', fontSize: '12px', flexShrink: 0, paddingRight: '3px' }}>{responseForSaint(s)}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
};

const renderOrazioneOfferte = (page: LibrettoPageOrazioneOfferte, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Orazione sulle offerte', TESTO_ORAZIONE_OFFERTE, libretto, theme, pageIndex, totalPages,
    { subtitle: 'Liturgia Eucaristica' });

const renderRitoPace = (page: LibrettoPageRitoPace, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Rito della pace', TESTO_RITO_PACE, libretto, theme, pageIndex, totalPages);

const renderAgnelloDio = (page: LibrettoPageAgnelloDio, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Agnello di Dio', TESTO_AGNELLO_DIO, libretto, theme, pageIndex, totalPages);

const renderOrazioneComunione = (page: LibrettoPageOrazioneComunione, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Orazione dopo la comunione', TESTO_ORAZIONE_COMUNIONE, libretto, theme, pageIndex, totalPages);

const renderRitiConclusione = (page: LibrettoPageRitiConclusione, theme: Theme, pageIndex: number, totalPages: number) => {
  // Risoluzione benedizioni:
  //  1. useTemplate !== false + formulaId valido → formula CEI ufficiale (4 benedizioni).
  //  2. benedizioniCustom valorizzato → custom utente.
  //  3. benedizioni legacy valorizzato → back-compat libretti pre-formule.
  //  4. Fallback → 1ª formula CEI completa.
  const formula = page.formulaId ? findBenedizioneFinale(page.formulaId) : undefined;
  const useTpl = page.useTemplate !== false;
  let ben: string[];
  if (useTpl && formula) {
    ben = formula.benedizioni;
  } else if (page.benedizioniCustom && page.benedizioniCustom.length) {
    ben = page.benedizioniCustom;
  } else if (page.benedizioni && page.benedizioni.length) {
    ben = page.benedizioni;
  } else {
    ben = BENEDIZIONI_FINALI_DEFAULT;
  }
  // Layout stretto: 4 benedizioni + chiusura su singola pagina A5.
  // Margini ridotti vs default per evitare clip su 1ª formula (la più lunga).
  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <Subtle accent={theme.accent}>Riti di Conclusione</Subtle>
      <H1 small fontHeading={theme.fontHeading}>{page.titoloCustom || 'Benedizione finale'}</H1>
      {ben.map((b, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>
          <Body lineHeight={1.4}>{b}</Body>
          <div style={{ fontSize: '12px', color: theme.accent, fontStyle: 'italic', marginTop: 1, textAlign: 'right' }}>
            ℟ Amen.
          </div>
        </div>
      ))}
      <div style={{ width: '40px', height: '1px', background: theme.accent, opacity: 0.6, margin: '6px auto' }} />
      <Body align="center" lineHeight={1.4}>{TESTO_RITI_CONCLUSIONE_CHIUSURA}</Body>
    </Frame>
  );
};

const renderAttoCivile = (page: LibrettoPageAttoCivile, libretto: LibrettoData, theme: Theme, pageIndex: number, totalPages: number) =>
  renderStandardLiturgical(page, 'Atto di Matrimonio', TESTO_ATTO_MATRIMONIO_CIVILE, libretto, theme, pageIndex, totalPages,
    { subtitle: 'Effetti civili' });

const renderDedicaIniziale = (page: LibrettoPageDedicaIniziale, theme: Theme, pageIndex: number, totalPages: number) => (
  <Frame centered theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
    <p
      style={{
        fontFamily: theme.fontHeading,
        fontStyle: 'italic',
        fontSize: '20px',
        lineHeight: 1.6,
        color: theme.text,
        textAlign: 'center',
        margin: '0 auto 18px',
        maxWidth: '85%',
        whiteSpace: 'pre-wrap',
      }}
    >
      «{page.citazione}»
    </p>
    {page.autore && (
      <div style={{ fontSize: '13px', color: theme.accent, fontFamily: theme.fontHeading, fontStyle: 'italic' }}>
        — {page.autore}
      </div>
    )}
  </Frame>
);

const renderRacconto = (page: LibrettoPageRacconto, theme: Theme, pageIndex: number, totalPages: number) => (
  <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
    <H1 small fontHeading={theme.fontHeading}>{page.titolo}</H1>
    <Body>{page.testo}</Body>
  </Frame>
);

/**
 * Indice auto-popolato. Modalità `macro` raggruppa per sezione (mostra
 * solo le N macro-sezioni con il numero di pagina della prima pagina di
 * ogni sezione). Modalità `dettaglio` elenca ogni pagina (esclusa cover,
 * indice stessa, e foto).
 */
const renderIndice = (
  page: LibrettoPageIndice,
  libretto: LibrettoData,
  theme: Theme,
  pageIndex: number,
  totalPages: number,
) => {
  const profondita = page.profondita || 'macro';
  const mostraNumeri = page.mostraNumeri !== false;

  type Row = { label: string; pageNum: number; isSection?: boolean };
  const rows: Row[] = [];

  if (profondita === 'macro') {
    // Una riga per sezione: prendi il primo indice in cui appare quella sezione.
    // Usiamo resolveSezioneInContext così canti/intro ereditano dal momento
    // liturgico in cui si trovano (es. canto d'ingresso → introduzione,
    // canto offertorio → eucaristica), mantenendo l'ordinamento naturale
    // dei numeri di pagina nell'indice.
    const seenSezioni = new Set<string>();
    libretto.pages.forEach((p, i) => {
      if (p.type === 'cover' || p.type === 'indice') return;
      const sez = resolveSezioneInContext(i, libretto.pages);
      if (seenSezioni.has(sez)) return;
      seenSezioni.add(sez);
      rows.push({ label: LABEL_SEZIONE[sez], pageNum: i + 1, isSection: true });
    });
  } else {
    libretto.pages.forEach((p, i) => {
      if (p.type === 'cover' || p.type === 'indice' || p.type === 'photo') return;
      // Nome pagina: titolo se presente, altrimenti label tipo
      let label = '';
      if ('titolo' in p && (p as any).titolo) label = (p as any).titolo as string;
      else if ('titoloCustom' in p && (p as any).titoloCustom) label = (p as any).titoloCustom as string;
      else if (p.type === 'lettura') label = 'Lettura';
      else if (p.type === 'salmo') label = 'Salmo Responsoriale';
      else if (p.type === 'vangelo') label = 'Vangelo';
      else if (p.type === 'canto' && (p as any).momento) label = (p as any).momento;
      else label = LABEL_SEZIONE[resolveSezione(p)];
      rows.push({ label, pageNum: i + 1 });
    });
  }

  return (
    <Frame theme={theme} page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <H1 fontHeading={theme.fontHeading}>{page.titoloCustom || 'Indice'}</H1>
      <Divider accent={theme.accent} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
        {rows.map((r, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              padding: '6px 0',
              fontSize: r.isSection ? '14px' : '13px',
              fontWeight: r.isSection ? 600 : 400,
              color: theme.text,
              lineHeight: 1.4,
            }}
          >
            <span>{r.label}</span>
            <span
              style={{
                flex: 1,
                borderBottom: `1px dotted ${theme.border}`,
                margin: '0 4px',
                transform: 'translateY(-3px)',
              }}
            />
            {mostraNumeri && (
              <span style={{ color: theme.accent, fontWeight: 600, fontSize: '13px' }}>
                {r.pageNum}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Frame>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 * Componente principale
 * ──────────────────────────────────────────────────────────────────────── */

interface Props {
  page: LibrettoPage;
  libretto: LibrettoData;
  pageIndex: number;
  totalPages: number;
}

const LibrettoPageRenderer: React.FC<Props> = ({ page, libretto, pageIndex, totalPages }) => {
  const accent = libretto.style.accentColor || '#14b8a6';
  const bg = libretto.style.pageBgColor || '#fffdf7';
  // Palette adattiva: testo si scurisce/schiarisce in base al contrasto col bg.
  // Stesso pattern di RSVPWidget/PaymentWidget/ecc.
  const palette = getAdaptivePalette(bg, accent);
  const theme: Theme = {
    accent,
    bg,
    fontHeading: libretto.style.fontHeading || 'Cormorant Garamond',
    fontBody: libretto.style.fontBody || 'Inter',
    text: palette.text,
    textSoft: palette.textSoft,
    textMuted: palette.textMuted,
    border: palette.border,
  };

  // Nomi degli sposi → grassetto automatico in tutti i Body. Memoizzato per
  // evitare nuove array reference a ogni render (e nuovi regex compile).
  const boldNames = React.useMemo(
    () => [libretto.cover.sposo1, libretto.cover.sposo2].filter(Boolean) as string[],
    [libretto.cover.sposo1, libretto.cover.sposo2],
  );

  const renderedPage = renderPageByType(page, libretto, theme, pageIndex, totalPages);
  return <BoldNamesContext.Provider value={boldNames}>{renderedPage}</BoldNamesContext.Provider>;
};

function renderPageByType(
  page: LibrettoPage,
  libretto: LibrettoData,
  theme: Theme,
  pageIndex: number,
  totalPages: number,
): React.ReactNode {
  switch (page.type) {
    case 'cover': return renderCover(page, libretto, theme, pageIndex, totalPages);
    case 'intro': return renderIntro(page, theme, pageIndex, totalPages);
    case 'lettura': return renderLettura(page, theme, pageIndex, totalPages);
    case 'salmo': return renderSalmo(page, theme, pageIndex, totalPages);
    case 'vangelo': return renderVangelo(page, theme, pageIndex, totalPages);
    case 'canto': return renderCanto(page, theme, pageIndex, totalPages);
    case 'interrogazioni': return renderInterrogazioni(page, libretto, theme, pageIndex, totalPages);
    case 'consenso': return renderConsenso(page, libretto, theme, pageIndex, totalPages);
    case 'anelli': return renderAnelli(page, libretto, theme, pageIndex, totalPages);
    case 'preghiere-fedeli': return renderPreghiereFedeli(page, theme, pageIndex, totalPages);
    case 'padre-nostro': return renderPadreNostro(page, theme, pageIndex, totalPages);
    case 'benedizione-nuziale': return renderBenedizioneNuziale(page, libretto, theme, pageIndex, totalPages);
    case 'dedica': return renderDedica(page, theme, pageIndex, totalPages);
    case 'ringraziamenti': return renderRingraziamenti(page, libretto, theme, pageIndex, totalPages);
    case 'photo': return renderPhoto(page, theme, pageIndex, totalPages);
    case 'custom': return renderCustom(page, theme, pageIndex, totalPages);
    case 'memoria-battesimo': return renderMemoriaBattesimo(page, libretto, theme, pageIndex, totalPages);
    case 'gloria': return renderGloria(page, libretto, theme, pageIndex, totalPages);
    case 'colletta': return renderColletta(page, libretto, theme, pageIndex, totalPages);
    case 'litanie-santi': return renderLitanieSanti(page, theme, pageIndex, totalPages);
    case 'orazione-offerte': return renderOrazioneOfferte(page, libretto, theme, pageIndex, totalPages);
    case 'rito-pace': return renderRitoPace(page, libretto, theme, pageIndex, totalPages);
    case 'agnello-dio': return renderAgnelloDio(page, libretto, theme, pageIndex, totalPages);
    case 'orazione-comunione': return renderOrazioneComunione(page, libretto, theme, pageIndex, totalPages);
    case 'riti-conclusione': return renderRitiConclusione(page, theme, pageIndex, totalPages);
    case 'atto-matrimonio-civile': return renderAttoCivile(page, libretto, theme, pageIndex, totalPages);
    case 'dedica-iniziale': return renderDedicaIniziale(page, theme, pageIndex, totalPages);
    case 'racconto': return renderRacconto(page, theme, pageIndex, totalPages);
    case 'indice': return renderIndice(page, libretto, theme, pageIndex, totalPages);
    default: return null;
  }
}

export default React.memo(LibrettoPageRenderer);
