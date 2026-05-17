import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/apiFetch";
import { Button, Badge } from "../../ui";
import {
  PenSquare, Send, Users, ExternalLink, Link2,
  Trash2, Star, Gift, Calendar, Plus, Home,
  CheckCircle2, HelpCircle, XCircle, Users2,
  LogOut, Pencil, Check, X
} from "lucide-react";
import EventPurchaseModal from "../../components/payments/EventPurchaseModal";
import ScenarioThumbnail from "../../components/ScenarioThumbnail";
import ItalianDatePicker from "../../components/datepicker/ItalianDatePicker";
import { formatItalianDateAsYouType, isoToItalianDisplay, italianDisplayToIso, isCompleteItalianDate, isValidItalianDate } from "../../utils/italianDateInput";
import { isPaidPlan } from "../../utils/eventPlan";
import { performLogout } from "../../utils/logout";
import "./Dashboard.css";

interface RsvpSummary {
  totalGuests: number;
  totalResponses: number;
  yesResponses: number;
  maybeResponses: number;
  noResponses: number;
}

interface Event {
  _id: string;
  slug: string;
  title: string;
  plan?: string;
  date?: string;
  dateTBD?: boolean;
  canvas?: any;
  layers?: any[];
  theme?: any;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [rsvpSummaryBySlug, setRsvpSummaryBySlug] = useState<Record<string, RsvpSummary | null>>({});
  const [purchaseModal, setPurchaseModal] = useState<{ slug: string; title: string } | null>(null);
  // Inline date editor: traccia slug in edit + valori temporanei.
  // `display` è la stringa gg/mm/aaaa visibile nell'input; convertita a ISO
  // al momento del save (italianDisplayToIso). Pattern identico a NewEvent.tsx
  // per consistenza: stesso ItalianDatePicker + stessa utility input.
  const [editingDate, setEditingDate] = useState<{ slug: string; display: string; tbd: boolean } | null>(null);
  const [savingDateSlug, setSavingDateSlug] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Ref del wrapper input+calendar — usato come anchor per il popup picker.
  // Singolo ref globale perché solo una card può essere in edit alla volta.
  const datePickerAnchorRef = useRef<HTMLDivElement>(null);

  /** Apre l'editor inline data sulla card. */
  const startEditDate = (ev: Event) => {
    const iso = ev.date ? new Date(ev.date).toISOString().slice(0, 10) : '';
    setEditingDate({ slug: ev.slug, display: iso ? isoToItalianDisplay(iso) : '', tbd: !!ev.dateTBD });
    setPickerOpen(false);
  };

