import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/apiFetch";
import { Surface, Button, Badge, StatCard } from "../../ui";
import "../Rsvps/EventRsvps.css";
import "../Donations/EventDonations.css";
import {
  Mail,
  MessageCircle,
  MessageSquare,
  ClipboardPaste,
  BookUser,
  QrCode,
  FileSpreadsheet,
  Share2,
  Check,
} from "lucide-react";
import {
  buildWhatsAppSendUrl,
  interpolateInviteTemplate,
  toWhatsAppPhoneDigits,
} from "../../utils/whatsAppInvite";
import "./EventInvites.css";

interface Invite {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  channel: string;
  sentAt?: string;
}

export default function EventInvites() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualChannel, setManualChannel] = useState("whatsapp");
  const [adding, setAdding] = useState(false);

  const [quickPaste, setQuickPaste] = useState("");
  const [parsing, setParsing] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const defaultTemplate =
    "Ciao {name},\n\nTi invito all'evento! Dettagli e RSVP qui:\n{link}\n\nA presto!";
  const [messageTemplate, setMessageTemplate] = useState(defaultTemplate);

  const publicEventUrl = useMemo(() => {
    if (!slug) return "";
    return `${window.location.origin}/e/${slug}`;
  }, [slug]);

  const inviteCounts = useMemo(() => {
    const total = invites.length;
    const sent = invites.filter((i) => i.status === "sent").length;
    return { total, sent, pending: Math.max(0, total - sent) };
  }, [invites]);

  const resolvedBody = useCallback(
    (inv: Invite) =>
      interpolateInviteTemplate(messageTemplate, inv.name.trim() || "ospite", publicEventUrl),
    [messageTemplate, publicEventUrl]
  );

  const openWhatsAppForInvite = useCallback(
    (inv: Invite) => {
      const digits = toWhatsAppPhoneDigits(inv.phone);
      if (!digits) {
        alert(
          "Non risulta un numero telefonico valido per questo contatto. Aggiungi o correggi il cellulare (es. 347 1234567) oppure usa Condividi e scegli il destinatario nel foglio nativo."
        );
        return;
      }
      const url = buildWhatsAppSendUrl(digits, resolvedBody(inv));
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [resolvedBody]
  );

  const nativeShareForInvite = useCallback(
    async (inv: Invite) => {
      let text = resolvedBody(inv);
      if (publicEventUrl && !text.includes(publicEventUrl)) {
        text = `${text}\n\n${publicEventUrl}`;
      }
      if (navigator.share) {
        try {
          await navigator.share({
            title: eventTitle || "Invito",
            text,
          });
        } catch {
          /* annullato dall’utente */
        }
      } else {
        try {
          await navigator.clipboard.writeText(text);
          alert("Messaggio copiato negli appunti.");
        } catch {
          prompt("Copia il testo:", text);
        }
      }
    },
    [eventTitle, publicEventUrl, resolvedBody]
  );

  const markInvitesSent = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return false;
      const res = await apiFetch(`/api/events/${slug}/invites/send`, {
        method: "POST",
        body: JSON.stringify({ inviteIds: ids }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { message?: string }).message || "Errore aggiornamento stato inviti.");
        return false;
      }
      const now = new Date().toISOString();
      setInvites((prev) =>
        prev.map((inv) =>
          ids.includes(inv._id) ? { ...inv, status: "sent", sentAt: now } : inv
        )
      );
      return true;
    },
    [slug]
  );

  useEffect(() => {
    async function fetchInvites() {
      try {
        const evRes = await apiFetch(`/api/events/${slug}/private`);
        if (evRes.ok) {
          const evData = await evRes.json();
          setEventTitle(evData.title || slug);
        } else {
          setEventTitle(slug || "");
        }

        const invRes = await apiFetch(`/api/events/${slug}/invites`);
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvites(Array.isArray(invData) ? invData : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchInvites();
  }, [slug]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    setAdding(true);

    try {
      const res = await apiFetch(`/api/events/${slug}/invites`, {
        method: "POST",
        body: JSON.stringify({
          contacts: [{
            name: manualName,
            phone: manualPhone,
            email: manualEmail,
            channel: manualChannel,
          }]
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setInvites(prev => [...created, ...prev]);
        setManualName("");
        setManualPhone("");
        setManualEmail("");
      }
    } catch {
      alert("Errore aggiunta contatto.");
    } finally {
      setAdding(false);
    }
  };

  const handleNativeContactPicker = async () => {
    const supported = ("contacts" in navigator && "ContactsManager" in window);
    if (!supported || !navigator.contacts) {
      alert("Il tuo browser nativo non supporta questa API. Usa l'inserimento manuale o Incolla in basso.");
      return;
    }

    try {
      const props = ["name", "tel", "email"];
      const opts = { multiple: true };
      const contacts = await navigator.contacts.select(props, opts);
      
      if (!contacts || contacts.length === 0) return;

      const parsedContacts = contacts.map(c => ({
        name: (c.name && c.name[0]) || "Sconosciuto",
        phone: (c.tel && c.tel[0]) || "",
        email: (c.email && c.email[0]) || "",
        channel: "whatsapp"
      }));

      const res = await apiFetch(`/api/events/${slug}/invites`, {
          method: "POST",
          body: JSON.stringify({ contacts: parsedContacts }),
      });

      if (res.ok) {
        const created = await res.json();
        setInvites(prev => [...created, ...prev]);
      }
    } catch (e) {
      console.error(e);
      alert("Selezione contatti annullata o fallita.");
    }
  };

  const processContactsText = async (text: string) => {
    const lines = text.split("\n").filter(l => l.trim() !== "");
    const parsedContacts: any[] = [];

    lines.forEach(line => {
      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const telMatch = line.match(/[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*[0-9]{3,}/);
      
      const email = emailMatch ? emailMatch[0] : "";
      const phone = telMatch ? telMatch[0].trim() : "";
      
      let name = line.replace(email, "").replace(phone, "").trim();
      if (!name) name = "Ospite";
      name = name.replace(/^[-,\s]+|[-,\s]+$/g, '');

      if (name || phone || email) {
          parsedContacts.push({ name, phone, email, channel: "whatsapp" });
      }
    });

    if (parsedContacts.length > 0) {
      const res = await apiFetch(`/api/events/${slug}/invites`, {
          method: "POST",
          body: JSON.stringify({ contacts: parsedContacts }),
      });

      if (res.ok) {
        const created = await res.json();
        setInvites(prev => [...created, ...prev]);
        alert(`Aggiunti ${created.length} contatti!`);
      }
    }
  };

  const handleQuickPaste = async () => {
    if (!quickPaste.trim()) return;
    setParsing(true);
    try {
      await processContactsText(quickPaste);
      setQuickPaste("");
    } catch {
      alert("Errore inserimento in blocco.");
    } finally {
      setParsing(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        await processContactsText(text);
      } catch (err) {
        console.error(err);
        alert("Errore nella lettura del file CSV.");
      } finally {
        setParsing(false);
        e.target.value = ""; 
      }
    };
    reader.readAsText(file);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === invites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invites.map(i => i._id)));
    }
  };

  const handleMarkSelectedSent = async () => {
    if (selectedIds.size === 0) return;
    setSending(true);
    try {
      const ids = Array.from(selectedIds);
      const ok = await markInvitesSent(ids);
      if (ok) {
        setSelectedIds(new Set());
      }
    } catch {
      alert("Errore aggiornamento inviti.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="rsvp-page">
        <div className="rsvp-shell">
          <Surface variant="glass" className="rsvp-empty-card">
            <p style={{ margin: 0 }}>Caricamento rubrica inviti…</p>
          </Surface>
        </div>
      </div>
    );
  }

  const qrImportUrl = `${window.location.origin}/import/${slug}`;

  return (
    <div className="rsvp-page">
      <div className="rsvp-shell">
        <div className="rsvp-topbar">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            ← Torna alla dashboard
          </Button>
          <div className="rsvp-header">
            <div>
              <p className="rsvp-eyebrow">RUBRICA & INVITI</p>
              <h1>{eventTitle}</h1>
              <p className="rsvp-subtitle">
                Importa contatti, componi il messaggio con link RSVP e invia via WhatsApp o condivisione nativa. Segna come inviati per tenere allineata la
                lista su eenvee.
              </p>
            </div>
            <div className="rsvp-header-actions">
              <Button variant="subtle" type="button" onClick={() => navigate(`/edit/${slug}`)}>
                Modifica evento
              </Button>
            </div>
          </div>
        </div>

        <div className="rsvp-stats-grid">
          <StatCard label="In rubrica" value={String(inviteCounts.total)} hint="Contatti importati o aggiunti" />
          <StatCard label="Inviati" value={String(inviteCounts.sent)} hint="Segnati su eenvee" />
          <StatCard label="Da inviare" value={String(inviteCounts.pending)} hint="Ancora in attesa" />
        </div>

        <div className="inv-hub-grid">
          <Surface variant="glass" className="inv-surface-card">
            <p className="inv-card-title">Aggiunta singola</p>
            <h2 className="inv-card-heading">Nuovo contatto</h2>
            <form onSubmit={handleManualAdd}>
              <div className="rsvp-form-grid">
                <div className="input-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    className="rsvp-input"
                    placeholder="Nome o coppia/famiglia"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Telefono</label>
                  <input
                    type="tel"
                    className="rsvp-input"
                    placeholder="Per WhatsApp / SMS"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="rsvp-input"
                    placeholder="Opzionale"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Canale preferito</label>
                  <select
                    className="rsvp-select"
                    value={manualChannel}
                    onChange={(e) => setManualChannel(e.target.value)}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={adding} style={{ marginTop: "1rem", width: "100%" }}>
                {adding ? "Aggiungo…" : "Aggiungi alla rubrica"}
              </Button>
            </form>
          </Surface>

          <Surface variant="glass" className="inv-surface-card">
            <p className="inv-card-title">Importazione</p>
            <h2 className="inv-card-heading">Rubrica, QR e lista</h2>
            <p className="inv-hint">
              <strong>Desktop:</strong> CSV o QR dal telefono (stesso Wi‑Fi o dominio pubblico: da <code>localhost</code> il telefono non raggiunge il PC).{" "}
              <strong>Mobile:</strong> rubrica nativa del dispositivo.
            </p>

            <div className="inv-actions-bar">
              <Button type="button" variant="primary" onClick={handleNativeContactPicker}>
                <BookUser size={16} style={{ marginRight: 6 }} />
                Rubrica nativa
              </Button>
              <div className="inv-csv-wrap">
                <Button variant="outline" type="button" style={{ width: "100%" }}>
                  <FileSpreadsheet size={16} style={{ marginRight: 6 }} />
                  Carica CSV
                </Button>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="inv-csv-hit"
                  onChange={handleCsvUpload}
                  aria-label="Carica file CSV o testo"
                />
              </div>
            </div>

            <div className="inv-qr-panel">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrImportUrl)}`}
                alt="QR import contatti"
                width={88}
                height={88}
              />
              <div className="inv-qr-copy">
                <h4>
                  <QrCode size={16} aria-hidden />
                  Importa da cellulare
                </h4>
                <p>
                  Inquadra con il telefono (account eenvee già collegato), scegli i contatti e torna qui: <strong>ricarica la pagina</strong> per vederli in
                  elenco.
                </p>
              </div>
            </div>

            <div className="inv-paste-zone">
              <label>Incolla lista</label>
              <textarea
                className="rsvp-textarea"
                placeholder={"Marco 3334445555\nAnna anna@email.com"}
                rows={3}
                value={quickPaste}
                onChange={(e) => setQuickPaste(e.target.value)}
              />
              <Button variant="ghost" type="button" onClick={handleQuickPaste} disabled={parsing || !quickPaste} style={{ marginTop: "0.5rem" }}>
                <ClipboardPaste size={16} style={{ marginRight: 6 }} />
                {parsing ? "Elaboro…" : "Aggiungi da testo"}
              </Button>
            </div>
          </Surface>

          <Surface variant="glass" className="inv-surface-card">
            <p className="inv-card-title">Messaggio</p>
            <h2 className="inv-card-heading">Testo invito</h2>
            <p className="inv-hint">
              Placeholder <code>{"{name}"}</code> e <code>{"{link}"}</code>. Link pubblico attuale:{" "}
              <span style={{ wordBreak: "break-all" }}>{publicEventUrl || "—"}</span>
            </p>
            <textarea
              className="rsvp-textarea"
              rows={6}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              spellCheck
            />
            <p className="inv-hint" style={{ marginBottom: 0 }}>
              Su ogni riga: <strong>WhatsApp</strong> apre chat con numero e testo; <strong>Condividi</strong> foglio nativo; <strong>Segna</strong> aggiorna
              lo stato su eenvee.
            </p>
            <Button
              variant="outline"
              type="button"
              style={{ marginTop: "0.85rem", width: "100%" }}
              onClick={handleMarkSelectedSent}
              disabled={selectedIds.size === 0 || sending}
            >
              {sending ? "Aggiorno…" : `Segna come inviati (${selectedIds.size})`}
            </Button>
          </Surface>
        </div>

        <section className="inv-list-section" aria-labelledby="inv-list-heading">
          <div className="inv-list-head">
            <h2 id="inv-list-heading">Contatti ({invites.length})</h2>
            <Button variant="ghost" type="button" onClick={selectAll}>
              {selectedIds.size === invites.length && invites.length > 0 ? "Deseleziona tutti" : "Seleziona tutti"}
            </Button>
          </div>

          {invites.length === 0 ? (
            <Surface variant="glass" className="rsvp-empty-card">
              <h3>Nessun contatto</h3>
              <p>Importa dalla rubrica, incolla una lista o aggiungi manualmente un invitato.</p>
            </Surface>
          ) : (
            <div className="inv-list-stack don-gift-list">
              {invites.map((inv) => {
                const waDigits = toWhatsAppPhoneDigits(inv.phone);
                const selected = selectedIds.has(inv._id);
                const sentClass = inv.status === "sent" ? "rsvp-card-yes" : "";
                return (
                  <div
                    key={inv._id}
                    className={`rsvp-card inv-invite-row ${sentClass} ${selected ? "inv-invite-row--selected" : ""}`}
                    onClick={(e) => {
                      const el = e.target as HTMLElement;
                      if (el.closest("button, a, input, textarea, label")) return;
                      toggleSelect(inv._id);
                    }}
                  >
                    <input
                      type="checkbox"
                      className="inv-invite-row__cb"
                      checked={selected}
                      onChange={() => toggleSelect(inv._id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Seleziona ${inv.name}`}
                    />
                    <div className="inv-invite-row__body">
                      <div className="inv-invite-row__title-line">
                        <strong>{inv.name}</strong>
                        <div className="inv-status-wrap">
                          <Badge variant={inv.status === "sent" ? "success" : "default"}>
                            {inv.status === "sent" ? "Inviato" : "In attesa"}
                          </Badge>
                        </div>
                      </div>
                      <div className="inv-invite-meta">
                        {inv.phone ? <span>{inv.phone}</span> : null}
                        {inv.email ? <span>{inv.email}</span> : null}
                      </div>
                    </div>
                    <div className="inv-invite-channel" aria-hidden>
                      {inv.channel === "whatsapp" && <MessageCircle size={18} color="#25D366" />}
                      {inv.channel === "sms" && <MessageSquare size={18} color="#8b7bff" />}
                      {inv.channel === "email" && <Mail size={18} color="#f4c46b" />}
                    </div>
                    <div className="inv-invite-actions" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        type="button"
                        className="inv-icon-btn"
                        disabled={!waDigits}
                        title={
                          waDigits
                            ? "Apri WhatsApp con numero e messaggio già impostati"
                            : "Aggiungi un numero valido per aprire WhatsApp"
                        }
                        onClick={() => openWhatsAppForInvite(inv)}
                      >
                        <MessageCircle size={20} color={waDigits ? "#25D366" : "rgba(128,128,128,0.45)"} />
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        className="inv-icon-btn"
                        title="Condividi (foglio nativo)"
                        onClick={() => void nativeShareForInvite(inv)}
                      >
                        <Share2 size={18} />
                      </Button>
                      {inv.status !== "sent" ? (
                        <Button
                          variant="ghost"
                          type="button"
                          className="inv-icon-btn"
                          title="Segna come inviato su eenvee"
                          onClick={() => void markInvitesSent([inv._id])}
                        >
                          <Check size={18} color="var(--accent)" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
