/**
 * Sidebar editor per il widget Libretto Messa.
 *
 * Stile allineato al resto dell'editor (cfr. PaymentSection):
 *  - Wrapper `Surface variant="soft"` (desktop) o `panel-section` div (mobile compact).
 *  - Header "Stai modificando: Libretto Messa" con icon-box (desktop only).
 *  - Form fields: pattern `labelStyle + inputWrapStyle + inputStyle` con icona Pencil.
 *  - Tab switcher coerente con `PaymentSection` (Button ghost/primary su sfondo pill).
 *  - Foto copertina caricata da device via `/api/uploads?folder=libretto` (no URL paste).
 */

import React, { useRef, useState } from 'react';
import { BookOpen, Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Send, Eye, Image as ImageIcon, Pencil, Upload, Loader2 } from 'lucide-react';
import { Surface, Button } from '../../../../ui';
import type { Block, EventData } from '../../../../types/editor';
import type { LibrettoData, LibrettoPage, CoverElement } from '../../../../utils/libretto/types';
import { PAGE_TYPE_LABEL, DEFAULT_COVER_ORDER } from '../../../../utils/libretto/types';
import { createDefaultLibretto, newPage } from '../../../../utils/libretto/templates';
import { LETTURE_AT, LETTURE_TEMPO_PASQUALE, SALMI, LETTURE_NT, VANGELI, CANTI_SUGGERITI, BENEDIZIONI_NUZIALI, BENEDIZIONI_FINALI, findLettura, findBenedizioneNuziale, findBenedizioneFinale, resolveDefaultTemplateText } from '../../../../utils/libretto/cei';
import EventPurchaseModal from '../../../../components/payments/EventPurchaseModal';
import LibrettoBooklet from '../widgets/libretto/LibrettoBooklet';
import LibrettoEditorModal from '../widgets/libretto/LibrettoEditorModal';
import { LibrettoPreviewContext } from '../widgets/libretto/LibrettoPreviewContext';
import CustomColorPicker from '../CustomColorPicker';
import CustomFontSelect from '../CustomFontSelect';
import CustomSelect from '../CustomSelect';
import { AVAILABLE_FONTS, loadGoogleFont } from '../EditorHelpers';
import { apiFetch } from '../../../../utils/apiFetch';

export type LibrettoSection = 'cover' | 'pages' | 'style' | 'publish' | 'paywall';

interface Props {
  selectedBlock: Block;
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void;
  hasLibrettoAccess?: boolean | undefined;
  slug?: string | undefined;
  eventTitle?: string | undefined;
  updateEventData?: ((updates: Partial<EventData>, pushToHistory?: () => void) => void) | undefined;
  event?: EventData | null | undefined;
  compact?: boolean | undefined;
  section?: LibrettoSection | undefined;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Design tokens (allineati a PaymentSection)
 * ──────────────────────────────────────────────────────────────────────── */
export const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: '8px',
};
export const inputWrapStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '10px 12px',
  borderRadius: '10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
};
export const inputStyle: React.CSSProperties = {
  flex: 1, border: 'none', outline: 'none',
  background: 'transparent', fontSize: '13px',
  color: 'var(--text-primary)', minWidth: 0,
  fontFamily: 'inherit',
};
const sectionDividerStyle: React.CSSProperties = {
  fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  margin: '4px 0 12px',
};
export const fieldGap: React.CSSProperties = { marginBottom: '14px' };

/* ─────────────────────────────────────────────────────────────────────────
 * PhotoCropEditor — drag-to-pan + zoom slider per la foto di copertina.
 *
 * Visibile solo quando una foto è già caricata. Replica in sidebar
 * (anziché su canvas) il pattern "Regola Posizione Sfondo" dell'invito,
 * evitando conflitti col drag del block del libretto.
 *
 * Algoritmo drag:
 * - Quando l'utente trascina, applichiamo il delta in % su offset X/Y.
 * - Sensitivity divisa per zoom: con zoom alto bastano spostamenti minori
 *   (l'area visibile è più piccola, lo stesso movimento = più "pan").
 * - Inverso: trascinare a destra → l'immagine si sposta a destra → si vede
 *   più della parte SINISTRA → offsetX diminuisce.
 * ──────────────────────────────────────────────────────────────────────── */

