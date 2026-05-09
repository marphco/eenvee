/**
 * LibrettoEditorModal — modal full-screen per modificare il libretto messa.
 *
 * Layout desktop (3 colonne):
 *   ┌─ TOC ─┬── Preview pagina ──┬── Form Editor ──┐
 *
 * Layout mobile (stacked):
 *   ┌────── Preview pagina ──────┐
 *   │── (drawer indice swipe-up)─│
 *   └────── Form Editor ─────────┘
 *
 * Caratteristiche:
 *  - Wizard lineare con bottoni Indietro/Avanti che attraversano TUTTE
 *    le pagine in ordine (no auto-skip — utente vede ogni pagina anche
 *    quelle con testo standard, può sempre saltarle via TOC se preferisce).
 *  - TOC raggruppato per sezione liturgica (apertura, introduzione,
 *    parola, matrimonio, eucaristica, conclusione, extra), sezioni
 *    collassabili.
 *  - Jump-to-page: input numerico cliccabile in top bar.
 *  - Preview = rendering statico della pagina corrente (non sfogliabile),
 *    perché in editing serve vedere la pagina che si sta modificando, non
 *    sfogliarla. Per sfogliarla c'è il bottone "Anteprima" nella sidebar
 *    canvas (LibrettoBooklet completo).
 *  - Autosave silenzioso ad ogni modifica (gli updates vengono salvati
 *    direttamente in widgetProps via onUpdateLibretto).
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Plus, ListTree, Check, Undo2 } from 'lucide-react';
import { Button } from '../../../../../ui';
import type { LibrettoData, LibrettoPage, SezioneLiturgica } from '../../../../../utils/libretto/types';
import { PAGE_TYPE_LABEL, LABEL_SEZIONE, resolveSezioneInContext, HIDE_CANTI_PAGES } from '../../../../../utils/libretto/types';
import { newPage } from '../../../../../utils/libretto/templates';
import { findLettura, SALMI } from '../../../../../utils/libretto/cei';
import { paginatePage } from '../../../../../utils/libretto/paginate';
import LibrettoPageRenderer from './LibrettoPageRenderer';
import { PageEditor, describePage } from '../../sidebar/LibrettoSidebar';
import { apiFetch } from '../../../../../utils/apiFetch';

interface Props {
  open: boolean;
  onClose: () => void;
  libretto: LibrettoData;
  onUpdate: (next: LibrettoData) => void;
  slug?: string | undefined;
}

const SEZIONE_ORDER: SezioneLiturgica[] = [
  'apertura', 'introduzione', 'parola', 'matrimonio', 'eucaristica', 'conclusione', 'extra',
];

/** Stato pagina nel TOC: completata vs default vs corrente. */
type PageStatus = 'corrente' | 'modificata' | 'default' | 'non-vista';

/**
 * Stato pagina nel TOC: solo "corrente" è colorata, tutto il resto è neutro.
 *
 * Distinzione precedente "default vs modificata" era confusionaria perché:
 * (a) molte pagine usano un template standard ma sono già "complete",
 * (b) flag come `useTemplate=false` rimanevano dopo un toggle, dando falsi
 *     positivi di "modificata" che facevano sembrare attiva una pagina
 *     che l'utente non aveva selezionato.
 *
 * Modello attuale: green dot = stai editando QUESTA pagina, gray = tutto il
 * resto. Se in futuro serve mostrare "letture/salmi/vangeli da scegliere",
 * lo facciamo con un'icona separata accanto al titolo invece che col dot.
 */
function pageStatus(_p: LibrettoPage, isCurrent: boolean): PageStatus {
  return isCurrent ? 'corrente' : 'default';
}

const STATUS_DOT: Record<PageStatus, { color: string; label: string }> = {
  corrente: { color: 'var(--accent)', label: 'In modifica' },
  modificata: { color: '#10b981', label: 'Modificata' },
  default: { color: '#d1d5db', label: 'Testo standard' },
  'non-vista': { color: '#e5e7eb', label: 'Non vista' },
};