  /** Salva la data via PUT /api/events/:slug. Supporta data ISO o dateTBD. */
  const saveDate = async (slug: string) => {
    if (!editingDate || editingDate.slug !== slug) return;
    // Se non TBD, l'input deve risolvere a una data ISO valida.
    let iso: string | null = null;
    if (!editingDate.tbd) {
      iso = italianDisplayToIso(editingDate.display);
      if (editingDate.display.trim() && !iso) {
        alert("Data non valida. Usa il formato gg/mm/aaaa.");
        return;
      }
    }
    setSavingDateSlug(slug);
    try {
      const body: any = editingDate.tbd
        ? { dateTBD: true }
        : { dateTBD: false, date: iso };
      const res = await apiFetch(`/api/events/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e.slug === slug ? { ...e, date: updated.date, dateTBD: updated.dateTBD } : e)));
      setEditingDate(null);
      setPickerOpen(false);
    } catch {
      alert("Errore durante il salvataggio della data.");
    } finally {
      setSavingDateSlug(null);
    }
  };

  /** ISO corrente derivato dal display, per inizializzare il popup picker. */
  const currentEditingIso = useMemo(() => {
    if (!editingDate) return '';
    return italianDisplayToIso(editingDate.display) || '';
  }, [editingDate]);

  /** True se l'utente ha digitato qualcosa di completo MA non valido
   *  (es. 29/02/2023 in anno non bisestile, 31/04/2025 in aprile, ecc.).
   *  Mentre digita stringhe parziali rimane false: niente errore prematuro. */
  const editingDateInvalid = useMemo(() => {
    if (!editingDate || editingDate.tbd) return false;
    if (!isCompleteItalianDate(editingDate.display)) return false;
    return !isValidItalianDate(editingDate.display);
  }, [editingDate]);

  const deleteEvent = async (slug: string) => {
    try {
      const res = await apiFetch(`/api/events/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEvents((prev) => prev.filter((e) => e.slug !== slug));
      setConfirmDeleteSlug(null);
    } catch {
      alert("Errore durante l'eliminazione.");
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/e/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const meRes = await apiFetch(`/api/auth/me`);
        if (!meRes.ok) { navigate("/login"); return; }
        const res = await apiFetch(`/api/events`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const safeEvents = Array.isArray(data) ? data : [];
        if (!cancelled) setEvents(safeEvents);

        const summaries = await Promise.all(
          safeEvents.map(async (ev) => {
            try {
              const sRes = await apiFetch(`/api/events/${ev.slug}/rsvps/summary`);
              return [ev.slug, sRes.ok ? await sRes.json() : null];
            } catch { return [ev.slug, null]; }
          })
        );
        if (!cancelled) setRsvpSummaryBySlug(Object.fromEntries(summaries));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, [navigate]);

  const globalStats = useMemo(() => ({
    total: events.length,
    active: events.filter(e => isPaidPlan(e.plan)).length,
    guests: Object.values(rsvpSummaryBySlug).reduce((acc, s) => acc + (s?.totalGuests || 0), 0)
  }), [events, rsvpSummaryBySlug]);

  if (loading) return <div className="dashboard-page"><div className="dashboard-shell"><p>Preparazione dashboard...</p></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        
        <div className="dashboard-header">
          <div className="dashboard-title-block">
            <img src="/logo-eenvee.svg" alt="eenvee" style={{ height: "32px", marginBottom: "1.25rem" }} />
            <h1>I tuoi inviti</h1>
            <p>Qui puoi gestire ogni dettaglio dei tuoi eventi speciali e monitorare le risposte degli ospiti.</p>
          </div>
          <div className="ui-toolbar__actions">
            <button className="btn-primary-mini" onClick={() => navigate("/")} style={{ background: 'white', border: '1px solid rgba(60,79,118,0.1)' }}>
              <Home size={16} /> Home
            </button>
            <Button className="btn-new-event" onClick={() => navigate("/templates")}>
              <Plus size={18} style={{ marginRight: 8 }} /> Nuovo Evento
            </Button>
            {/* Logout — collocato in ULTIMA posizione e con stile "ghost" (link)
                deliberatamente meno prominente di Home/Nuovo Evento.
                Retention pattern: l'utente deve poter uscire ma non incoraggiamo. */}
            <button
              className="btn-logout-ghost"
              onClick={() => {
                if (confirm("Uscire dal tuo account?")) performLogout("/");
              }}
              aria-label="Esci dall'account"
            >
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card-premium">
            <span className="stat-label">Eventi</span>
            <div className="stat-value">{globalStats.total}</div>
          </div>
          <div className="stat-card-premium">
            <span className="stat-label">Attivi</span>
            <div className="stat-value">{globalStats.active}</div>
          </div>
          <div className="stat-card-premium">
            <span className="stat-label">Ospiti Totali</span>
            <div className="stat-value">{globalStats.guests}</div>
          </div>
        </div>

        <div className="events-grid">
          {events.map((ev) => {
            const sum = rsvpSummaryBySlug[ev.slug];
            const paid = isPaidPlan(ev.plan);
            
            const handleAction = (route: string) => {
              if (!paid && route !== 'copy' && !route.startsWith('/edit')) { 
                setPurchaseModal({ slug: ev.slug, title: ev.title }); 
                return; 
              }
              if (route === 'copy') { copyLink(ev.slug); return; }
              navigate(route);
            };

            return (
              <div key={ev._id} className="event-card-premium">
                {/* Thumbnail Scenario - Codice originale richiamato tramite ScenarioThumbnail */}
                <div className="event-card-visual" onClick={() => navigate(`/edit/${ev.slug}`)} style={{ cursor: 'pointer', background: ev.theme?.scenarioColor || '#f1f5f9' }}>
                  <ScenarioThumbnail 
                    canvas={ev.canvas} 
                    layers={ev.layers || []} 
                    theme={ev.theme} 
                    scale={0.15}
                  />
                </div>

                <div className="event-card-content">
                  <div className="event-card-header">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2>{ev.title}</h2>
                      {editingDate?.slug === ev.slug ? (
                        /* Editor inline: input gg/mm/aaaa + bottone calendario
                           (ItalianDatePicker) + checkbox "Data da definire".
                           Stesso pattern di NewEvent.tsx per consistenza. */
                        <div className="event-card-date-edit">
                          <div className="event-card-date-edit__row">
                            <div className="event-card-date-input-wrap" ref={datePickerAnchorRef}>
                              <input
                                type="text"
                                value={editingDate.display}
                                onChange={(e) => setEditingDate({ ...editingDate, display: formatItalianDateAsYouType(e.target.value) })}
                                placeholder="gg/mm/aaaa"
                                disabled={editingDate.tbd || savingDateSlug === ev.slug}
                                className={`event-card-date-input${editingDateInvalid ? ' event-card-date-input--invalid' : ''}`}
                                autoComplete="off"
                                inputMode="numeric"
                                aria-label="Data evento gg/mm/aaaa"
                                aria-invalid={editingDateInvalid || undefined}
                              />
                              <button
                                type="button"
                                className="event-card-date-calendar-btn"
                                onClick={() => setPickerOpen((v) => !v)}
                                disabled={editingDate.tbd || savingDateSlug === ev.slug}
                                aria-label="Apri calendario"
                                aria-expanded={pickerOpen}
                                title="Apri calendario"
                              >
                                <Calendar size={14} aria-hidden />
                              </button>
                              {pickerOpen && !editingDate.tbd && (
                                <ItalianDatePicker
                                  valueIso={currentEditingIso}
                                  minIso="1900-01-01"
                                  maxIso="2100-12-31"
                                  anchorRef={datePickerAnchorRef}
                                  onSelect={(iso) => {
                                    setEditingDate({ ...editingDate, display: iso ? isoToItalianDisplay(iso) : '' });
                                  }}
                                  onClose={() => setPickerOpen(false)}
                                />
                              )}
                            </div>
                            <button
                              className="event-card-date-btn event-card-date-btn--save"
                              onClick={() => saveDate(ev.slug)}
                              disabled={
                                savingDateSlug === ev.slug ||
                                (!editingDate.tbd && (!editingDate.display.trim() || editingDateInvalid))
                              }
                              aria-label="Salva data"
                              title={editingDateInvalid ? 'Data non valida' : 'Salva'}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="event-card-date-btn event-card-date-btn--cancel"
                              onClick={() => { setEditingDate(null); setPickerOpen(false); }}
                              disabled={savingDateSlug === ev.slug}
                              aria-label="Annulla modifica"
                              title="Annulla"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {editingDateInvalid && (
                            <div className="event-card-date-error" role="alert">
                              Data non valida — controlla giorno e mese
                            </div>
                          )}
                          <label className="event-card-date-tbd">
                            <input
                              type="checkbox"
                              checked={editingDate.tbd}
                              onChange={(e) => {
                                setEditingDate({ ...editingDate, tbd: e.target.checked });
                                if (e.target.checked) setPickerOpen(false);
                              }}
                              disabled={savingDateSlug === ev.slug}
                            />
                            Data da definire
                          </label>
                        </div>
                      ) : (
                        <button
                          className="event-card-date event-card-date--editable"
                          onClick={() => startEditDate(ev)}
                          aria-label="Modifica data evento"
                          title="Modifica data"
                          type="button"
                        >
                          <Calendar size={14} />
                          <span>
                            {ev.dateTBD ? "Data da definire" : ev.date ? new Date(ev.date).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : "Data non impostata"}
                          </span>
                          <Pencil size={11} style={{ opacity: 0.5, marginLeft: 4 }} />
                        </button>
                      )}
                    </div>
                    <Badge variant={paid ? "accent" : "default"} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '10px' }}>
                      {paid ? "ATTIVO" : "NON ATTIVATO"}
                    </Badge>
                  </div>

                  {/* Blocchi RSVP Chiari e Completi */}
                  <div className="event-card-quick-stats">
                    <div className="quick-stats-title">Riepilogo Risposte</div>
                    <div className="quick-stats-grid">
                      <div className="quick-stat-group">
                        <div className="quick-stat-item" title="Inviti confermati">
                          <div className="quick-stat-val" style={{ color: '#2ECC71' }}>{sum?.yesResponses || 0}</div>
                          <span className="quick-stat-label">Sì</span>
                        </div>
                        <div className="quick-stat-item" title="Inviti in dubbio">
                          <div className="quick-stat-val" style={{ color: '#F1C40F' }}>{sum?.maybeResponses || 0}</div>
                          <span className="quick-stat-label">Forse</span>
                        </div>
                        <div className="quick-stat-item" title="Inviti declinati">
                          <div className="quick-stat-val" style={{ color: '#E74C3C' }}>{sum?.noResponses || 0}</div>
                          <span className="quick-stat-label">No</span>
                        </div>
                      </div>
                      <div className="quick-stat-total-wrap" title="Totale persone effettive confermate">
                        <div className="quick-stat-val" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>{sum?.totalGuests || 0}</div>
                        <span className="quick-stat-label" style={{ color: 'var(--text-primary)' }}>Persone</span>
                      </div>
                    </div>
                  </div>

                  <div className="event-card-actions-primary">
                    <button className="btn-primary-mini" onClick={() => navigate(`/edit/${ev.slug}`)}>
                      <PenSquare size={14} /> Design
                    </button>
                    <button className="btn-primary-mini" onClick={() => handleAction(`/invites/${ev.slug}`)}>
                      <Send size={14} /> Invia
                    </button>
                  </div>

                  <div className="event-card-actions-secondary">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-icon-btn" onClick={() => handleAction(`/rsvps/${ev.slug}`)}>
                        <Users size={18} />
                        <span>RSVP</span>
                      </button>
                      <button className="action-icon-btn" onClick={() => handleAction(`/gifts/${ev.slug}`)}>
                        <Gift size={18} />
                        <span>Regali</span>
                      </button>
                      <button className="action-icon-btn" onClick={() => handleAction(`/e/${ev.slug}`)}>
                        <ExternalLink size={18} />
                        <span>Anteprima</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={`action-icon-btn ${copiedSlug === ev.slug ? 'active' : ''}`} onClick={() => handleAction('copy')}>
                        <Link2 size={18} />
                        <span>{copiedSlug === ev.slug ? 'Copiato!' : 'Link'}</span>
                      </button>
                      <button className="action-icon-btn danger" onClick={() => {
                        if (confirmDeleteSlug === ev.slug) { deleteEvent(ev.slug); return; }
                        setConfirmDeleteSlug(ev.slug);
                        setTimeout(() => setConfirmDeleteSlug(null), 3000);
                      }}>
                        <Trash2 size={18} />
                        <span>{confirmDeleteSlug === ev.slug ? 'Sicuro?' : 'Elimina'}</span>
                      </button>
                    </div>
                  </div>

                  {!paid && (
                    <button className="btn-activate-premium" onClick={() => setPurchaseModal({ slug: ev.slug, title: ev.title })}>
                      <Star size={16} fill="currentColor" /> Attiva Evento (69 €)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {purchaseModal && (
        <EventPurchaseModal
          open
          eventSlug={purchaseModal.slug}
          eventTitle={purchaseModal.title}
          onClose={() => setPurchaseModal(null)}
          onUnlocked={(slug) => setEvents((prev) => prev.map((e) => (e.slug === slug ? { ...e, plan: "paid" } : e)))}
        />
      )}
    </div>
  );
}