const PhotoCropEditor: React.FC<{
  url: string;
  shape: 'circle' | 'rectangle';
  offsetX: number;
  offsetY: number;
  zoom: number;
  onChange: (next: { fotoOffsetX?: number; fotoOffsetY?: number; fotoZoom?: number }) => void;
}> = ({ url, shape, offsetX, offsetY, zoom, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initOffX = offsetX;
    const initOffY = offsetY;
    const rect = ref.current.getBoundingClientRect();
    // Più zoom = meno pan visivo per stesso drag (l'area visibile è più
    // piccola). 100/zoom dà una sensibilità calibrata su zoom 1.
    const factor = 100 / zoom;

    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * factor;
      const dy = ((ev.clientY - startY) / rect.height) * factor;
      onChange({
        fotoOffsetX: Math.max(0, Math.min(100, initOffX - dx)),
        fotoOffsetY: Math.max(0, Math.min(100, initOffY - dy)),
      });
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const sizeStr = zoom === 1 ? 'cover' : `${100 * zoom}% ${100 * zoom}%`;

  return (
    <>
      <div style={fieldGap}>
        <label style={labelStyle}>Inquadratura</label>
        <p style={{ fontSize: '10px', color: 'var(--text-soft)', margin: '0 0 10px', lineHeight: 1.4 }}>
          Trascina la foto per spostare l'inquadratura. Usa lo slider sotto per ingrandire.
        </p>
        <div
          ref={ref}
          onPointerDown={handlePointerDown}
          style={{
            width: '100%',
            aspectRatio: shape === 'circle' ? '1' : '4 / 3',
            backgroundImage: `url(${url})`,
            backgroundSize: sizeStr,
            backgroundPosition: `${offsetX}% ${offsetY}%`,
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'var(--surface-light)',
            borderRadius: shape === 'circle' ? '50%' : '12px',
            border: '2px solid var(--accent)',
            boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.15)',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            position: 'relative',
            margin: '0 auto',
            maxWidth: shape === 'circle' ? 200 : 260,
          }}
        >
          {/* Crosshair sottile per indicare il centro (target del crop) */}
          <div
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 28, height: 28,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.85)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Zoom</label>
        {/* Slider con stile coerente al resto dell'editor (PropertyPanel,
            EditorStage): className `custom-slider` + linear-gradient track per
            riempimento progressivo + valore numerico a destra. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="range"
            className="custom-slider"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => onChange({ fotoZoom: Number(e.target.value) })}
            style={{
              flex: 1,
              background: `linear-gradient(to right, var(--accent) ${Math.round(((zoom - 1) / 2) * 100)}%, rgba(60, 79, 118, 0.1) ${Math.round(((zoom - 1) / 2) * 100)}%)`,
            } as React.CSSProperties}
          />
          <span style={{ fontSize: '12px', width: '36px', textAlign: 'right', fontWeight: 700, color: 'var(--text-soft)' }}>
            {zoom.toFixed(2)}x
          </span>
        </div>
        {(zoom !== 1 || offsetX !== 50 || offsetY !== 50) && (
          <button
            onClick={() => onChange({ fotoZoom: 1, fotoOffsetX: 50, fotoOffsetY: 50 })}
            style={{
              marginTop: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-soft)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '2px 0',
              textDecoration: 'underline',
            }}
          >
            Ripristina inquadratura
          </button>
        )}
      </div>
    </>
  );
};

const LibrettoSidebar: React.FC<Props> = ({
  selectedBlock,
  onUpdateBlock,
  hasLibrettoAccess = false,
  slug,
  eventTitle = 'Evento',
  updateEventData,
  event,
  compact = false,
  section,
}) => {
  const widgetProps = selectedBlock.widgetProps || {};
  const libretto: LibrettoData =
    (widgetProps.libretto as LibrettoData) ||
    createDefaultLibretto('con-messa', {
      sposo1: '',
      sposo2: '',
      data: event?.date || '',
      chiesa: '',
    });

  // activeTab usato solo dal vecchio compact mode (mobile toolbar).
  // Desktop usa il nuovo modal LibrettoEditorModal per cover/pagine.
  const [activeTab, setActiveTab] = useState<'cover' | 'pages' | 'style'>('style');
  void activeTab; // tab state ancora consumato da addPage() in compact mode
  const [editingPageIdx, setEditingPageIdx] = useState<number | null>(null);
  // Sync con LibrettoMobileViewer nel canvas: quando in compact mode mobile
  // l'utente tap un chip pagina, il viewer flippa a quella pagina e viceversa.
  // Opzionale (può essere null se la sidebar è renderizzata fuori dal Provider).
  const previewCtx = React.useContext(LibrettoPreviewContext);
  // Helper: selezione pagina nella sidebar mobile (chip strip) sincronizza
  // anche il viewer del canvas. Su desktop il context può comunque esistere
  // ma il viewer single-page non è attivo (Booklet doppia pagina) → no-op.
  const selectPageForEditing = (idx: number | null) => {
    setEditingPageIdx(idx);
    if (idx !== null && previewCtx) previewCtx.setPageIdx(idx);
  };
  const [showPurchase, setShowPurchase] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  // Color picker toggle: 'accent' | 'pageBg' | null. Mostra il picker
  // sotto al rispettivo bottone-pillola (pattern InviteSection).
  const [openColorPicker, setOpenColorPicker] = useState<'accent' | 'pageBg' | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPagePhoto, setUploadingPagePhoto] = useState<number | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const pagePhotoFileRef = useRef<HTMLInputElement | null>(null);

  const update = (next: Partial<LibrettoData>) => {
    const merged: LibrettoData = { ...libretto, ...next };
    onUpdateBlock(selectedBlock.id!, {
      widgetProps: { ...widgetProps, libretto: merged },
    });
  };

  const updateCover = (next: Partial<LibrettoData['cover']>) =>
    update({ cover: { ...libretto.cover, ...next } });

  const updateStyle = (next: Partial<LibrettoData['style']>) =>
    update({ style: { ...libretto.style, ...next } });

  /**
   * Aggiorna una pagina. Se l'utente sceglie una lettura AT con
   * `salmoCorrispondente` e la pagina successiva è di tipo 'salmo' SENZA
   * salmoId già impostato (o con quello del precedente abbinamento auto),
   * impostiamo automaticamente il salmo abbinato. L'utente può comunque
   * sostituirlo dal menu Salmo.
   */
  const updatePage = (idx: number, next: Partial<LibrettoPage>) => {
    const pages = [...libretto.pages];
    const target = pages[idx];
    if (!target) return;
    const updated = { ...target, ...next } as LibrettoPage;
    pages[idx] = updated;

    // Auto-pair lettura → salmo
    if (updated.type === 'lettura' && (next as any).letturaId !== undefined) {
      const lett = (updated as any).letturaId ? findLettura((updated as any).letturaId) : undefined;
      const corrSalmo = lett?.salmoCorrispondente;
      const nextPage = pages[idx + 1];
      if (corrSalmo && nextPage && nextPage.type === 'salmo') {
        const targetSalmoId = `sal-${corrSalmo}`;
        // Sovrascriviamo solo se vuoto o se era un altro auto-pair (heuristic: id esistente è anch'esso 'sal-N').
        // Per non sorprendere l'utente che ha scelto manualmente, sovrascriviamo SOLO se vuoto.
        if (!nextPage.salmoId) {
          pages[idx + 1] = { ...nextPage, salmoId: targetSalmoId };
        }
      }
    }
    update({ pages });
  };

  const addPage = (type: LibrettoPage['type']) => {
    const pages = [...libretto.pages, newPage(type)];
    update({ pages });
    setEditingPageIdx(pages.length - 1);
    if (compact && section !== 'pages') return;
    setActiveTab('pages');
  };

  const removePage = (idx: number) => {
    const pages = libretto.pages.filter((_, i) => i !== idx);
    update({ pages });
    if (editingPageIdx === idx) setEditingPageIdx(null);
  };

  const movePage = (idx: number, dir: -1 | 1) => {
    const pages = [...libretto.pages];
    const target = idx + dir;
    if (target < 0 || target >= pages.length) return;
    const a = pages[idx];
    const b = pages[target];
    if (!a || !b) return;
    pages[idx] = b;
    pages[target] = a;
    update({ pages });
    if (editingPageIdx === idx) setEditingPageIdx(target);
  };

  /** Upload foto copertina via /api/uploads (stesso endpoint della Galleria,
      folder dedicato `libretto`). */
  const uploadCoverPhoto = async (file: File) => {
    if (!slug || !file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const res = await apiFetch(`/api/uploads?slug=${slug}&folder=libretto`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload fallito');
      const data = await res.json();
      const url = (data.urls as string[])?.[0];
      if (url) updateCover({ foto: url });
    } catch (err) {
      console.error('Cover upload error:', err);
      alert('Errore durante il caricamento della foto.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadCoverPhoto(file);
    if (e.target) e.target.value = '';
  };

  /** Upload foto per una pagina di tipo `photo`. */
  const uploadPagePhoto = async (file: File, pageIdx: number) => {
    if (!slug || !file) return;
    setUploadingPagePhoto(pageIdx);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const res = await apiFetch(`/api/uploads?slug=${slug}&folder=libretto`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload fallito');
      const data = await res.json();
      const url = (data.urls as string[])?.[0];
      if (url) updatePage(pageIdx, { url } as any);
    } catch (err) {
      console.error('Page photo upload error:', err);
      alert('Errore durante il caricamento della foto.');
    } finally {
      setUploadingPagePhoto(null);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────
   * Sub-render: COPERTINA
   *
   * I gruppi-campo sono renderizzati nell'ordine definito da
   * `cover.elementsOrder`. Ogni gruppo ha le frecce su/giù in alto a destra
   * (pattern coerente con la lista pagine), che riordinano l'array salvato.
   * ─────────────────────────────────────────────────────────────────── */
  const renderCover = () => {
    const order: CoverElement[] = libretto.cover.elementsOrder && libretto.cover.elementsOrder.length
      ? [
          ...libretto.cover.elementsOrder,
          ...DEFAULT_COVER_ORDER.filter((e) => !libretto.cover.elementsOrder!.includes(e)),
        ]
      : DEFAULT_COVER_ORDER;

    const moveElement = (el: CoverElement, dir: -1 | 1) => {
      const idx = order.indexOf(el);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= order.length) return;
      const next = [...order];
      const a = next[idx];
      const b = next[target];
      if (!a || !b) return;
      next[idx] = b;
      next[target] = a;
      updateCover({ elementsOrder: next });
    };

    /** Header gruppo-campo con etichetta + frecce su/giù. Sostituisce
     *  `<label style={labelStyle}>...</label>` quando l'elemento è in ordine. */
    const groupHeader = (el: CoverElement, label: string) => {
      const idx = order.indexOf(el);
      const isFirst = idx === 0;
      const isLast = idx === order.length - 1;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={labelStyle as React.CSSProperties}>{label}</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={() => moveElement(el, -1)}
              disabled={isFirst}
              title="Sposta su"
              style={{
                padding: '2px 4px',
                border: 'none',
                background: 'transparent',
                color: isFirst ? 'var(--border)' : 'var(--text-soft)',
                cursor: isFirst ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => moveElement(el, 1)}
              disabled={isLast}
              title="Sposta giù"
              style={{
                padding: '2px 4px',
                border: 'none',
                background: 'transparent',
                color: isLast ? 'var(--border)' : 'var(--text-soft)',
                cursor: isLast ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      );
    };

    /** Renderizza il singolo gruppo-campo (form input + frecce). */
    const renderGroup = (el: CoverElement) => {
      switch (el) {
        case 'nomi': {
          const idx = order.indexOf('nomi');
          const isFirst = idx === 0;
          const isLast = idx === order.length - 1;
          return (
            <div key="nomi" style={fieldGap}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={labelStyle as React.CSSProperties}>Nome dello sposo</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    onClick={() => moveElement('nomi', -1)}
                    disabled={isFirst}
                    title="Sposta su"
                    style={{
                      padding: '2px 4px', border: 'none', background: 'transparent',
                      color: isFirst ? 'var(--border)' : 'var(--text-soft)',
                      cursor: isFirst ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveElement('nomi', 1)}
                    disabled={isLast}
                    title="Sposta giù"
                    style={{
                      padding: '2px 4px', border: 'none', background: 'transparent',
                      color: isLast ? 'var(--border)' : 'var(--text-soft)',
                      cursor: isLast ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
              <div style={{ ...inputWrapStyle, marginBottom: '12px' }}>
                <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0 }} />
                <input
                  value={libretto.cover.sposo1}
                  onChange={(e) => updateCover({ sposo1: e.target.value })}
                  placeholder="es. Marco"
                  style={{ ...inputStyle, fontWeight: 600 }}
                  maxLength={60}
                />
              </div>
              <label style={labelStyle}>Nome della sposa</label>
              <div style={inputWrapStyle}>
                <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0 }} />
                <input
                  value={libretto.cover.sposo2}
                  onChange={(e) => updateCover({ sposo2: e.target.value })}
                  placeholder="es. Sara"
                  style={{ ...inputStyle, fontWeight: 600 }}
                  maxLength={60}
                />
              </div>
            </div>
          );
        }

        case 'data':
          return (
            <div key="data" style={fieldGap}>
              {groupHeader('data', 'Data')}
              <div style={inputWrapStyle}>
                <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0 }} />
                <input
                  value={libretto.cover.data}
                  onChange={(e) => updateCover({ data: e.target.value })}
                  placeholder="es. 12 settembre 2026"
                  style={inputStyle}
                  maxLength={80}
                />
              </div>
            </div>
          );

        case 'chiesa':
          return (
            <div key="chiesa" style={fieldGap}>
              {groupHeader('chiesa', 'Chiesa / Luogo')}
              <div style={inputWrapStyle}>
                <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0 }} />
                <input
                  value={libretto.cover.chiesa}
                  onChange={(e) => updateCover({ chiesa: e.target.value })}
                  placeholder="es. Chiesa di Santa Maria, Milano"
                  style={inputStyle}
                  maxLength={120}
                />
              </div>
            </div>
          );

        case 'frase':
          return (
            <div key="frase" style={fieldGap}>
              {groupHeader('frase', 'Frase iniziale (opzionale)')}
              <p style={{ fontSize: '10px', color: 'var(--text-soft)', margin: '0 0 6px', lineHeight: 1.4 }}>
                Una citazione, un versetto biblico o un pensiero che vi rappresenta —
                appare in corsivo sotto la copertina.
              </p>
              <div style={{ ...inputWrapStyle, alignItems: 'flex-start' }}>
                <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0, marginTop: '3px' }} />
                <textarea
                  value={libretto.cover.fraseIniziale || ''}
                  onChange={(e) => updateCover({ fraseIniziale: e.target.value })}
                  placeholder="Scrivi qui la tua frase…"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  maxLength={200}
                />
              </div>
            </div>
          );

        case 'foto':
          return (
            <div key="foto" style={fieldGap}>
              {groupHeader('foto', 'Foto copertina (opzionale)')}
              {renderFotoControls()}
            </div>
          );

        case 'officiante':
          return (
            <div key="officiante" style={fieldGap}>
              {groupHeader('officiante', 'Sacerdote (opzionale)')}
              <p style={{ fontSize: '10px', color: 'var(--text-soft)', margin: '0 0 6px', lineHeight: 1.4 }}>
                Chi presiede la celebrazione. Apparirà sotto a "Presiede la celebrazione".
              </p>
              <div style={inputWrapStyle}>
                <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0 }} />
                <input
                  value={libretto.cover.officiante || ''}
                  onChange={(e) => updateCover({ officiante: e.target.value })}
                  placeholder="es. Don Enzo Malizia"
                  style={inputStyle}
                  maxLength={80}
                />
              </div>
            </div>
          );

        case 'testimoni': {
          const items = libretto.cover.testimoni || [];
          const updateAt = (i: number, val: string) => {
            const next = [...items];
            next[i] = val;
            updateCover({ testimoni: next });
          };
          const removeAt = (i: number) => updateCover({ testimoni: items.filter((_, j) => j !== i) });
          const addOne = () => updateCover({ testimoni: [...items, ''] });
          return (
            <div key="testimoni" style={fieldGap}>
              {groupHeader('testimoni', 'Testimoni (opzionale)')}
              <p style={{ fontSize: '10px', color: 'var(--text-soft)', margin: '0 0 6px', lineHeight: 1.4 }}>
                Nomi dei testimoni di matrimonio (di solito 2-4). Appariranno in colonna sulla copertina.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((name, i) => (
                  <div key={i} style={inputWrapStyle}>
                    <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0 }} />
                    <input
                      value={name}
                      onChange={(e) => updateAt(i, e.target.value)}
                      placeholder={`Testimone ${i + 1}`}
                      style={inputStyle}
                      maxLength={80}
                    />
                    <button
                      onClick={() => removeAt(i)}
                      title="Rimuovi"
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#c0392b', padding: '2px 4px', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={addOne}
                  style={{ justifyContent: 'center', fontSize: '11px' }}
                >
                  <Plus size={11} style={{ marginRight: 4 }} /> Aggiungi testimone
                </Button>
              </div>
            </div>
          );
        }

        default:
          return null;
      }
    };

    return (
      <>
        <div style={sectionDividerStyle}>Copertina</div>
        {order.map(renderGroup)}
      </>
    );
  };

  /** Controlli foto (upload + forma + crop), renderizzati dentro il gruppo `foto`. */
  const renderFotoControls = () => (
    <>
      {/* Riga upload / cambio / rimuovi */}
      {libretto.cover.foto ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <img
            src={libretto.cover.foto}
            alt="Copertina"
            style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', objectPosition: `${libretto.cover.fotoOffsetX ?? 50}% ${libretto.cover.fotoOffsetY ?? 50}%`, border: '1px solid var(--border)' }}
          />
          <Button
            variant="subtle"
            size="sm"
            onClick={() => coverFileRef.current?.click()}
            disabled={uploadingCover}
            style={{ flex: 1, fontSize: '11px' }}
          >
            {uploadingCover ? <><Loader2 size={12} className="spin" /> Carico…</> : 'Cambia foto'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateCover({ foto: undefined })}
            style={{ fontSize: '11px', color: '#c0392b' }}
            title="Rimuovi foto"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ) : (
        <Button
          variant="subtle"
          onClick={() => coverFileRef.current?.click()}
          disabled={uploadingCover || !slug}
          style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
        >
          {uploadingCover ? (
            <><Loader2 size={13} className="spin" /> Carico…</>
          ) : (
            <><Upload size={13} style={{ marginRight: 6 }} /> Carica foto dal dispositivo</>
          )}
        </Button>
      )}
      <input
        ref={coverFileRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFile}
        style={{ display: 'none' }}
      />

      {/* Forma + crop visibili solo se foto caricata */}
      {libretto.cover.foto && (
        <>
          <div style={fieldGap}>
            <label style={labelStyle}>Forma</label>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-light)', borderRadius: '100px', padding: '3px', border: '1px solid var(--border)' }}>
              {([
                { v: 'circle', l: 'Cerchio' },
                { v: 'rectangle', l: 'Rettangolo' },
              ] as const).map((opt) => (
                <Button
                  key={opt.v}
                  variant={
                    (libretto.cover.fotoShape === 'rectangle' || libretto.cover.fotoShape === 'wide' || libretto.cover.fotoShape === 'fullbleed' || libretto.cover.fotoShape === 'square'
                      ? 'rectangle'
                      : 'circle') === opt.v
                      ? 'primary'
                      : 'ghost'
                  }
                  size="sm"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}
                  onClick={() => updateCover({ fotoShape: opt.v })}
                >
                  {opt.l}
                </Button>
              ))}
            </div>
          </div>

          <PhotoCropEditor
            url={libretto.cover.foto}
            shape={
              libretto.cover.fotoShape === 'rectangle' ||
              libretto.cover.fotoShape === 'wide' ||
              libretto.cover.fotoShape === 'fullbleed' ||
              libretto.cover.fotoShape === 'square'
                ? 'rectangle'
                : 'circle'
            }
            offsetX={libretto.cover.fotoOffsetX ?? 50}
            offsetY={libretto.cover.fotoOffsetY ?? 50}
            zoom={libretto.cover.fotoZoom ?? 1}
            onChange={(p) => updateCover(p)}
          />
        </>
      )}
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Sub-render: PAGINE
   * ─────────────────────────────────────────────────────────────────── */
  const renderPages = () => (
    <>
      {/* Nota: il toggle "Con/Senza Messa" è stato rimosso — il libretto è
          sempre con messa per definizione (è un "libretto messa"). La variante
          'con-messa' resta default in createDefaultLibretto. */}
      <div style={sectionDividerStyle}>Pagine ({libretto.pages.length})</div>

      {compact ? (
        /* MOBILE: strip orizzontale chip pagine (pattern font picker). Tap chip
           → seleziona pagina per editing E flippa il LibrettoMobileViewer nel
           canvas sopra (via LibrettoPreviewContext). Reorder/delete spostati
           nella toolbar dell'editor inline qui sotto per non sovraffollare. */
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '4px 2px 10px',
          marginBottom: '12px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}>
          {libretto.pages.map((p, i) => {
            const isEditing = editingPageIdx === i;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPageForEditing(isEditing ? null : i)}
                style={{
                  flex: '0 0 auto',
                  minWidth: 92,
                  maxWidth: 140,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: `1.5px solid ${isEditing ? 'var(--accent)' : 'var(--border)'}`,
                  background: isEditing ? 'rgba(var(--accent-rgb), 0.12)' : 'var(--surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  transition: 'all .15s',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isEditing ? 'var(--accent)' : 'var(--text-soft)',
                }}>
                  Pag. {i + 1}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '116px',
                  lineHeight: 1.2,
                }}>
                  {PAGE_TYPE_LABEL[p.type]}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* DESKTOP: lista verticale completa con su/giù/delete inline. */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 320, overflowY: 'auto', marginBottom: '12px' }}>
          {libretto.pages.map((p, i) => {
            const isEditing = editingPageIdx === i;
            return (
              <div
                key={p.id}
                onClick={() => setEditingPageIdx(isEditing ? null : i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: isEditing ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--surface)',
                  border: `1px solid ${isEditing ? 'rgba(var(--accent-rgb), 0.4)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {i + 1}. {PAGE_TYPE_LABEL[p.type]}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {describePage(p)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); movePage(i, -1); }}
                    disabled={i === 0}
                    style={{ padding: '4px', minWidth: 'auto' }}
                    title="Sposta su"
                  >
                    <ChevronUp size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); movePage(i, 1); }}
                    disabled={i === libretto.pages.length - 1}
                    style={{ padding: '4px', minWidth: 'auto' }}
                    title="Sposta giù"
                  >
                    <ChevronDown size={13} />
                  </Button>
                  {p.type !== 'cover' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Eliminare "${PAGE_TYPE_LABEL[p.type]}"?`)) removePage(i);
                      }}
                      style={{ padding: '4px', minWidth: 'auto', color: '#c0392b' }}
                      title="Elimina"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sezione "Aggiungi pagina" rimossa intenzionalmente: il template CEI
          default copre l'intero rito, l'utente non ha necessità di pagine
          custom aggiuntive. Riordino delle pagine esistenti resta possibile. */}

      {/* Editor pagina selezionata */}
      {editingPageIdx !== null && libretto.pages[editingPageIdx] && (
        <div style={{
          marginTop: '16px', paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '10px',
          }}>
            <div style={{ ...sectionDividerStyle, margin: 0, flex: 1, minWidth: 0 }}>
              Modifica · {PAGE_TYPE_LABEL[libretto.pages[editingPageIdx]!.type]}
            </div>
            {/* Toolbar reorder/delete — su desktop ci sono già le icone inline
                in lista; su mobile (compact, chip strip senza icone) servono
                qui per non perdere la funzionalità. */}
            {compact && (
              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    movePage(editingPageIdx, -1);
                    if (editingPageIdx > 0) selectPageForEditing(editingPageIdx - 1);
                  }}
                  disabled={editingPageIdx === 0}
                  style={{ padding: '6px', minWidth: 'auto' }}
                  title="Sposta su"
                >
                  <ChevronUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    movePage(editingPageIdx, 1);
                    if (editingPageIdx < libretto.pages.length - 1) selectPageForEditing(editingPageIdx + 1);
                  }}
                  disabled={editingPageIdx === libretto.pages.length - 1}
                  style={{ padding: '6px', minWidth: 'auto' }}
                  title="Sposta giù"
                >
                  <ChevronDown size={14} />
                </Button>
                {libretto.pages[editingPageIdx]!.type !== 'cover' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const lbl = PAGE_TYPE_LABEL[libretto.pages[editingPageIdx]!.type];
                      if (confirm(`Eliminare "${lbl}"?`)) {
                        removePage(editingPageIdx);
                        selectPageForEditing(null);
                      }
                    }}
                    style={{ padding: '6px', minWidth: 'auto', color: '#c0392b' }}
                    title="Elimina"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>
          <PageEditor
            page={libretto.pages[editingPageIdx]!}
            onChange={(next) => updatePage(editingPageIdx, next)}
            uploadingPagePhoto={uploadingPagePhoto === editingPageIdx}
            onUploadPhoto={(file) => uploadPagePhoto(file, editingPageIdx)}
            pagePhotoRef={pagePhotoFileRef}
            slug={slug}
            libretto={libretto}
          />
        </div>
      )}
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Sub-render: STILE
   *
   * Colori: pulsante con label sx + swatch quadrato dx (pattern InviteSection
   * "Pulsante & Accenti"). Click toggle CustomColorPicker panel inline.
   *
   * Tipografia: CustomFontSelect dropdown ricco (90 fonts AVAILABLE_FONTS,
   * stesso del PropertyPanel canvas). Preview nel dropdown mostra il font
   * applicato a "Nuovo Testo".
   * ─────────────────────────────────────────────────────────────────── */
  const renderStyle = () => (
    <>
      <div style={sectionDividerStyle}>Colori</div>

      {/* Colore accento */}
      <div style={fieldGap}>
        <Button
          variant={openColorPicker === 'accent' ? 'primary' : 'subtle'}
          onClick={() => {
            setOpenColorPicker(openColorPicker === 'accent' ? null : 'accent');
          }}
          style={{
            width: '100%',
            justifyContent: 'space-between',
            padding: '10px 14px',
            ...(openColorPicker === 'accent'
              ? { boxShadow: '0 0 15px rgba(var(--accent-rgb), 0.5)', zIndex: 1 }
              : {}),
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Pulsante &amp; Accenti</span>
          <span
            style={{
              width: 22, height: 22,
              borderRadius: '6px',
              background: (libretto.style.accentColor && libretto.style.accentColor !== '#14b8a6' ? libretto.style.accentColor : null) || event?.theme?.accent || 'var(--accent)',
              border: '1px solid rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.5)',
              flexShrink: 0,
            }}
          />
        </Button>
        {openColorPicker === 'accent' && (
          <div style={{
            marginTop: '6px',
            padding: '8px',
            background: 'var(--surface)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            <CustomColorPicker
              color={(libretto.style.accentColor && libretto.style.accentColor !== '#14b8a6' ? libretto.style.accentColor : null) || event?.theme?.accent || '#14b8a6'}
              onChange={(c) => updateStyle({ accentColor: c })}
            />
          </div>
        )}
      </div>

      {/* Sfondo pagine */}
      <div style={fieldGap}>
        <Button
          variant={openColorPicker === 'pageBg' ? 'primary' : 'subtle'}
          onClick={() => {
            setOpenColorPicker(openColorPicker === 'pageBg' ? null : 'pageBg');
          }}
          style={{
            width: '100%',
            justifyContent: 'space-between',
            padding: '10px 14px',
            ...(openColorPicker === 'pageBg'
              ? { boxShadow: '0 0 15px rgba(var(--accent-rgb), 0.5)', zIndex: 1 }
              : {}),
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Sfondo pagine</span>
          <span
            style={{
              width: 22, height: 22,
              borderRadius: '6px',
              background: libretto.style.pageBgColor || '#fffdf7',
              border: '1px solid rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.5)',
              flexShrink: 0,
            }}
          />
        </Button>
        {openColorPicker === 'pageBg' && (
          <div style={{
            marginTop: '6px',
            padding: '8px',
            background: 'var(--surface)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            <CustomColorPicker
              color={libretto.style.pageBgColor || '#fffdf7'}
              onChange={(c) => updateStyle({ pageBgColor: c })}
            />
          </div>
        )}
      </div>

      <div style={sectionDividerStyle}>Tipografia</div>

      {/* Preview font titoli = nomi sposi (i titoli del libretto sono i nomi).
          Se i nomi non sono ancora compilati, fallback breve mobile-friendly.
          Preview font testo = data della cerimonia (uso più frequente del corpo
          nel libretto), con fallback breve. */}
      <div style={fieldGap}>
        <label style={labelStyle}>Carattere titoli</label>
        <CustomFontSelect
          value={libretto.style.fontHeading || 'Cormorant Garamond'}
          fonts={AVAILABLE_FONTS}
          previewText={
            (libretto.cover.sposo1 && libretto.cover.sposo2)
              ? `${libretto.cover.sposo1} & ${libretto.cover.sposo2}`
              : libretto.cover.sposo1 || libretto.cover.sposo2 || 'Marco & Giulia'
          }
          onChange={(font) => {
            updateStyle({ fontHeading: font });
            loadGoogleFont(font);
          }}
        />
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Carattere testo</label>
        <CustomFontSelect
          value={libretto.style.fontBody || 'Inter'}
          fonts={AVAILABLE_FONTS}
          previewText={libretto.cover.data || '12 settembre 2026'}
          onChange={(font) => {
            updateStyle({ fontBody: font });
            loadGoogleFont(font);
          }}
        />
      </div>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Sub-render: PUBLISH
   * ─────────────────────────────────────────────────────────────────── */
  const renderPublish = () => (
    <>
      <div style={sectionDividerStyle}>Pubblicazione</div>
      <p style={{ fontSize: '12px', color: 'var(--text-soft)', lineHeight: 1.5, margin: '0 0 12px' }}>
        Quando pubblichi, il libretto diventa sfogliabile dagli ospiti sulla pagina pubblica
        dell'evento. Puoi modificarlo anche dopo la pubblicazione.
      </p>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 12px', background: 'var(--surface)', borderRadius: '10px',
        border: '1px solid var(--border)', marginBottom: '10px', fontSize: '12px',
      }}>
        <span style={{ color: 'var(--text-soft)' }}>Stato</span>
        <span style={{
          fontWeight: 700,
          color: libretto.isPublished ? 'var(--accent)' : '#f59e0b',
          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {libretto.isPublished ? 'Pubblicato' : 'Bozza'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Anteprima sopra: l'utente vuole vedere il risultato PRIMA di decidere se pubblicare. */}
        <Button variant="subtle" onClick={() => setShowPreview(true)} style={{ justifyContent: 'center' }}>
          <Eye size={13} style={{ marginRight: 6 }} />
          Anteprima sfogliabile
        </Button>
        <Button
          variant={libretto.isPublished ? 'subtle' : 'primary'}
          onClick={() => update({ isPublished: !libretto.isPublished })}
          style={{ justifyContent: 'center' }}
        >
          <Send size={13} style={{ marginRight: 6 }} />
          {libretto.isPublished ? 'Riporta in bozza' : 'Pubblica libretto'}
        </Button>
      </div>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Sub-render: PAYWALL
   * ─────────────────────────────────────────────────────────────────── */
  const renderPaywall = () => (
    <div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <div
        style={{
          width: 64, height: 64, borderRadius: '20px',
          background: 'linear-gradient(135deg, var(--accent), rgba(var(--accent-rgb), 0.6))',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 12px 24px rgba(var(--accent-rgb), 0.25)',
        }}
      >
        <BookOpen size={28} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        Libretto Messa
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-soft)', lineHeight: 1.5, margin: '0 0 16px' }}>
        Crea un libretto sfogliabile per la cerimonia, con letture, canti, consenso e
        ringraziamenti — tutto personalizzato con i vostri nomi.
      </p>
      <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowPurchase(true)}>
        <Sparkles size={13} style={{ marginRight: 6 }} />
        Attiva — €15
      </Button>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Modali
   * ─────────────────────────────────────────────────────────────────── */
  const modals = (
    <>
      {slug && (
        <EventPurchaseModal
          open={showPurchase}
          onClose={() => setShowPurchase(false)}
          eventSlug={slug}
          eventTitle={eventTitle}
          purchaseType="libretto_addon"
          onUnlocked={() => {
            setShowPurchase(false);
            if (updateEventData) {
              updateEventData({ addons: { ...(event?.addons || {}), libretto: true } });
            }
          }}
        />
      )}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            paddingTop: 'max(20px, env(safe-area-inset-top))',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            overflowY: 'auto',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, width: '100%', maxHeight: '90dvh', overflowY: 'auto' }}>
            <LibrettoBooklet libretto={libretto} maxWidth={900} />
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: '#fff',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '999px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
              >
                Chiudi anteprima
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Editor full-screen modal (wizard lineare con TOC + preview + form) */}
      <LibrettoEditorModal
        open={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        libretto={libretto}
        onUpdate={(next) => update(next)}
        slug={slug}
      />
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Body principale
   * ─────────────────────────────────────────────────────────────────── */
  const body = (
    <>
      {/* Header desktop "Stai modificando: Libretto Messa" */}
      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '18px', paddingBottom: '14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(var(--accent-rgb), 0.12)',
            border: '1px solid rgba(var(--accent-rgb), 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BookOpen size={18} color="var(--accent)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              Stai modificando
            </div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Libretto Messa
            </h3>
          </div>
        </div>
      )}

      {!hasLibrettoAccess ? (
        renderPaywall()
      ) : compact ? (
        // ─── MOBILE COMPACT: vecchio sistema tabs (preserva MobileToolbar) ───
        <>
          {section === 'cover' && renderCover()}
          {section === 'pages' && renderPages()}
          {section === 'style' && renderStyle()}
          {section === 'publish' && renderPublish()}
        </>
      ) : (
        // ─── DESKTOP: sidebar snellita ───
        // Header status + bottoni globali in cima · Stile in mezzo · Pubblica/Anteprima in fondo
        <>
          {/* Top: status + bottoni globali */}
          <div style={{ marginBottom: '16px' }}>
            {/* Stato pubblicazione chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px',
              background: libretto.isPublished
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(245, 158, 11, 0.08)',
              border: libretto.isPublished
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              marginBottom: '12px',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: libretto.isPublished ? '#10b981' : '#f59e0b',
              }} />
              <span style={{
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: libretto.isPublished ? '#047857' : '#92400e',
              }}>
                {libretto.isPublished ? 'Pubblicato' : 'Bozza'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-soft)' }}>
                {libretto.pages.length} pagine
              </span>
            </div>

            {/* Bottone PRIMARY: Modifica libretto → apre modal */}
            <Button
              variant="primary"
              onClick={() => setShowEditorModal(true)}
              style={{
                width: '100%', justifyContent: 'center',
                padding: '14px', fontSize: '14px', fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              <Pencil size={16} style={{ marginRight: 8 }} />
              Modifica libretto
            </Button>

            {/* Anteprima + Pubblica fianco a fianco.
                Necessario padding override + minWidth:0 perché .ui-button ha
                flex-shrink:0 + padding sm più largo, che fa overflow se non
                forziamo i bottoni a stare ai loro flex:1 puri. Stesso pattern
                di PaymentSection. */}
            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
              <Button
                variant="subtle"
                onClick={() => setShowPreview(true)}
                style={{
                  flex: 1, minWidth: 0,
                  padding: '8px 4px',
                  justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600,
                }}
              >
                <Eye size={13} style={{ marginRight: 6, flexShrink: 0 }} />
                Anteprima
              </Button>
              <Button
                variant={libretto.isPublished ? 'subtle' : 'primary'}
                onClick={() => update({ isPublished: !libretto.isPublished })}
                style={{
                  flex: 1, minWidth: 0,
                  padding: '8px 4px',
                  justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                }}
              >
                <Send size={13} style={{ marginRight: 6, flexShrink: 0 }} />
                {libretto.isPublished ? 'Bozza' : 'Pubblica'}
              </Button>
            </div>
          </div>

          {/* Stile (sempre visibile) */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            {renderStyle()}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {compact ? (
        <div className="panel-section" style={{ width: '100%' }}>{body}</div>
      ) : (
        <Surface variant="soft" className="panel-section" style={{ marginTop: '20px' }}>{body}</Surface>
      )}
      {modals}
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 * PageEditor: form contestuale per la pagina selezionata
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Helper per onChange del toggle "Testo standard / Scrivi il tuo testo".
 * Quando l'utente switcha a custom MA il testoCustom è vuoto, prepopoliamo
 * con il template risolto fillSpouses(...) — così editi invece di partire
 * da pagina bianca.
 */
function buildToggleTemplateChange(
  page: any,
  libretto: LibrettoData | undefined,
  v: 'template' | 'custom',
): Partial<LibrettoPage> {
  if (v === 'template') return { useTemplate: true } as any;
  // v === 'custom'
  const alreadyHasCustom = page.testoCustom && page.testoCustom.trim().length > 0;
  if (alreadyHasCustom) return { useTemplate: false } as any;
  // Pre-popola con il template risolto fillSpouses(...) per non far partire
  // l'utente da textarea vuoto.
  const s1 = libretto?.cover.sposo1 || '';
  const s2 = libretto?.cover.sposo2 || '';
  const resolved = resolveDefaultTemplateText(page, s1, s2);
  return { useTemplate: false, testoCustom: resolved } as any;
}

export interface PageEditorProps {
  page: LibrettoPage;
  onChange: (next: Partial<LibrettoPage>) => void;
  uploadingPagePhoto: boolean;
  onUploadPhoto: (file: File) => void;
  pagePhotoRef: React.RefObject<HTMLInputElement | null>;
  slug?: string | undefined;
  /** Libretto corrente — serve a pre-popolare testoCustom dal template
      quando l'utente switcha modalità (vedi buildToggleTemplateChange). */
  libretto?: LibrettoData | undefined;
}

export const PageEditor: React.FC<PageEditorProps> = ({ page, onChange, uploadingPagePhoto, onUploadPhoto, pagePhotoRef, slug, libretto }) => {
  // Postura comune (tranne cover) — funzione che ritorna JSX (non componente nested).
  const posturaSelect = page.type === 'cover' ? null : (
    <div style={fieldGap}>
      <label style={labelStyle}>Postura suggerita</label>
      <CustomSelect
        value={((page as any).postura as string) || 'nessuna'}
        onChange={(v) => onChange({ postura: (v as any) })}
        options={[
          { value: 'nessuna', label: '— nessuna —' },
          { value: 'piedi', label: 'In piedi' },
          { value: 'seduti', label: 'Seduti' },
          { value: 'ginocchio', label: 'In ginocchio' },
        ]}
      />
    </div>
  );

  const txtField = (label: string, value: string, set: (v: string) => void, opts?: { multiline?: boolean; rows?: number; placeholder?: string; maxLength?: number }) => (
    <div style={fieldGap}>
      <label style={labelStyle}>{label}</label>
      <div style={{ ...inputWrapStyle, alignItems: opts?.multiline ? 'flex-start' : 'center' }}>
        <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0, marginTop: opts?.multiline ? '3px' : 0 }} />
        {opts?.multiline ? (
          <textarea
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={opts.placeholder}
            rows={opts.rows || 3}
            style={{ ...inputStyle, resize: 'vertical' }}
            maxLength={opts.maxLength || 5000}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={opts?.placeholder}
            style={inputStyle}
            maxLength={opts?.maxLength || 200}
          />
        )}
      </div>
    </div>
  );

  // Usa CustomSelect (consistente con CustomFontSelect / dropdown del resto
  // dell'editor). NIENTE <select> nativo — quello mostrava OS-chrome (dark
  // su macOS) totalmente fuori contesto rispetto al design.
  const selectField = <T extends string>(label: string, value: T, set: (v: T) => void, options: { value: T; label: string }[]) => (
    <div style={fieldGap}>
      <label style={labelStyle}>{label}</label>
      <CustomSelect<T>
        value={value}
        onChange={set}
        options={options}
      />
    </div>
  );

  switch (page.type) {
    case 'cover':
      return <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>La copertina si modifica nella tab "Copertina".</p>;

    case 'intro':
      return (
        <>
          {txtField('Titolo', page.titolo, (v) => onChange({ titolo: v }), { placeholder: 'es. Riti di Introduzione' })}
          {txtField('Testo', page.testo || '', (v) => onChange({ testo: v }), { multiline: true, rows: 4 })}
          {posturaSelect}
        </>
      );

    case 'lettura': {
      // Modalità derivata SOLO da testoCompleto: se c'è testo custom, siamo
      // in "scrivi a mano". `letturaId` può convivere con testoCompleto
      // (lo lasciamo nei dati per quando l'utente ritorna a "scegli dall'elenco"
      // — così non perde la sua selezione precedente).
      const mode: 'preset' | 'custom' = page.testoCompleto ? 'custom' : 'preset';

      // Lettura "consigliata" simmetrica: se la pagina seguente (salmo) ha un
      // salmoId scelto, marchiamo come consigliate le letture che hanno
      // quel salmo come abbinamento. Così se l'utente cambia il salmo,
      // qui vede subito le letture che si "sposano" con quel salmo.
      const myIdx = libretto?.pages.findIndex((pp) => pp.id === page.id) ?? -1;
      const nextPage = myIdx >= 0 ? libretto?.pages[myIdx + 1] : undefined;
      const recSalmoNum = (nextPage && nextPage.type === 'salmo' && nextPage.salmoId)
        ? Number(nextPage.salmoId.replace('sal-', '')) || null
        : null;
      const allLetture = [...LETTURE_AT, ...LETTURE_TEMPO_PASQUALE, ...LETTURE_NT];
      const recommendedLetture = recSalmoNum
        ? allLetture.filter((r) => r.salmoCorrispondente === recSalmoNum)
        : [];
      const recIds = new Set(recommendedLetture.map((r) => r.id));

      // Strategia gruppi (sostituisce vecchio sistema `★` / `✦` prefisso):
      // 1. "Abbinata alla tua scelta" — letture che combaciano con il salmo
      //    già scelto nella pagina successiva. Visibili solo se applicabile.
      // 2. "Le più scelte dai matrimoni" — letture popolari (popolare: true)
      //    raggruppate insieme in cima dopo gli abbinamenti.
      // 3. Categorie originali (AT / Tempo Pasquale / NT) per le restanti.
      // Niente più simboli unicode nei label né legend confusionarie.
      const popolariIds = new Set(
        allLetture.filter((r) => r.popolare).map((r) => r.id),
      );
      const letturaOptions = [
        ...recommendedLetture.map((r) => ({
          value: r.id,
          label: r.titolo,
          description: `${r.ref} · abbinata al salmo che hai scelto`,
          group: 'Abbinata alla tua scelta',
        })),
        ...allLetture
          .filter((r) => r.popolare && !recIds.has(r.id))
          .map((r) => ({
            value: r.id,
            label: r.titolo,
            description: `${r.ref}${r.salmoCorrispondente ? ` · abbinata al Salmo ${r.salmoCorrispondente}` : ''}`,
            group: 'Le più scelte dai matrimoni',
          })),
        ...LETTURE_AT
          .filter((r) => !recIds.has(r.id) && !popolariIds.has(r.id))
          .map((r) => ({
            value: r.id,
            label: r.titolo,
            description: `${r.ref}${r.salmoCorrispondente ? ` · abbinata al Salmo ${r.salmoCorrispondente}` : ''}`,
            group: 'Antico Testamento',
          })),
        ...LETTURE_TEMPO_PASQUALE
          .filter((r) => !recIds.has(r.id) && !popolariIds.has(r.id))
          .map((r) => ({
            value: r.id,
            label: r.titolo,
            description: `${r.ref}${r.salmoCorrispondente ? ` · abbinata al Salmo ${r.salmoCorrispondente}` : ''}`,
            group: 'Tempo Pasquale',
          })),
        ...LETTURE_NT
          .filter((r) => !recIds.has(r.id) && !popolariIds.has(r.id))
          .map((r) => ({
            value: r.id,
            label: r.titolo,
            description: r.ref,
            group: 'Nuovo Testamento',
          })),
      ];

      return (
        <>
          {selectField('Modalità', mode, (v) => {
            if (v === 'preset') {
              // Torna a "scegli dall'elenco": pulisco testoCompleto così
              // il renderer ricade sul testo della lettura selezionata
              // (letturaId resta intatto — l'utente non perde la scelta).
              onChange({ testoCompleto: undefined });
            } else {
              // Switch a "scrivi a mano": pre-popolo il textarea con il
              // testo della lettura attualmente selezionata, così l'utente
              // parte dal testo e lo modifica invece che da pagina vuota.
              const l = page.letturaId ? findLettura(page.letturaId) : undefined;
              onChange({ testoCompleto: l?.testoCompleto || page.testoCompleto || ' ' });
            }
          }, [
            { value: 'preset', label: "Scegli dall'elenco" },
            { value: 'custom', label: 'Scrivi il testo a mano' },
          ])}

          {mode === 'preset' && (
            <div style={fieldGap}>
              <label style={labelStyle}>Lettura</label>
              <CustomSelect
                value={page.letturaId || ''}
                onChange={(v) => onChange({ letturaId: v || undefined })}
                placeholder="— scegli dall'elenco —"
                options={letturaOptions}
              />
              {page.letturaId && (() => {
                const l = findLettura(page.letturaId);
                if (!l) return null;
                return l.salmoCorrispondente ? (
                  <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '4px 0 0', lineHeight: 1.4 }}>
                    Salmo abbinato: <strong>{l.salmoCorrispondente}</strong> (preselezionato sotto).
                  </p>
                ) : null;
              })()}
            </div>
          )}

          {mode === 'custom' && txtField(
            'Testo della lettura',
            page.testoCompleto || '',
            (v) => onChange({ testoCompleto: v }),
            { multiline: true, rows: 8, placeholder: 'Incolla qui il testo della lettura.' },
          )}

          {posturaSelect}
        </>
      );
    }

    case 'salmo': {
      // Salmo "consigliato" dalla lettura precedente: se l'utente è andato
      // su un altro salmo, mostriamo il consigliato come pin in cima al
      // dropdown con un'etichetta dedicata, così può tornarci facilmente
      // senza ricordarsi il numero.
      const myIdx = libretto?.pages.findIndex((pp) => pp.id === page.id) ?? -1;
      const prev = myIdx > 0 ? libretto?.pages[myIdx - 1] : undefined;
      const recommendedSalmoId = (prev && prev.type === 'lettura' && prev.letturaId)
        ? (() => {
            const l = findLettura(prev.letturaId);
            return l?.salmoCorrispondente ? `sal-${l.salmoCorrispondente}` : null;
          })()
        : null;

      const mode: 'preset' | 'custom' = page.testoCompleto ? 'custom' : 'preset';

      // Gruppi descrittivi (sostituisce vecchio sistema `★` / `✦` prefisso):
      // 1. "Abbinato alla tua scelta" — salmo che combacia con la lettura
      //    già scelta nella pagina precedente. Solo se applicabile.
      // 2. "I più scelti dai matrimoni" — salmi popolari.
      // 3. "Tutti i salmi" — restanti per esplorazione completa.
      const recOption = recommendedSalmoId
        ? SALMI.find((r) => r.id === recommendedSalmoId)
        : undefined;
      const salmoOptions = [
        ...(recOption ? [{
          value: recOption.id,
          label: recOption.ref,
          description: 'Abbinato alla lettura che hai scelto',
          group: 'Abbinato alla tua scelta',
        }] : []),
        ...SALMI
          .filter((r) => r.id !== recommendedSalmoId && r.popolare)
          .map((r) => ({
            value: r.id,
            label: r.ref,
            description: r.titolo.length > 80 ? r.titolo.substring(0, 80) + '…' : r.titolo,
            group: 'I più scelti dai matrimoni',
          })),
        ...SALMI
          .filter((r) => r.id !== recommendedSalmoId && !r.popolare)
          .map((r) => ({
            value: r.id,
            label: r.ref,
            description: r.titolo.length > 80 ? r.titolo.substring(0, 80) + '…' : r.titolo,
            group: 'Tutti i salmi',
          })),
      ];

      return (
        <>
          {selectField('Modalità', mode, (v) => {
            if (v === 'preset') {
              onChange({ testoCompleto: undefined });
            } else {
              const s = page.salmoId ? SALMI.find((x) => x.id === page.salmoId) : undefined;
              onChange({ testoCompleto: s?.testoCompleto || page.testoCompleto || ' ' });
            }
          }, [
            { value: 'preset', label: "Scegli dall'elenco" },
            { value: 'custom', label: 'Scrivi il testo a mano' },
          ])}

          {mode === 'preset' && (
            <>
              <div style={fieldGap}>
                <label style={labelStyle}>Salmo</label>
                <CustomSelect
                  value={page.salmoId || ''}
                  onChange={(v) => {
                    // Auto-popola ritornello dall'antifona del salmo, ma solo
                    // se l'utente non ha già scritto un ritornello custom
                    // diverso (così non sovrascriviamo lavoro suo).
                    const next: Partial<LibrettoPage> = { salmoId: v || undefined };
                    if (v) {
                      const sal = SALMI.find((s) => s.id === v);
                      const currentlyEmpty = !page.ritornello || page.ritornello.trim() === '';
                      const currentlyAuto = page.salmoId && SALMI.find((s) => s.id === page.salmoId)?.ritornello === page.ritornello;
                      if (sal?.ritornello && (currentlyEmpty || currentlyAuto)) {
                        (next as any).ritornello = sal.ritornello;
                      }
                    }
                    onChange(next);
                  }}
                  placeholder="— scegli dall'elenco —"
                  options={salmoOptions}
                />
              </div>
              {/* Ritornello auto-popolato dall'antifona standard del salmo
                  scelto. L'utente può modificarlo se vuole una variante. */}
              {txtField('Ritornello', page.ritornello || '', (v) => onChange({ ritornello: v }), { placeholder: 'Antifona del salmo' })}
            </>
          )}

          {mode === 'custom' && (
            <>
              {txtField('Ritornello', page.ritornello || '', (v) => onChange({ ritornello: v }), { placeholder: 'es. Beato chi teme il Signore' })}
              {txtField('Testo del salmo', page.testoCompleto || '', (v) => onChange({ testoCompleto: v }), { multiline: true, rows: 6, placeholder: 'Versetti del salmo, separati da riga vuota.' })}
            </>
          )}

          {posturaSelect}
        </>
      );
    }

    case 'vangelo': {
      const mode: 'preset' | 'custom' = page.testoCompleto ? 'custom' : 'preset';
      return (
        <>
          {selectField('Modalità', mode, (v) => {
            if (v === 'preset') {
              onChange({ testoCompleto: undefined });
            } else {
              const vg = page.vangeloId ? findLettura(page.vangeloId) : undefined;
              onChange({ testoCompleto: vg?.testoCompleto || page.testoCompleto || ' ' });
            }
          }, [
            { value: 'preset', label: "Scegli dall'elenco" },
            { value: 'custom', label: 'Scrivi il testo a mano' },
          ])}

          {mode === 'preset' && (
            <div style={fieldGap}>
              <label style={labelStyle}>Vangelo</label>
              <CustomSelect
                value={page.vangeloId || ''}
                onChange={(v) => onChange({ vangeloId: v || undefined })}
                placeholder="— scegli dall'elenco —"
                options={[
                  // Stessa strategia di letture/salmi: gruppi descrittivi al
                  // posto del prefisso `★`. Popolari in cima, resto sotto.
                  ...VANGELI.filter((r) => r.popolare).map((r) => ({
                    value: r.id,
                    label: r.titolo,
                    description: r.ref,
                    group: 'I più scelti dai matrimoni',
                  })),
                  ...VANGELI.filter((r) => !r.popolare).map((r) => ({
                    value: r.id,
                    label: r.titolo,
                    description: r.ref,
                    group: 'Tutti i passi del Vangelo',
                  })),
                ]}
              />
            </div>
          )}

          {mode === 'custom' && txtField(
            'Testo del Vangelo',
            page.testoCompleto || '',
            (v) => onChange({ testoCompleto: v }),
            { multiline: true, rows: 8, placeholder: 'Incolla qui il passo del Vangelo.' },
          )}

          {posturaSelect}
        </>
      );
    }

    case 'canto': {
      // Mode: 'preset' (canto scelto dall'elenco PD) vs 'custom' (titolo+testo
      // scritti dall'utente). I campi modificabili sono visibili solo in custom.
      const isPreset = CANTI_SUGGERITI.some((c) => c.titolo === page.titolo);
      return (
        <>
          <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Scegli un canto dall'elenco oppure inserisci titolo e testo personalizzati.
          </p>

          <div style={fieldGap}>
            <label style={labelStyle}>Canto</label>
            <CustomSelect<string>
              value={isPreset ? page.titolo : '__custom__'}
              onChange={(v) => {
                if (v === '__custom__') {
                  if (isPreset) onChange({ titolo: '', testo: '' });
                  return;
                }
                const c = CANTI_SUGGERITI.find((x) => x.titolo === v);
                if (!c) return;
                onChange({ titolo: c.titolo, testo: c.testo || '' });
              }}
              placeholder="— scegli un canto —"
              options={[
                ...CANTI_SUGGERITI.map((c) => ({
                  value: c.titolo, label: c.titolo,
                })),
                { value: '__custom__', label: 'Personalizzato' },
              ]}
            />
          </div>

          {/* Campi modificabili: visibili SOLO in modalità personalizzata.
              Se l'utente ha scelto un canto preset col testo PD, non ha
              senso mostrargli il textarea — il testo è già fissato. */}
          {!isPreset && (
            <>
              {txtField('Titolo del canto', page.titolo, (v) => onChange({ titolo: v }), { placeholder: 'es. Inno alla gioia' })}
              {txtField('Testo del canto', page.testo || '', (v) => onChange({ testo: v }), {
                multiline: true, rows: 8,
                placeholder: 'Strofe e ritornello.',
              })}
            </>
          )}

          {posturaSelect}
        </>
      );
    }

    case 'interrogazioni':
      return (
        <>
          {selectField('Testo della pagina', page.useTemplate ? 'template' : 'custom', (v) => onChange(buildToggleTemplateChange(page, libretto, v as 'template' | 'custom')), [
            { value: 'template', label: 'Testo standard con i vostri nomi' },
            { value: 'custom', label: 'Scrivi il tuo testo' },
          ])}
          {!page.useTemplate && txtField('Il tuo testo', page.testoCustom || '', (v) => onChange({ testoCustom: v }), { multiline: true, rows: 6 })}
          {posturaSelect}
        </>
      );

    case 'consenso':
      return (
        <>
          {selectField('Forma del consenso', page.forma, (v) => onChange({ forma: v as any }), [
            { value: 'dichiarativo', label: 'Dichiarativa ("Io accolgo te...")' },
            { value: 'interrogativo', label: 'Interrogativa ("Vuoi accogliere...")' },
          ])}
          {txtField('Testo personalizzato (opzionale)', page.testoCustom || '', (v) => onChange({ testoCustom: v }), { multiline: true, rows: 5, placeholder: 'Lascia vuoto per usare il testo standard con i vostri nomi.' })}
          {posturaSelect}
        </>
      );

    case 'anelli':
      return (
        <>
          {selectField('Testo della pagina', page.useTemplate ? 'template' : 'custom', (v) => onChange(buildToggleTemplateChange(page, libretto, v as 'template' | 'custom')), [
            { value: 'template', label: 'Testo standard con i vostri nomi' },
            { value: 'custom', label: 'Scrivi il tuo testo' },
          ])}
          {!page.useTemplate && txtField('Il tuo testo', page.testoCustom || '', (v) => onChange({ testoCustom: v }), { multiline: true, rows: 5 })}
          {posturaSelect}
        </>
      );

    case 'preghiere-fedeli':
      return (
        <>
          {txtField('Ritornello', page.ritornello || '', (v) => onChange({ ritornello: v }))}
          <div style={fieldGap}>
            <label style={labelStyle}>Intenzioni</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {page.intenzioni.map((int, i) => (
                <div key={i} style={{ ...inputWrapStyle, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginTop: '3px' }}>{i + 1}.</span>
                  <textarea
                    value={int}
                    onChange={(e) => {
                      const intenzioni = [...page.intenzioni];
                      intenzioni[i] = e.target.value;
                      onChange({ intenzioni });
                    }}
                    rows={2}
                    placeholder={`Intenzione ${i + 1}`}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({ intenzioni: page.intenzioni.filter((_, j) => j !== i) })}
                    style={{ padding: '4px', minWidth: 'auto', color: '#c0392b' }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              <Button
                variant="subtle"
                size="sm"
                onClick={() => onChange({ intenzioni: [...page.intenzioni, ''] })}
                style={{ justifyContent: 'center', fontSize: '11px' }}
              >
                <Plus size={11} style={{ marginRight: 4 }} /> Aggiungi intenzione
              </Button>
            </div>
          </div>
          {posturaSelect}
        </>
      );

    case 'padre-nostro':
      return (
        <>
          <p style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
            Il testo del Padre Nostro è fisso e mostrato nella forma liturgica italiana.
          </p>
          {posturaSelect}
        </>
      );

    case 'benedizione-nuziale': {
      // 4 formule ufficiali del Rito CEI 2008 (nn. 85-88) selezionabili,
      // oppure scrittura libera. UX coerente con lettura/salmo/vangelo.
      const useTpl = page.useTemplate !== false;
      const mode: 'preset' | 'custom' = useTpl ? 'preset' : 'custom';
      return (
        <>
          {selectField('Modalità', mode, (v) => {
            if (v === 'preset') {
              onChange({ useTemplate: true, testoCustom: '' });
            } else {
              // Switch a custom: pre-popola testoCustom con la formula
              // attualmente selezionata, così l'utente parte dal testo
              // ufficiale e lo modifica.
              const f = page.formulaId ? findBenedizioneNuziale(page.formulaId) : undefined;
              const s1 = libretto?.cover.sposo1 || '';
              const s2 = libretto?.cover.sposo2 || '';
              // Convenzione fissa: sposo1 = sposo (uomo), sposo2 = sposa (donna).
              const sposoName = s1 || '___';
              const sposaName = s2 || '___';
              const filled = f
                ? f.testoCompleto
                    .replaceAll('{sposo1}', sposoName)
                    .replaceAll('{sposo2}', sposaName)
                    .replaceAll('{sposo}', sposoName)
                    .replaceAll('{sposa}', sposaName)
                : '';
              onChange({ useTemplate: false, testoCustom: filled || page.testoCustom || ' ' });
            }
          }, [
            { value: 'preset', label: "Scegli dall'elenco" },
            { value: 'custom', label: 'Scrivi il testo a mano' },
          ])}

          {mode === 'preset' && (
            <div style={fieldGap}>
              <label style={labelStyle}>Formula della benedizione</label>
              <CustomSelect<string>
                value={page.formulaId || ''}
                onChange={(v) => onChange({ formulaId: v || 'ben-85' })}
                placeholder="— scegli formula —"
                options={BENEDIZIONI_NUZIALI.map((b) => ({
                  value: b.id,
                  label: b.titolo,
                  description: b.incipit,
                }))}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '6px 0 0', lineHeight: 1.4 }}>
                Sono le 4 formule ufficiali del Rito del Matrimonio CEI 2008. Tutte equivalenti — gli sposi scelgono insieme al celebrante.
              </p>
            </div>
          )}

          {mode === 'custom' && txtField(
            'Testo della benedizione',
            page.testoCustom || '',
            (v) => onChange({ testoCustom: v }),
            { multiline: true, rows: 10, placeholder: 'Testo personalizzato della benedizione nuziale.' },
          )}

          {posturaSelect}
        </>
      );
    }

    case 'dedica':
      return (
        <>
          {txtField('Titolo', page.titolo, (v) => onChange({ titolo: v }), { placeholder: 'es. Un pensiero per i nonni' })}
          {txtField('Testo', page.testo, (v) => onChange({ testo: v }), { multiline: true, rows: 4 })}
        </>
      );

    case 'ringraziamenti':
      return txtField('Testo dei ringraziamenti', page.testo, (v) => onChange({ testo: v }), { multiline: true, rows: 5 });

    case 'photo':
      return (
        <>
          <div style={fieldGap}>
            <label style={labelStyle}>Foto</label>
            {page.url ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <img
                  src={page.url}
                  alt={page.caption || ''}
                  style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                />
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => pagePhotoRef.current?.click()}
                  disabled={uploadingPagePhoto}
                  style={{ flex: 1, fontSize: '11px' }}
                >
                  {uploadingPagePhoto ? <><Loader2 size={12} className="spin" /> Carico…</> : 'Cambia foto'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ url: '' } as any)}
                  style={{ fontSize: '11px', color: '#c0392b' }}
                  title="Rimuovi foto"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ) : (
              <Button
                variant="subtle"
                onClick={() => pagePhotoRef.current?.click()}
                disabled={uploadingPagePhoto || !slug}
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              >
                {uploadingPagePhoto ? (
                  <><Loader2 size={13} className="spin" /> Carico…</>
                ) : (
                  <><ImageIcon size={13} style={{ marginRight: 6 }} /> Carica foto dal dispositivo</>
                )}
              </Button>
            )}
            <input
              ref={pagePhotoRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadPhoto(f);
                if (e.target) e.target.value = '';
              }}
              style={{ display: 'none' }}
            />
          </div>
          {txtField('Didascalia (opzionale)', page.caption || '', (v) => onChange({ caption: v }))}
        </>
      );

    case 'custom':
      return (
        <>
          {txtField('Titolo', page.titolo, (v) => onChange({ titolo: v }))}
          {txtField('Testo', page.testo, (v) => onChange({ testo: v }), { multiline: true, rows: 5 })}
        </>
      );

    /* ─── Nuovi tipi ─── */
    case 'memoria-battesimo':
    case 'gloria':
    case 'colletta':
    case 'orazione-offerte':
    case 'rito-pace':
    case 'agnello-dio':
    case 'orazione-comunione':
    case 'atto-matrimonio-civile':
      return (
        <>
          <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Testo liturgico standard auto-popolato con i nomi degli sposi.
            Puoi lasciarlo così o sostituirlo con un testo personalizzato.
          </p>
          {selectField('Testo della pagina', page.useTemplate === false ? 'custom' : 'template', (v) => onChange(buildToggleTemplateChange(page, libretto, v as 'template' | 'custom')), [
            { value: 'template', label: 'Testo standard con i vostri nomi' },
            { value: 'custom', label: 'Scrivi il tuo testo' },
          ])}
          {page.useTemplate === false && txtField('Il tuo testo', page.testoCustom || '', (v) => onChange({ testoCustom: v }), { multiline: true, rows: 6 })}
          {posturaSelect}
        </>
      );

    case 'litanie-santi':
      return (
        <>
          <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.4 }}>
            La risposta è automatica: <strong>"prega per noi"</strong> per santi singoli
            (Santa/San/Sant'…), <strong>"pregate per noi"</strong> per gruppi (Santi/Sante/Tutti…).
          </p>
          <div style={fieldGap}>
            <label style={labelStyle}>Lista Santi (uno per riga)</label>
            <div style={{ ...inputWrapStyle, alignItems: 'flex-start' }}>
              <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0, marginTop: '3px' }} />
              <textarea
                // NOTA: NIENTE `.filter(Boolean)` qui — strippare righe vuote
                // durante la digitazione fa perdere la riga appena creata
                // con Invio (textarea controllata si "resetta" senza newline
                // finale e il cursore salta indietro). Manteniamo le righe
                // vuote nei dati; il renderer filtra a render time.
                value={(page.santi || []).join('\n')}
                onChange={(e) => onChange({ santi: e.target.value.split('\n') })}
                placeholder="Lascia vuoto per usare la lista default. Un santo per riga."
                rows={6}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
          {posturaSelect}
        </>
      );

    case 'riti-conclusione': {
      // 3 formule ufficiali del Rito CEI 2008 (n. 92) selezionabili,
      // oppure benedizioni personalizzate. UX coerente con benedizione-nuziale.
      // Back-compat: se la pagina ha `benedizioni` legacy ma niente formulaId,
      // forza modalità custom (l'utente aveva già editato manualmente).
      const hasLegacy = page.benedizioni && page.benedizioni.length > 0;
      const useTpl = page.useTemplate !== false && !hasLegacy;
      const mode: 'preset' | 'custom' = useTpl ? 'preset' : 'custom';
      const customBen = page.benedizioniCustom && page.benedizioniCustom.length
        ? page.benedizioniCustom
        : (page.benedizioni || []);
      return (
        <>
          <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Benedizione del sacerdote (con risposta "Amen" dopo ciascuna) + congedo finale.
          </p>
          {selectField('Modalità', mode, (v) => {
            if (v === 'preset') {
              onChange({ useTemplate: true, benedizioniCustom: [], benedizioni: [] });
            } else {
              // Switch a custom: pre-popola benedizioniCustom con la formula
              // attualmente selezionata, così l'utente parte dal testo
              // ufficiale e lo modifica.
              const f = page.formulaId ? findBenedizioneFinale(page.formulaId) : BENEDIZIONI_FINALI[0];
              onChange({
                useTemplate: false,
                benedizioniCustom: customBen.length ? customBen : (f?.benedizioni || []),
                benedizioni: [],
              });
            }
          }, [
            { value: 'preset', label: "Scegli dall'elenco" },
            { value: 'custom', label: 'Scrivi le benedizioni a mano' },
          ])}

          {mode === 'preset' && (
            <div style={fieldGap}>
              <label style={labelStyle}>Formula della benedizione finale</label>
              <CustomSelect<string>
                value={page.formulaId || 'fin-1'}
                onChange={(v) => onChange({ formulaId: v || 'fin-1' })}
                placeholder="— scegli formula —"
                options={BENEDIZIONI_FINALI.map((b) => ({
                  value: b.id,
                  label: b.titolo,
                  description: b.incipit,
                }))}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '6px 0 0', lineHeight: 1.4 }}>
                Sono le 3 formule ufficiali del Rito del Matrimonio CEI 2008. Ognuna include 3 benedizioni specifiche + benedizione trinitaria finale.
              </p>
            </div>
          )}

          {mode === 'custom' && (
            <div style={fieldGap}>
              <label style={labelStyle}>Benedizioni (separate da riga vuota)</label>
              <div style={{ ...inputWrapStyle, alignItems: 'flex-start' }}>
                <Pencil size={12} style={{ color: 'var(--text-soft)', flexShrink: 0, marginTop: '3px' }} />
                <textarea
                  value={customBen.join('\n\n')}
                  onChange={(e) => onChange({ benedizioniCustom: e.target.value.split('\n\n').map(s => s.trim()).filter(Boolean), benedizioni: [] })}
                  placeholder="Una benedizione per blocco. Separa con riga vuota."
                  rows={10}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {posturaSelect}
        </>
      );
    }

    case 'dedica-iniziale':
      return (
        <>
          <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Citazione iniziale del libretto (es. frase di Sant'Agostino, di Papa Francesco, ecc.).
          </p>
          {txtField('Citazione', page.citazione, (v) => onChange({ citazione: v }), { multiline: true, rows: 4, placeholder: 'Ama e fa\' ciò che vuoi…' })}
          {txtField('Autore (opz.)', page.autore || '', (v) => onChange({ autore: v }), { placeholder: 'es. Sant\'Agostino' })}
        </>
      );

    case 'racconto':
      return (
        <>
          <p style={{ fontSize: '11px', color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Pagina libera per un racconto, una poesia o un brano significativo (es. "L'isola dei sentimenti").
          </p>
          {txtField('Titolo', page.titolo, (v) => onChange({ titolo: v }), { placeholder: 'es. L\'isola dei sentimenti' })}
          {txtField('Testo', page.testo, (v) => onChange({ testo: v }), { multiline: true, rows: 8 })}
        </>
      );
  }
};

/* ─────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────── */

export function describePage(p: LibrettoPage): string {
  switch (p.type) {
    case 'cover': return 'pagina iniziale';
    case 'intro': return p.titolo || 'introduzione';
    case 'lettura': return p.letturaId || 'da scegliere';
    case 'salmo': return p.salmoId || 'da scegliere';
    case 'vangelo': return p.vangeloId || 'da scegliere';
    case 'canto': return `${p.momento}${p.titolo ? ': ' + p.titolo : ''}`;
    case 'interrogazioni': return p.useTemplate ? 'standard' : 'personalizzato';
    case 'consenso': return p.forma === 'dichiarativo' ? 'dichiarativo' : 'interrogativo';
    case 'anelli': return p.useTemplate ? 'standard' : 'personalizzato';
    case 'preghiere-fedeli': return `${p.intenzioni.length} intenzioni`;
    case 'padre-nostro': return 'testo standard';
    case 'benedizione-nuziale': return p.testoCustom ? 'personalizzata' : 'standard';
    case 'dedica': return p.titolo;
    case 'ringraziamenti': return 'finale';
    case 'photo': return p.caption || 'foto';
    case 'custom': return p.titolo || 'pagina libera';
    case 'memoria-battesimo': return p.useTemplate === false ? 'personalizzato' : 'standard';
    case 'gloria': return 'Inno di Lode';
    case 'colletta': return p.useTemplate === false ? 'personalizzata' : 'standard';
    case 'litanie-santi': return p.santi && p.santi.length ? `${p.santi.length} santi` : 'lista standard';
    case 'orazione-offerte': return p.useTemplate === false ? 'personalizzata' : 'standard';
    case 'rito-pace': return p.useTemplate === false ? 'personalizzato' : 'standard';
    case 'agnello-dio': return 'Agnello + Ecce Agnus';
    case 'orazione-comunione': return p.useTemplate === false ? 'personalizzata' : 'standard';
    case 'riti-conclusione': {
      const f = p.formulaId ? findBenedizioneFinale(p.formulaId) : undefined;
      const useTpl = p.useTemplate !== false && !(p.benedizioni && p.benedizioni.length);
      if (useTpl && f) return `${f.titolo}`;
      const customCount = (p.benedizioniCustom?.length || p.benedizioni?.length || 0);
      return customCount ? `${customCount} benedizioni custom` : 'personalizzata';
    }
    case 'atto-matrimonio-civile': return 'art. 143/144/147';
    case 'dedica-iniziale': return p.autore || 'citazione';
    case 'racconto': return p.titolo || 'racconto';
    case 'indice': return p.profondita === 'dettaglio' ? 'tutte le pagine' : 'macro-sezioni';
  }
}

export default LibrettoSidebar;