const LibrettoEditorModal: React.FC<Props> = ({ open, onClose, libretto, onUpdate, slug }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [collapsedSezioni, setCollapsedSezioni] = useState<Set<SezioneLiturgica>>(new Set());
  const [tocOpenMobile, setTocOpenMobile] = useState(false);
  const [jumpInputValue, setJumpInputValue] = useState('');
  const [editingJump, setEditingJump] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [uploadingPagePhoto, setUploadingPagePhoto] = useState<number | null>(null);
  const pagePhotoFileRef = useRef<HTMLInputElement | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const [confirmDeletePage, setConfirmDeletePage] = useState(false);

  // Undo: stack di snapshot LibrettoData precedenti. Spinge la "previous
  // stable" snapshot dopo 500ms di stabilità (debounce) per evitare di creare
  // un entry per ogni keystroke. Cap a 50 entry.
  const historyRef = useRef<LibrettoData[]>([]);
  const lastSnapshotRef = useRef<LibrettoData>(libretto);
  const [historyVersion, setHistoryVersion] = useState(0);

  // Detect mobile
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 900);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Reset to first page when opening
  useEffect(() => {
    if (open) setCurrentIdx(0);
  }, [open]);

  // Se currentIdx finisce su una pagina oscurata (canto), salta alla
  // prossima visibile. Succede dopo riordino o feature-flag toggle.
  useEffect(() => {
    if (!open) return;
    const cur = libretto.pages[currentIdx];
    if (cur && HIDE_CANTI_PAGES && cur.type === 'canto') {
      const next = libretto.pages.findIndex((p, i) => i > currentIdx && p.type !== 'canto');
      const prev = [...libretto.pages].reverse()
        .findIndex((p, ri) => (libretto.pages.length - 1 - ri) < currentIdx && p.type !== 'canto');
      const fallback = next >= 0 ? next
        : (prev >= 0 ? libretto.pages.length - 1 - prev : 0);
      setCurrentIdx(fallback);
    }
  }, [open, currentIdx, libretto.pages]);

  // Trigger save indicator pulse on libretto change
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setSavedTick(t => t + 1), 200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libretto.pages, libretto.cover, libretto.style]);

  // Push previous stable snapshot to history dopo 500ms di stabilità.
  // Senza debounce, ogni keystroke = un entry → undo inutilizzabile.
  useEffect(() => {
    if (!open) return;
    if (lastSnapshotRef.current === libretto) return;
    const id = window.setTimeout(() => {
      if (lastSnapshotRef.current !== libretto) {
        historyRef.current.push(lastSnapshotRef.current);
        if (historyRef.current.length > 50) historyRef.current.shift();
        lastSnapshotRef.current = libretto;
        setHistoryVersion((v) => v + 1);
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [libretto, open]);

  // Reset history when modal closes/reopens
  useEffect(() => {
    if (open) {
      historyRef.current = [];
      lastSnapshotRef.current = libretto;
      setHistoryVersion(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset "Sicuro?" confirm quando cambia pagina (evita armato persistente).
  useEffect(() => { setConfirmDeletePage(false); }, [currentIdx]);

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    lastSnapshotRef.current = prev;
    onUpdate(prev);
    setHistoryVersion((v) => v + 1);
  };

  // Keyboard nav: arrows + Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentIdx]);

  // Group pages by sezione (preserve original order within group via numericIdx)
  // Hook chiamato sempre prima dell'early-return per rispettare rules-of-hooks.
  // Grouping context-aware: i canti / intro / photo ereditano la sezione
  // dalla pagina ancoraggio più vicina (vedi resolveSezioneInContext) così
  // l'ordine dei numeri di pagina nell'indice rimane sequenziale e leggibile.
  const grouped = useMemo(() => {
    const map = new Map<SezioneLiturgica, { idx: number; page: LibrettoPage }[]>();
    libretto.pages.forEach((p, i) => {
      // Pagine canto oscurate via feature flag → fuori dal TOC.
      if (HIDE_CANTI_PAGES && p.type === 'canto') return;
      const sez = resolveSezioneInContext(i, libretto.pages);
      if (!map.has(sez)) map.set(sez, []);
      map.get(sez)!.push({ idx: i, page: p });
    });
    return SEZIONE_ORDER
      .map((sez) => ({ sezione: sez, items: map.get(sez) || [] }))
      .filter((g) => g.items.length > 0);
  }, [libretto.pages]);

  /** Indici delle pagine visibili (non oscurate via feature flag). Usato per
   *  navigazione goPrev/goNext: salta automaticamente le canto. */
  const visibleIndices = useMemo(
    () => libretto.pages
      .map((p, i) => (HIDE_CANTI_PAGES && p.type === 'canto' ? -1 : i))
      .filter((i) => i >= 0),
    [libretto.pages],
  );

  if (!open) return null;

  const totalPages = libretto.pages.length;
  const currentPage = libretto.pages[currentIdx];

  const updatePage = (idx: number, next: Partial<LibrettoPage>) => {
    const pages = [...libretto.pages];
    const target = pages[idx];
    if (!target) return;
    const updated = { ...target, ...next } as LibrettoPage;
    pages[idx] = updated;

    // Auto-pair lettura → salmo: se l'utente sceglie una lettura AT con
    // `salmoCorrispondente` e la pagina dopo è un salmo SENZA scelta già
    // fatta, preselezioniamo il salmo abbinato. L'utente può cambiarlo.
    if (updated.type === 'lettura' && (next as any).letturaId !== undefined) {
      const lett = (updated as any).letturaId ? findLettura((updated as any).letturaId) : undefined;
      const corrSalmo = lett?.salmoCorrispondente;
      const nextPage = pages[idx + 1];
      if (corrSalmo && nextPage && nextPage.type === 'salmo' && !nextPage.salmoId) {
        const salId = `sal-${corrSalmo}`;
        const sal = SALMI.find((s) => s.id === salId);
        // Auto-popola anche il ritornello con l'antifona standard.
        pages[idx + 1] = {
          ...nextPage,
          salmoId: salId,
          ...(sal?.ritornello && !nextPage.ritornello ? { ritornello: sal.ritornello } : {}),
        };
      }
    }
    onUpdate({ ...libretto, pages });
  };

  const updateCover = (next: Partial<LibrettoData['cover']>) => {
    onUpdate({ ...libretto, cover: { ...libretto.cover, ...next } });
  };

  const removePage = (idx: number) => {
    if (libretto.pages[idx]?.type === 'cover') return;
    const pages = libretto.pages.filter((_, i) => i !== idx);
    onUpdate({ ...libretto, pages });
    if (currentIdx >= pages.length) setCurrentIdx(Math.max(0, pages.length - 1));
    else if (currentIdx === idx && idx > 0) setCurrentIdx(idx - 1);
    setConfirmDeletePage(false);
  };

  /** Click su Elimina pagina: primo clic arma la conferma per 3s, secondo
   *  clic dentro la finestra elimina. Pattern coerente con TableauSidebar /
   *  Dashboard / RulesSection. */
  const handleDeletePageClick = () => {
    if (confirmDeletePage) {
      removePage(currentIdx);
      return;
    }
    setConfirmDeletePage(true);
    window.setTimeout(() => setConfirmDeletePage(false), 3000);
  };

  const addPageAfter = (idx: number, type: LibrettoPage['type']) => {
    const pages = [...libretto.pages];
    pages.splice(idx + 1, 0, newPage(type));
    onUpdate({ ...libretto, pages });
    setCurrentIdx(idx + 1);
  };

  /** Sposta una pagina su (-1) o giù (+1) nell'indice. Cover e Indice sono
   *  bloccati: non si muovono e non si possono scavalcare. */
  const movePage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    const page = libretto.pages[idx];
    const swap = libretto.pages[target];
    if (!page || !swap) return;
    if (page.type === 'cover' || page.type === 'indice') return;
    if (swap.type === 'cover' || swap.type === 'indice') return;
    const pages = [...libretto.pages];
    pages[idx] = swap;
    pages[target] = page;
    onUpdate({ ...libretto, pages });
    if (currentIdx === idx) setCurrentIdx(target);
    else if (currentIdx === target) setCurrentIdx(idx);
  };

  /** True se la pagina può essere spostata in `dir` (vincoli cover/indice). */
  const canMovePage = (idx: number, dir: -1 | 1): boolean => {
    const target = idx + dir;
    const page = libretto.pages[idx];
    const swap = libretto.pages[target];
    if (!page || !swap) return false;
    if (page.type === 'cover' || page.type === 'indice') return false;
    if (swap.type === 'cover' || swap.type === 'indice') return false;
    return true;
  };

  // goPrev/goNext saltano le pagine oscurate (canto) usando visibleIndices.
  const goPrev = () => setCurrentIdx((i) => {
    const pos = visibleIndices.indexOf(i);
    if (pos > 0) return visibleIndices[pos - 1]!;
    // Se i è già hidden, vai alla precedente visibile più vicina.
    const prev = visibleIndices.filter((v) => v < i).pop();
    return prev !== undefined ? prev : i;
  });
  const goNext = () => setCurrentIdx((i) => {
    const pos = visibleIndices.indexOf(i);
    if (pos >= 0 && pos < visibleIndices.length - 1) return visibleIndices[pos + 1]!;
    const next = visibleIndices.find((v) => v > i);
    return next !== undefined ? next : i;
  });

  const jumpTo = (n: number) => {
    const idx = Math.max(0, Math.min(totalPages - 1, n - 1));
    setCurrentIdx(idx);
    setEditingJump(false);
    setJumpInputValue('');
    setTocOpenMobile(false);
  };

  const handleJumpSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const n = parseInt(jumpInputValue, 10);
      if (!isNaN(n)) jumpTo(n);
    } else if (e.key === 'Escape') {
      setEditingJump(false);
      setJumpInputValue('');
    }
  };

  const toggleSezione = (sez: SezioneLiturgica) => {
    setCollapsedSezioni((prev) => {
      const next = new Set(prev);
      if (next.has(sez)) next.delete(sez); else next.add(sez);
      return next;
    });
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
   * Sub-render: TOC (lista pagine raggruppate per sezione)
   * ─────────────────────────────────────────────────────────────────── */
  const renderToc = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ListTree size={16} color="var(--accent)" />
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>Indice</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-soft)' }}>{totalPages} pagine</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {grouped.map(({ sezione, items }) => {
          const collapsed = collapsedSezioni.has(sezione);
          return (
            <div key={sezione} style={{ marginBottom: '10px' }}>
              <button
                onClick={() => toggleSezione(sezione)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                }}
              >
                {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <span style={{ flex: 1, textAlign: 'left' }}>{LABEL_SEZIONE[sezione]}</span>
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-soft)' }}>{items.length}</span>
              </button>
              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                  {items.map(({ idx, page }) => {
                    const status = pageStatus(page, idx === currentIdx);
                    const dot = STATUS_DOT[status];
                    const reorderable = page.type !== 'cover' && page.type !== 'indice';
                    const canUp = reorderable && canMovePage(idx, -1);
                    const canDown = reorderable && canMovePage(idx, 1);
                    return (
                      <div
                        key={page.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 6px 4px 10px',
                          background: status === 'corrente' ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent',
                          border: status === 'corrente' ? '1px solid rgba(var(--accent-rgb), 0.4)' : '1px solid transparent',
                          borderRadius: '8px',
                          transition: 'background .15s',
                        }}
                      >
                        <button
                          onClick={() => { setCurrentIdx(idx); setTocOpenMobile(false); }}
                          style={{
                            flex: 1, minWidth: 0,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '4px 0',
                            background: 'transparent', border: 'none',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: dot.color, flexShrink: 0,
                          }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-soft)', minWidth: '20px' }}>
                            {idx + 1}.
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: status === 'corrente' ? 700 : 500,
                              color: 'var(--text-primary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {PAGE_TYPE_LABEL[page.type]}
                            </div>
                            <div style={{
                              fontSize: '10px', color: 'var(--text-soft)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {describePage(page)}
                            </div>
                          </div>
                        </button>
                        {/* Frecce riordino: cover/indice escluse, frecce
                            disabilitate se vicino di posizione è cover/indice. */}
                        {reorderable && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', flexShrink: 0 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); movePage(idx, -1); }}
                              disabled={!canUp}
                              title="Sposta su"
                              style={{
                                padding: '0px 3px', border: 'none', background: 'transparent',
                                color: canUp ? 'var(--text-soft)' : 'var(--border)',
                                cursor: canUp ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center',
                              }}
                            >
                              <ChevronUp size={11} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); movePage(idx, 1); }}
                              disabled={!canDown}
                              title="Sposta giù"
                              style={{
                                padding: '0px 3px', border: 'none', background: 'transparent',
                                color: canDown ? 'var(--text-soft)' : 'var(--border)',
                                cursor: canDown ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center',
                              }}
                            >
                              <ChevronDown size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Sub-render: Preview pagina corrente (rendering statico)
   * ─────────────────────────────────────────────────────────────────── */
  const renderPreview = () => {
    if (!currentPage) return null;
    // Pagina A5 portrait fissa (aspect-ratio 0.72 ~= 148/210mm). Se il
    // contenuto eccede, paginatePage divide in slice — ognuno è una
    // card A5 separata, stackata verticalmente nel preview.
    const PAGE_W = 420;
    const slices = paginatePage(currentPage, libretto);
    return (
      <div style={{
        background: '#f5f5f0',
        padding: isMobile ? '20px 12px' : '32px',
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '20px',
      }}>
        {slices.map((slice, i) => (
          <div key={i} style={{ width: '100%', maxWidth: `${PAGE_W}px` }}>
            {/* Badge FUORI pagina: piccolo testo grigio sopra la card. Non è
                parte del libretto pubblicato — solo indicatore editor che dice
                "questa pagina è stata divisa, ecco la parte N". */}
            {slices.length > 1 && (
              <div style={{
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-soft)',
                marginBottom: '6px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                opacity: 0.7,
              }}>
                Parte {i + 1} di {slices.length}
              </div>
            )}
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
                page={slice}
                libretto={libretto}
                pageIndex={currentIdx}
                totalPages={totalPages}
              />
            </div>
          </div>
        ))}
        <div style={{ fontSize: '11px', color: 'var(--text-soft)', textAlign: 'center', maxWidth: `${PAGE_W}px` }}>
          Pagina {currentIdx + 1} di {totalPages} · <strong style={{ color: 'var(--text-primary)' }}>{PAGE_TYPE_LABEL[currentPage.type]}</strong>
          {slices.length > 1 && (
            <> · <span style={{ color: 'var(--accent)', fontWeight: 700 }}>diviso su {slices.length} pagine</span></>
          )}
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────────
   * Sub-render: Form editor
   * ─────────────────────────────────────────────────────────────────── */
  const renderForm = () => {
    if (!currentPage) return null;
    return (
      <div style={{
        height: '100%',
        overflow: 'auto',
        padding: isMobile ? '14px 14px 80px' : '20px 24px',
        background: 'var(--surface-light, #fafaf7)',
        borderLeft: isMobile ? 'none' : '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <div>
            <div style={{
              fontSize: '10px', fontWeight: 800, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {LABEL_SEZIONE[resolveSezioneInContext(currentIdx, libretto.pages)]}
            </div>
            <h3 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {PAGE_TYPE_LABEL[currentPage.type]}
            </h3>
          </div>
          {currentPage.type !== 'cover' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeletePageClick}
              style={{
                color: confirmDeletePage ? '#fff' : '#c0392b',
                background: confirmDeletePage ? '#ef4444' : undefined,
                fontSize: '11px',
                fontWeight: confirmDeletePage ? 800 : undefined,
                transition: 'all 0.15s ease',
              }}
              title={confirmDeletePage ? 'Clicca di nuovo per confermare' : 'Elimina pagina'}
            >
              <Trash2 size={12} style={{ marginRight: 4 }} />
              {confirmDeletePage ? 'Sicuro?' : 'Elimina'}
            </Button>
          )}
        </div>

        {/* Editor cover specifico */}
        {currentPage.type === 'cover' ? (
          <CoverInlineEditor libretto={libretto} updateCover={updateCover} />
        ) : (
          <PageEditor
            page={currentPage}
            onChange={(next) => updatePage(currentIdx, next)}
            uploadingPagePhoto={uploadingPagePhoto === currentIdx}
            onUploadPhoto={(file) => uploadPagePhoto(file, currentIdx)}
            pagePhotoRef={pagePhotoFileRef}
            slug={slug}
            libretto={libretto}
          />
        )}

        {/* "Aggiungi pagina dopo questa" rimosso intenzionalmente: il template
            CEI default copre l'intero rito, l'utente non ha necessità di
            aggiungere pagine custom. */}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────────
   * Top bar
   * ─────────────────────────────────────────────────────────────────── */
  const renderTopBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '14px',
      padding: isMobile ? '10px 12px' : '12px 18px',
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      paddingTop: 'max(12px, env(safe-area-inset-top))',
    }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        style={{ padding: '6px', minWidth: 'auto' }}
        title="Chiudi"
      >
        <X size={18} />
      </Button>
      {!isMobile && (
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Libretto Messa
        </div>
      )}
      {isMobile && (
        <Button
          variant="subtle"
          size="sm"
          onClick={() => setTocOpenMobile(true)}
          style={{ fontSize: '11px', padding: '6px 10px' }}
        >
          <ListTree size={13} style={{ marginRight: 4 }} /> Indice
        </Button>
      )}

      {/* Jump-to-page */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>Pag.</span>
        {editingJump ? (
          <input
            autoFocus
            type="number"
            min={1}
            max={totalPages}
            value={jumpInputValue}
            onChange={(e) => setJumpInputValue(e.target.value)}
            onKeyDown={handleJumpSubmit}
            onBlur={() => { setEditingJump(false); setJumpInputValue(''); }}
            style={{
              width: '50px',
              padding: '4px 6px',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'center',
            }}
          />
        ) : (
          <button
            onClick={() => { setEditingJump(true); setJumpInputValue(String(currentIdx + 1)); }}
            title="Vai a pagina…"
            style={{
              border: '1px solid var(--border)',
              background: '#ffffff',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              minWidth: '34px',
            }}
          >
            {currentIdx + 1}
          </button>
        )}
        <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>/ {totalPages}</span>
      </div>

      {/* Autosave */}
      {!isMobile && (
        <div
          key={savedTick}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', color: 'var(--text-soft)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <Check size={12} color="#10b981" />
          Salvato
        </div>
      )}

      {/* Undo: visibile solo se c'è almeno 1 entry in history. historyVersion
          forza re-render quando push/pop cambiano lo stack. */}
      {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
      {historyVersion >= 0 && historyRef.current.length > 0 && (
        <Button
          variant="subtle"
          size="sm"
          onClick={handleUndo}
          style={{ fontSize: '11px', padding: '6px 10px', fontWeight: 600 }}
          title="Annulla ultima modifica"
        >
          <Undo2 size={13} style={{ marginRight: 4 }} />
          {!isMobile && 'Annulla'}
        </Button>
      )}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Bottom nav bar
   * ─────────────────────────────────────────────────────────────────── */
  const renderBottomBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 18px',
      background: '#fff',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    }}>
      <Button
        variant="subtle"
        onClick={goPrev}
        disabled={currentIdx === 0}
        style={{ flex: 1, justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}
      >
        <ChevronLeft size={14} style={{ marginRight: 4 }} /> Indietro
      </Button>
      <Button
        variant="primary"
        onClick={goNext}
        disabled={currentIdx === totalPages - 1}
        style={{ flex: 1, justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}
      >
        Avanti <ChevronRight size={14} style={{ marginLeft: 4 }} />
      </Button>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────
   * Main render
   * ─────────────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '1400px',
          height: '100%',
          maxHeight: isMobile ? '100%' : '95dvh',
          margin: isMobile ? 0 : 'auto',
          background: '#fff',
          borderRadius: isMobile ? 0 : '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {renderTopBar()}

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Desktop: TOC sticky a sx */}
          {!isMobile && (
            <div style={{
              width: '260px',
              flexShrink: 0,
              borderRight: '1px solid var(--border)',
              background: '#fafaf7',
            }}>
              {renderToc()}
            </div>
          )}

          {/* Center: preview (desktop = larghezza fissa, lascia spazio al form) */}
          {!isMobile ? (
            <div style={{ width: '480px', flexShrink: 0, borderRight: '1px solid var(--border)' }}>
              {renderPreview()}
            </div>
          ) : null}

          {/* Right: form (desktop = flex:1 = colonna più larga, ospita
              dropdown / textarea / select più comodi). Mobile: full width. */}
          <div style={{
            width: isMobile ? '100%' : 'auto',
            flex: isMobile ? '0 0 auto' : 1,
            minWidth: 0,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {isMobile && (
              <div style={{ flexShrink: 0, height: '40vh', borderBottom: '1px solid var(--border)' }}>
                {renderPreview()}
              </div>
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {renderForm()}
            </div>
          </div>
        </div>

        {renderBottomBar()}
      </div>

      {/* Mobile TOC drawer */}
      {isMobile && tocOpenMobile && (
        <div
          onClick={() => setTocOpenMobile(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1001,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '85dvh',
              background: '#fff',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d1d5db' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {renderToc()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 * Cover inline editor — versione semplificata della tab Copertina della
 * sidebar, mostrata quando l'utente è sulla pagina Cover nel modal.
 *
 * Per non duplicare tutto, qui mostriamo solo i campi base + un link
 * "Apri editor copertina avanzato" che chiude il modal e fa lo scroll
 * alla sidebar canvas (dove già c'è il PhotoCropEditor + ordine elementi).
 * ──────────────────────────────────────────────────────────────────────── */
const CoverInlineEditor: React.FC<{
  libretto: LibrettoData;
  updateCover: (next: Partial<LibrettoData['cover']>) => void;
}> = ({ libretto, updateCover }) => (
  <div>
    <p style={{
      fontSize: '11px', color: 'var(--text-soft)', margin: '0 0 14px',
      padding: '8px 10px', background: 'rgba(var(--accent-rgb), 0.06)',
      border: '1px dashed rgba(var(--accent-rgb), 0.3)', borderRadius: '8px',
      lineHeight: 1.5,
    }}>
      Per modificare foto, forma e crop avanzato della copertina, usa la sezione
      <strong> Stile / Copertina</strong> nella sidebar a destra del canvas.
    </p>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        Nome dello sposo
      </label>
      <input
        value={libretto.cover.sposo1}
        onChange={(e) => updateCover({ sposo1: e.target.value })}
        placeholder="es. Marco"
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }}
      />
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        Nome della sposa
      </label>
      <input
        value={libretto.cover.sposo2}
        onChange={(e) => updateCover({ sposo2: e.target.value })}
        placeholder="es. Sara"
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)' }}
      />
    </div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        Data
      </label>
      <input
        value={libretto.cover.data}
        onChange={(e) => updateCover({ data: e.target.value })}
        placeholder="es. 12 settembre 2026"
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)' }}
      />
    </div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        Chiesa / Luogo
      </label>
      <input
        value={libretto.cover.chiesa}
        onChange={(e) => updateCover({ chiesa: e.target.value })}
        placeholder="es. Chiesa di Santa Maria, Milano"
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)' }}
      />
    </div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        Frase iniziale (opzionale)
      </label>
      <textarea
        value={libretto.cover.fraseIniziale || ''}
        onChange={(e) => updateCover({ fraseIniziale: e.target.value })}
        placeholder="Una citazione, un versetto biblico…"
        rows={3}
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)', resize: 'vertical', fontFamily: 'inherit' }}
      />
    </div>

    {/* Sacerdote / Officiante (opzionale) */}
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        Chi presiede la celebrazione (opzionale)
      </label>
      <p style={{ fontSize: '10px', color: 'var(--text-soft)', margin: '0 0 6px', lineHeight: 1.4 }}>
        Apparirà in copertina sotto a "Presiede la celebrazione".
      </p>
      <input
        value={libretto.cover.officiante || ''}
        onChange={(e) => updateCover({ officiante: e.target.value })}
        placeholder="es. Don Enzo Malizia"
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)' }}
        maxLength={80}
      />
    </div>

    {/* Testimoni (opzionale) */}
    <CoverTestimoniEditor libretto={libretto} updateCover={updateCover} />
  </div>
);

const CoverTestimoniEditor: React.FC<{
  libretto: LibrettoData;
  updateCover: (next: Partial<LibrettoData['cover']>) => void;
}> = ({ libretto, updateCover }) => {
  const items = libretto.cover.testimoni || [];
  const updateAt = (i: number, val: string) => {
    const next = [...items];
    next[i] = val;
    updateCover({ testimoni: next });
  };
  const removeAt = (i: number) => updateCover({ testimoni: items.filter((_, j) => j !== i) });
  const addOne = () => updateCover({ testimoni: [...items, ''] });
  return (
    <div>
      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        Testimoni (opzionale)
      </label>
      <p style={{ fontSize: '10px', color: 'var(--text-soft)', margin: '0 0 6px', lineHeight: 1.4 }}>
        Nomi dei testimoni di matrimonio (di solito 2-4). Appariranno in colonna sulla copertina.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((name, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              value={name}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={`Testimone ${i + 1}`}
              style={{ flex: 1, padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)' }}
              maxLength={80}
            />
            <button
              onClick={() => removeAt(i)}
              title="Rimuovi"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#c0392b', padding: '4px 6px', display: 'flex', alignItems: 'center',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addOne}
          style={{
            padding: '8px 10px',
            background: 'transparent',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Plus size={11} /> Aggiungi testimone
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 * AddPageAfterControl — entry point discreto per aggiungere pagine extra.
 *
 * Default: bottone testuale "+ Aggiungi pagina dopo questa". Click → svela
 * un piccolo menu con le opzioni raggruppate per categoria. Click su voce
 * = aggiunge la pagina dopo quella corrente e chiude il menu.
 *
 * Razionale UX: il template default include già 31 pagine che coprono il
 * rito completo. Aggiungere pagine extra è raro (foto extra, racconto/
 * citazione personale). Tenere 8 bottoni sempre a vista era rumore inutile.
 * ──────────────────────────────────────────────────────────────────────── */
const ADD_PAGE_GROUPS: { label: string; options: LibrettoPage['type'][] }[] = [
  { label: 'Letture e canti', options: ['lettura', 'salmo', 'vangelo', 'canto'] },
  { label: 'Pagine personali', options: ['dedica-iniziale', 'racconto', 'photo'] },
  { label: 'Altro', options: ['custom'] },
];

const AddPageAfterControl: React.FC<{
  onAdd: (type: LibrettoPage['type']) => void;
}> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'transparent',
            border: '1px dashed var(--border)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-soft)',
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-soft)';
          }}
        >
          <Plus size={14} /> Aggiungi pagina dopo questa
        </button>
      ) : (
        <div style={{
          padding: '12px',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Scegli il tipo di pagina
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-soft)', padding: '2px 4px', fontSize: '16px',
                lineHeight: 1,
              }}
              title="Annulla"
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {ADD_PAGE_GROUPS.map((g) => (
              <div key={g.label}>
                <div style={{
                  fontSize: '9px', fontWeight: 700, color: 'var(--text-soft)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '6px',
                }}>
                  {g.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {g.options.map((t) => (
                    <Button
                      key={t}
                      variant="subtle"
                      size="sm"
                      onClick={() => { onAdd(t); setOpen(false); }}
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                    >
                      <Plus size={11} style={{ marginRight: 4 }} />
                      {PAGE_TYPE_LABEL[t]}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrettoEditorModal;
