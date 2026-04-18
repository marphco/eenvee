import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/apiFetch";
import { Surface, Button, Badge, StatCard } from "../../ui";
import { CheckCircle2, HelpCircle, XCircle, Users, AlertTriangle, Download, ClipboardList, FileText, ChefHat, Mail, Phone } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./EventRsvps.css";

interface CustomResponse {
  fieldId: string;
  label: string;
  type?: "text" | "checkbox";
  answer: any;
}

interface RSVP {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  guestsCount: number;
  status: "yes" | "maybe" | "no";
  message?: string;
  allergies?: string;
  customResponses?: CustomResponse[];
  createdAt?: string;
}

/* ============================================================
   Helpers per export CSV (client-side, zero dipendenze).
   - Escape secondo RFC 4180: virgolette raddoppiate, campo fra "".
   - BOM UTF-8 iniziale così Excel legge correttamente gli accenti.
============================================================ */
function csvEscape(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return `${head}\n${body}`;
}

function downloadCsv(filename: string, csv: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Restituisce il testo allergie effettivo, con fallback ai vecchi record (solo `message`). */
function extractAllergies(r: RSVP): string {
  if (r.allergies && r.allergies.trim()) return r.allergies.trim();
  // retro-compat: vecchi record mettevano allergie in `message` (o "Nessuna allergia segnalata")
  if (r.message && r.message.trim() && !/nessuna allergia/i.test(r.message)) {
    return r.message.trim();
  }
  return "";
}

function formatCustomAnswer(cr: CustomResponse): string {
  if (cr.type === "checkbox") {
    if (cr.answer === true || cr.answer === "yes" || cr.answer === "Sì") return "Sì";
    if (cr.answer === false || cr.answer === "no" || cr.answer === "No") return "No";
    return cr.answer ? String(cr.answer) : "—";
  }
  return cr.answer ? String(cr.answer) : "—";
}

export default function EventRsvps() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [manualName, setManualName] = useState("");
  const [manualGuests, setManualGuests] = useState<string | number>(1);
  const [manualStatus, setManualStatus] = useState<"yes" | "maybe" | "no">("yes");
  const [manualAllergies, setManualAllergies] = useState("");
  const [manualCustom, setManualCustom] = useState<Record<string, any>>({});
  const [manualSending, setManualSending] = useState(false);
  const [manualError, setManualError] = useState("");

  /* --- Config del blocco RSVP dell'evento (domande custom + flag allergie/contatti) --- */
  const [rsvpConfig, setRsvpConfig] = useState<{
    askIntolerances: boolean;
    askEmail: boolean;
    askPhone: boolean;
    customFields: Array<{ id: string; label: string; type: "text" | "checkbox"; required?: boolean }>;
  }>({ askIntolerances: true, askEmail: false, askPhone: false, customFields: [] });

  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    guestsCount: number;
    status: "yes" | "maybe" | "no";
    allergies: string;
    customResponses: Record<string, any>;
    email: string;
    phone: string;
  }>({
    name: "",
    guestsCount: 1,
    status: "yes",
    allergies: "",
    customResponses: {},
    email: "",
    phone: "",
  });

  /* --- Extra fields per aggiunta manuale (contatti opzionali, sempre disponibili
     lato owner indipendentemente da come è configurato il form pubblico) --- */
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const meRes = await apiFetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meData.user) throw new Error("Unauthorized");
        setAuthChecked(true);

        const evRes = await apiFetch(`/api/events/${slug}/private`);
        if (evRes.ok) {
          const evData = await evRes.json();
          setEventTitle(evData.title || slug || "");

          // ✅ Estrai config del blocco RSVP (se presente) per popolare il form manuale
          //    con le stesse domande personalizzate configurate in editor.
          const rsvpBlock = (evData.blocks || []).find((b: any) => b?.type === "rsvp");
          if (rsvpBlock) {
            const wp = rsvpBlock.widgetProps || {};
            setRsvpConfig({
              askIntolerances: wp.rsvpAskIntolerances !== false, // default true
              askEmail: wp.rsvpAskEmail === true,                // default false
              askPhone: wp.rsvpAskPhone === true,                // default false
              customFields: Array.isArray(wp.customFields) ? wp.customFields : [],
            });
          }
        } else {
          setEventTitle(slug || "");
        }

        const rRes = await apiFetch(`/api/events/${slug}/rsvps`);
        if (rRes.ok) {
          const rData = await rRes.json();
          setRsvps(Array.isArray(rData) ? rData : []);
        } else {
          setRsvps([]);
        }
      } catch (err: any) {
        if (err.message !== "Unauthorized") {
          console.error(err);
          setRsvps([]);
          setEventTitle(slug || "");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [slug]);

  const counts = useMemo(() => {
    const base = {
      yesResponses: 0,
      maybeResponses: 0,
      noResponses: 0,
      yesGuests: 0,
      maybeGuests: 0,
      noGuests: 0,
    };

    for (const r of rsvps) {
      const guests = Number(r.guestsCount) || 1;
      if (r.status === "yes") {
        base.yesResponses += 1;
        base.yesGuests += guests;
      } else if (r.status === "maybe") {
        base.maybeResponses += 1;
        base.maybeGuests += guests;
      } else if (r.status === "no") {
        base.noResponses += 1;
        base.noGuests += guests;
      }
    }
    return base;
  }, [rsvps]);

  const filteredRsvps = useMemo(() => {
    if (filterStatus === "all") return rsvps;
    return rsvps.filter((r) => r.status === filterStatus);
  }, [rsvps, filterStatus]);

  /* --- Union di TUTTE le domande custom mai ricevute → header dinamici CSV --- */
  const allCustomLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rsvps) {
      for (const cr of r.customResponses || []) {
        if (cr.fieldId && !map.has(cr.fieldId)) map.set(cr.fieldId, cr.label || cr.fieldId);
      }
    }
    return Array.from(map.entries()); // [ [id, label], ... ]
  }, [rsvps]);

  /* --- Colonne contatto dinamiche: includiamo email/telefono SOLO se almeno
     una RSVP le ha valorizzate. Evita colonne "morte" nei PDF/CSV se il form
     pubblico non chiede quei campi. --- */
  const hasAnyEmail = useMemo(() => rsvps.some((r) => !!r.email), [rsvps]);
  const hasAnyPhone = useMemo(() => rsvps.some((r) => !!r.phone), [rsvps]);

  const statusLabel = (s: RSVP["status"]) =>
    s === "yes" ? "Partecipa" : s === "maybe" ? "Forse" : "Non può";

  /** CSV completo: una riga per ospite con TUTTI i dati disponibili. */
  const handleExportAllCsv = () => {
    const baseHeaders: string[] = ["Nome"];
    if (hasAnyEmail) baseHeaders.push("Email");
    if (hasAnyPhone) baseHeaders.push("Telefono");
    baseHeaders.push("N. Ospiti", "Stato", "Allergie", "Data risposta");
    const customHeaders = allCustomLabels.map(([, label]) => label);
    const headers = [...baseHeaders, ...customHeaders];

    const rows = rsvps.map((r) => {
      const base: (string | number)[] = [r.name || ""];
      if (hasAnyEmail) base.push(r.email || "");
      if (hasAnyPhone) base.push(r.phone || "");
      base.push(
        r.guestsCount ?? 1,
        statusLabel(r.status),
        extractAllergies(r),
        r.createdAt ? new Date(r.createdAt).toLocaleString("it-IT") : ""
      );
      const customValues = allCustomLabels.map(([id]) => {
        const cr = (r.customResponses || []).find((x) => x.fieldId === id);
        return cr ? formatCustomAnswer(cr) : "";
      });
      return [...base, ...customValues];
    });

    const csv = buildCsv(headers, rows);
    const safeSlug = (slug || eventTitle || "evento").replace(/[^a-z0-9-_]/gi, "_");
    downloadCsv(`rsvps_${safeSlug}.csv`, csv);
  };

  /** CSV per catering: SOLO ospiti con allergie dichiarate. */
  const handleExportAllergiesCsv = () => {
    const withAllergies = rsvps
      .map((r) => ({ r, allergies: extractAllergies(r) }))
      .filter((x) => x.allergies && x.r.status !== "no");

    if (withAllergies.length === 0) {
      alert("Nessuna allergia/intolleranza segnalata dagli ospiti.");
      return;
    }

    const headers: string[] = ["Nome", "N. Ospiti", "Stato", "Allergie / Intolleranze"];
    if (hasAnyEmail) headers.push("Email");
    if (hasAnyPhone) headers.push("Telefono");
    const rows = withAllergies.map(({ r, allergies }) => {
      const row: (string | number)[] = [
        r.name || "",
        r.guestsCount ?? 1,
        statusLabel(r.status),
        allergies,
      ];
      if (hasAnyEmail) row.push(r.email || "");
      if (hasAnyPhone) row.push(r.phone || "");
      return row;
    });

    const csv = buildCsv(headers, rows);
    const safeSlug = (slug || eventTitle || "evento").replace(/[^a-z0-9-_]/gi, "_");
    downloadCsv(`allergie_catering_${safeSlug}.csv`, csv);
  };

  /* ============================================================
     PDF EXPORT — stesso contenuto del CSV, ma in formato
     stampabile / condivisibile (più adatto per fornitori, catering,
     agenzie di wedding planning che non masticano Excel).
     Uso `jspdf` + `jspdf-autotable` per tabelle pulite multi-pagina.
  ============================================================ */
  const pdfHeader = (doc: jsPDF, title: string, subtitle: string) => {
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(20, 184, 166); // --accent Tiffany
    doc.rect(0, 0, pageW, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("EENVEE · RSVP", 12, 12);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, 12, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitle, 12, 37);
    const genDate = new Date().toLocaleString("it-IT");
    doc.text(`Generato il ${genDate}`, pageW - 12, 37, { align: "right" });
  };

  const pdfFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`Pagina ${i} di ${pageCount}`, pageW - 12, pageH - 8, { align: "right" });
      doc.text("eenvee · gestione RSVP", 12, pageH - 8);
    }
  };

  /** PDF completo: summary + tabella con tutti i dati + domande custom. */
  const handleExportAllPdf = () => {
    if (rsvps.length === 0) {
      alert("Nessuna RSVP da esportare.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdfHeader(doc, eventTitle || "Evento", "Elenco completo RSVP");

    // Summary box
    const totalGuests = counts.yesGuests + counts.maybeGuests;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const summary = `Conferme: ${counts.yesResponses} (${counts.yesGuests} ospiti)  ·  Forse: ${counts.maybeResponses} (${counts.maybeGuests} ospiti)  ·  Non possono: ${counts.noResponses}  ·  Totale atteso: ~${totalGuests}`;
    doc.text(summary, 12, 46);

    const baseHeaders: string[] = ["Nome"];
    if (hasAnyEmail) baseHeaders.push("Email");
    if (hasAnyPhone) baseHeaders.push("Telefono");
    baseHeaders.push("Osp.", "Stato", "Allergie");
    const customHeaders = allCustomLabels.map(([, label]) => label);
    const headers = [...baseHeaders, ...customHeaders];

    // Indice della colonna "Stato" dipende dalla presenza di email/telefono.
    const statusColumnIndex = 1 + (hasAnyEmail ? 1 : 0) + (hasAnyPhone ? 1 : 0) + 1; // Nome + (Email?) + (Tel?) + Osp.

    const body = rsvps.map((r) => {
      const base: string[] = [r.name || "—"];
      if (hasAnyEmail) base.push(r.email || "—");
      if (hasAnyPhone) base.push(r.phone || "—");
      base.push(
        String(r.guestsCount ?? 1),
        statusLabel(r.status),
        extractAllergies(r) || "—"
      );
      const customValues = allCustomLabels.map(([id]) => {
        const cr = (r.customResponses || []).find((x) => x.fieldId === id);
        return cr ? formatCustomAnswer(cr) : "—";
      });
      return [...base, ...customValues];
    });

    autoTable(doc, {
      head: [headers],
      body,
      startY: 52,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 247, 247] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === statusColumnIndex) {
          const val = String(data.cell.raw || "");
          if (val === "Partecipa") data.cell.styles.textColor = [20, 120, 90];
          else if (val === "Forse") data.cell.styles.textColor = [180, 130, 0];
          else if (val === "Non può") data.cell.styles.textColor = [180, 60, 60];
        }
      },
    });

    pdfFooter(doc);
    const safeSlug = (slug || eventTitle || "evento").replace(/[^a-z0-9-_]/gi, "_");
    doc.save(`rsvps_${safeSlug}.pdf`);
  };

  /** PDF per catering: SOLO ospiti con allergie — formato stampabile chiaro. */
  const handleExportAllergiesPdf = () => {
    const withAllergies = rsvps
      .map((r) => ({ r, allergies: extractAllergies(r) }))
      .filter((x) => x.allergies && x.r.status !== "no");

    if (withAllergies.length === 0) {
      alert("Nessuna allergia/intolleranza segnalata dagli ospiti.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdfHeader(doc, eventTitle || "Evento", "Lista allergie / intolleranze per catering");

    const totalAffected = withAllergies.reduce((sum, x) => sum + (Number(x.r.guestsCount) || 1), 0);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Ospiti con allergie segnalate: ${withAllergies.length}  ·  Totale persone coinvolte: ~${totalAffected}`,
      12,
      46
    );

    // Colonna "Contatto" presente solo se almeno una RSVP ha email/telefono.
    const hasContact = hasAnyEmail || hasAnyPhone;
    const headers: string[] = ["Nome", "Osp.", "Stato", "Allergie / Intolleranze"];
    if (hasContact) headers.push("Contatto");

    autoTable(doc, {
      head: [headers],
      body: withAllergies.map(({ r, allergies }) => {
        const row: string[] = [
          r.name || "—",
          String(r.guestsCount ?? 1),
          statusLabel(r.status),
          allergies,
        ];
        if (hasContact) {
          row.push([r.email, r.phone].filter(Boolean).join("\n") || "—");
        }
        return row;
      }),
      startY: 52,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3.5, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: [244, 196, 107], textColor: 70, fontStyle: "bold" },
      columnStyles: hasContact
        ? {
            0: { cellWidth: 40, fontStyle: "bold" },
            1: { cellWidth: 14, halign: "center" },
            2: { cellWidth: 22 },
            3: { cellWidth: "auto", textColor: [140, 80, 15], fontStyle: "bold" },
            4: { cellWidth: 40, fontSize: 9, textColor: [100, 100, 100] },
          }
        : {
            0: { cellWidth: 50, fontStyle: "bold" },
            1: { cellWidth: 18, halign: "center" },
            2: { cellWidth: 28 },
            3: { cellWidth: "auto", textColor: [140, 80, 15], fontStyle: "bold" },
          },
    });

    pdfFooter(doc);
    const safeSlug = (slug || eventTitle || "evento").replace(/[^a-z0-9-_]/gi, "_");
    doc.save(`allergie_catering_${safeSlug}.pdf`);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");
    setManualSending(true);

    if (!manualName.trim()) return;

    // Costruisci payload risposte custom allineato al formato del widget pubblico
    // (array denormalizzato con label/type snapshotted al momento dell'inserimento).
    const customResponsesPayload = rsvpConfig.customFields
      .filter((f) => manualCustom[f.id] !== undefined && manualCustom[f.id] !== "")
      .map((f) => ({
        fieldId: f.id,
        label: f.label || "Domanda",
        type: f.type === "checkbox" ? "checkbox" : "text",
        answer: manualCustom[f.id] ?? null,
      }));

    try {
      const res = await apiFetch(`/api/rsvps`, {
        method: "POST",
        body: JSON.stringify({
          eventSlug: slug,
          name: manualName,
          email: manualEmail.trim() || null,
          phone: manualPhone.trim() || null,
          guestsCount: Number(manualGuests) || 1,
          message: "",
          status: manualStatus,
          allergies: manualAllergies.trim(),
          customResponses: customResponsesPayload,
        }),
      });

      if (!res.ok) throw new Error("Errore aggiunta manuale");

      const data = await res.json();
      const created = data.rsvp || data;
      setRsvps((prev) => [created, ...prev]);

      setManualName("");
      setManualGuests(1);
      setManualStatus("yes");
      setManualAllergies("");
      setManualCustom({});
      setManualEmail("");
      setManualPhone("");
    } catch (err) {
      console.error(err);
      setManualError("Non siamo riusciti ad aggiungere l'ospite. Riprova.");
    } finally {
      setManualSending(false);
    }
  };

  const startEdit = (r: RSVP) => {
    setEditingId(r._id);

    // Pre-popola le risposte custom esistenti indicizzate per fieldId così
    // l'utente vede e può modificare quelle già presenti senza doverle riscrivere.
    const existingCustom: Record<string, any> = {};
    (r.customResponses || []).forEach((cr: any) => {
      if (cr?.fieldId !== undefined) existingCustom[cr.fieldId] = cr.answer;
    });

    setEditForm({
      name: r.name || "",
      guestsCount: Number(r.guestsCount) || 1,
      status: r.status || "yes",
      allergies: extractAllergies(r) || "",
      customResponses: existingCustom,
      email: r.email || "",
      phone: r.phone || "",
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    try {
      // Ricostruisce il payload risposte custom in formato denormalizzato,
      // usando la config del blocco come source of truth per label/type.
      // Fallback: se un fieldId non è più nella config (es. domanda rimossa
      // dopo la risposta), la conserviamo comunque con label = fieldId.
      const configById = new Map(rsvpConfig.customFields.map((f) => [f.id, f]));
      const allIds = new Set<string>([
        ...Object.keys(editForm.customResponses),
        ...rsvpConfig.customFields.map((f) => f.id),
      ]);
      const customResponsesPayload = Array.from(allIds)
        .map((fid) => {
          const conf = configById.get(fid);
          const answer = editForm.customResponses[fid];
          if (answer === undefined || answer === "" || answer === null) return null;
          return {
            fieldId: fid,
            label: conf?.label || fid,
            type: conf?.type === "checkbox" ? "checkbox" : "text",
            answer,
          };
        })
        .filter(Boolean);

      const res = await apiFetch(`/api/rsvps/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name,
          guestsCount: Number(editForm.guestsCount) || 1,
          status: editForm.status,
          allergies: editForm.allergies.trim(),
          customResponses: customResponsesPayload,
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
        }),
      });

      if (!res.ok) throw new Error("Errore update RSVP");
      const updated = await res.json();
      setRsvps((prev) => prev.map((r) => (r._id === id ? updated : r)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Non siamo riusciti a salvare la modifica. Riprova.");
    }
  };

  const deleteRsvp = async (id: string) => {
    try {
      const res = await apiFetch(`/api/rsvps/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Errore delete RSVP");
      setRsvps((prev) => prev.filter((r) => r._id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      alert("Non siamo riusciti a eliminare la RSVP. Riprova.");
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="rsvp-page">
        <div className="rsvp-shell">
          <Surface variant="glass">Caricamento RSVP...</Surface>
        </div>
      </div>
    );
  }

  const filterOptions = [
    { key: "all", label: "Tutti", icon: Users },
    { key: "yes", label: "Partecipa", icon: CheckCircle2 },
    { key: "maybe", label: "Forse", icon: HelpCircle },
    { key: "no", label: "No", icon: XCircle },
  ];

  return (
    <div className="rsvp-page">
      <div className="rsvp-shell">
        <div className="rsvp-topbar">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            ← Torna alla dashboard
          </Button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p className="rsvp-eyebrow">INVITATI & RSVP</p>
              <h1>{eventTitle}</h1>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                Gestisci conferme, aggiungi manualmente ospiti e tieni traccia delle modifiche.
              </p>
            </div>
          </div>
        </div>

        <Surface variant="glass" className="rsvp-manual-card" style={{ padding: '2rem', border: '1px solid var(--border-color-strong)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <p className="rsvp-eyebrow" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.25em' }}>AGGIUNTA MANUALE</p>
            <h2 style={{ margin: '0.4rem 0 0', fontSize: '1.6rem', fontFamily: 'var(--font-display)' }}>Inserisci un nuovo ospite</h2>
          </div>

          <form onSubmit={handleManualAdd}>
            {/* Riga principale: dati anagrafici minimi */}
            <div className="rsvp-form-grid">
              <div className="input-group">
                <label>Nome Ospite</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Mario Rossi"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="rsvp-input"
                />
              </div>

              <div className="input-group">
                <label>Numero Ospiti</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={manualGuests}
                  onChange={(e) => setManualGuests(e.target.value)}
                  className="rsvp-input"
                />
              </div>

              <div className="input-group">
                <label>Stato</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="rsvp-select"
                >
                  <option value="yes">Partecipa</option>
                  <option value="maybe">Forse</option>
                  <option value="no">Non può</option>
                </select>
              </div>
            </div>

            {/* DATI AGGIUNTIVI — sezione estesa con contatti opzionali,
                 allergie (se il form pubblico le chiede) e domande custom.
                 Mostrata se lo stato non è "Non può" — coerente col form pubblico. */}
            {manualStatus !== "no" && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <p className="rsvp-eyebrow" style={{ margin: '0 0 1rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--accent)' }}>
                  DATI AGGIUNTIVI
                </p>

                {/* Contatti — sempre disponibili lato owner (anche se il form
                     pubblico non li chiede): utili per promemoria/comunicazioni. */}
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1rem' }}>
                  <div className="input-group">
                    <label>Email <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(opzionale)</span></label>
                    <input
                      type="email"
                      placeholder="ospite@esempio.it"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      className="rsvp-input"
                      autoComplete="off"
                    />
                  </div>
                  <div className="input-group">
                    <label>Telefono <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(opzionale)</span></label>
                    <input
                      type="tel"
                      placeholder="+39 333 123 4567"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="rsvp-input"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Allergie / Intolleranze — solo se il form pubblico le chiede */}
                {rsvpConfig.askIntolerances && (
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label>Allergie / Intolleranze <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(opzionale)</span></label>
                    <input
                      type="text"
                      placeholder="Es. glutine, lattosio, frutta secca... (vuoto = nessuna)"
                      value={manualAllergies}
                      onChange={(e) => setManualAllergies(e.target.value)}
                      className="rsvp-input"
                    />
                  </div>
                )}

                {/* Risposte alle domande personalizzate del modulo RSVP */}
                {rsvpConfig.customFields.length > 0 && (
                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {rsvpConfig.customFields.map((field) => (
                      <div key={field.id} className="input-group">
                        <label>
                          {field.label || "Domanda"}
                          {field.required && <span style={{ color: 'var(--accent)' }}> *</span>}
                        </label>
                        {field.type === "checkbox" ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(["Sì", "No"] as const).map((opt) => {
                              const selected = manualCustom[field.id] === opt;
                              return (
                                <Button
                                  key={opt}
                                  type="button"
                                  variant={selected ? "primary" : "subtle"}
                                  onClick={() => setManualCustom((p) => ({ ...p, [field.id]: opt }))}
                                  style={{ flex: 1, justifyContent: 'center', fontWeight: 700, padding: '10px 12px' }}
                                >
                                  {opt}
                                </Button>
                              );
                            })}
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Risposta dell'ospite..."
                            value={manualCustom[field.id] || ""}
                            onChange={(e) => setManualCustom((p) => ({ ...p, [field.id]: e.target.value }))}
                            className="rsvp-input"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div style={{ marginTop: '1.5rem' }}>
              <Button type="submit" disabled={manualSending} style={{ width: '100%', height: '52px', fontWeight: 800, fontSize: '1rem' }}>
                {manualSending ? "Aggiungo..." : "Aggiungi ospite"}
              </Button>
            </div>
          </form>

          {manualError && (
            <p style={{ color: "salmon", marginTop: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{manualError}</p>
          )}
        </Surface>

        <div className="rsvp-stats" style={{ marginTop: '2rem' }}>
          <StatCard label="Conferme" value={counts.yesResponses} hint={`${counts.yesGuests} ospiti`} />
          <StatCard label="Forse" value={counts.maybeResponses} hint={`${counts.maybeGuests} ospiti`} />
          <StatCard label="Non possono" value={counts.noResponses} hint={`${counts.noGuests} ospiti`} />
        </div>

        {/* EXPORT — CSV (Excel/Numbers) oppure PDF (stampabile/condivisibile) */}
        {rsvps.length > 0 && (
          <Surface variant="soft" style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
              <Download size={16} style={{ color: 'var(--accent)' }} />
              <p className="rsvp-eyebrow" style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--accent)' }}>
                ESPORTA DATI OSPITI
              </p>
            </div>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-soft)', fontSize: '0.85rem' }}>
              Scarica l'elenco in PDF (formato stampabile, pronto da condividere con catering e fornitori) oppure in CSV (Excel / Numbers) se devi elaborare i dati.
            </p>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {/* ───── Gruppo 1: Elenco completo ───── */}
              <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(var(--accent-rgb), 0.12)', border: '1px solid rgba(var(--accent-rgb), 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList size={16} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Elenco completo</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-soft)' }}>Tutti gli ospiti + domande personalizzate</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem' }}>
                  <Button variant="primary" onClick={handleExportAllPdf} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', fontWeight: 700, fontSize: '12px' }}>
                    <FileText size={14} /> PDF
                  </Button>
                  <Button variant="subtle" onClick={handleExportAllCsv} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', fontWeight: 700, fontSize: '12px' }}>
                    <Download size={14} /> CSV
                  </Button>
                </div>
              </div>

              {/* ───── Gruppo 2: Allergie catering ───── */}
              <div style={{ padding: '1rem', border: '1px solid rgba(244, 196, 107, 0.35)', borderRadius: '14px', background: 'rgba(244, 196, 107, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(244, 196, 107, 0.2)', border: '1px solid rgba(244, 196, 107, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ChefHat size={16} color="#b8862a" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Allergie per catering</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-soft)' }}>Solo ospiti con intolleranze segnalate</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem' }}>
                  <Button variant="subtle" onClick={handleExportAllergiesPdf} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', fontWeight: 700, fontSize: '12px', background: 'rgba(244, 196, 107, 0.85)', color: '#3d2a05', border: '1px solid rgba(244, 196, 107, 1)' }}>
                    <FileText size={14} /> PDF
                  </Button>
                  <Button variant="subtle" onClick={handleExportAllergiesCsv} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', fontWeight: 700, fontSize: '12px', background: 'rgba(244, 196, 107, 0.15)', color: '#b8862a', border: '1px solid rgba(244, 196, 107, 0.45)' }}>
                    <Download size={14} /> CSV
                  </Button>
                </div>
              </div>
            </div>
          </Surface>
        )}

        <div style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>
          <p className="rsvp-eyebrow" style={{ marginBottom: '0.8rem', opacity: 0.8 }}>Filtra per stato:</p>
          <Surface variant="soft" className="rsvp-filters" style={{ margin: 0 }}>
            {filterOptions.map((opt) => {
              const isSelected = filterStatus === opt.key;
              let bgColor = "transparent";
              let color = "var(--text-soft)";
              
              if (isSelected) {
                if (opt.key === "yes") {
                  bgColor = "rgba(var(--accent-rgb), 0.1)";
                  color = "var(--accent)";
                } else if (opt.key === "maybe") {
                  bgColor = "rgba(244, 196, 107, 0.15)";
                  color = "#d9a13e";
                } else if (opt.key === "no") {
                  bgColor = "rgba(250, 128, 114, 0.15)";
                  color = "#e66a5c";
                } else {
                  bgColor = "var(--accent)";
                  color = "#fff";
                }
              }

              return (
                <Button
                  key={opt.key}
                  variant={isSelected ? "primary" : "ghost"}
                  onClick={() => setFilterStatus(opt.key)}
                  className="rsvp-filter-btn"
                  style={{
                    backgroundColor: bgColor,
                    color: color,
                    border: isSelected ? `1px solid ${color}` : "1px solid var(--border)",
                    opacity: 1,
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {opt.icon && <opt.icon size={22} className="filter-icon" />}
                  <span className="filter-label">{opt.label}</span>
                </Button>
              );
            })}
          </Surface>
        </div>

        {filteredRsvps.length === 0 ? (
          <Surface variant="soft" className="rsvp-empty">
            Nessuna RSVP per questo filtro.
          </Surface>
        ) : (
          <div className="rsvp-list">
            {filteredRsvps.map((r) => {
              const isEditing = editingId === r._id;
              const isDeleting = deletingId === r._id;

              const statusBadge = (
                <Badge
                  variant={
                    r.status === "yes"
                      ? "success"
                      : r.status === "maybe"
                      ? "warning"
                      : "default"
                  }
                >
                  {r.status === "yes" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><CheckCircle2 size={14} /> Partecipa</span>
                  ) : r.status === "maybe" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><HelpCircle size={14} /> Forse</span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><XCircle size={14} /> Non può</span>
                  )}
                </Badge>
              );

              return (
                <div key={r._id || `${r.name}-${r.createdAt}`} className={`rsvp-card rsvp-card-${r.status}`}>
                  <div className="rsvp-card-header">
                    <div>
                      {!isEditing ? (
                        <>
                          <strong>{r.name || "(senza nome)"}</strong>
                          <p style={{ margin: "0.2rem 0 0", color: "var(--text-soft)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Users size={14} /> {r.guestsCount} ospiti
                          </p>
                          {(r.email || r.phone) && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px", fontSize: "12px", color: "var(--text-soft)" }}>
                              {r.email && (
                                <a href={`mailto:${r.email}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-soft)", textDecoration: "none" }}>
                                  <Mail size={12} /> {r.email}
                                </a>
                              )}
                              {r.phone && (
                                <a href={`tel:${r.phone.replace(/\s+/g, "")}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-soft)", textDecoration: "none" }}>
                                  <Phone size={12} /> {r.phone}
                                </a>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="input-group">
                          <label>Nome Ospite</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="rsvp-input"
                          />
                        </div>
                      )}
                    </div>
                    <div style={{ alignSelf: 'flex-start' }}>
                      {statusBadge}
                    </div>
                  </div>

                  {isEditing ? (
                    <>
                      {/* Riga base: Num. ospiti + Stato */}
                      <div className="rsvp-form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: '0.5rem' }}>
                        <div className="input-group">
                          <label>Num. Ospiti</label>
                          <input
                            type="number"
                            min="1"
                            value={editForm.guestsCount}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, guestsCount: Number(e.target.value) || 1 }))
                            }
                            className="rsvp-input"
                          />
                        </div>
                        <div className="input-group">
                          <label>Stato</label>
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, status: e.target.value as any }))
                            }
                            className="rsvp-select"
                          >
                            <option value="yes">Partecipa</option>
                            <option value="maybe">Forse</option>
                            <option value="no">Non può</option>
                          </select>
                        </div>
                      </div>

                      {/* DATI AGGIUNTIVI — contatti + allergie + domande custom.
                          Sempre mostrato se status != "no" così l'owner può
                          aggiungere/correggere contatti anche per vecchi record. */}
                      {editForm.status !== "no" && (
                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                          <p className="rsvp-eyebrow" style={{ margin: '0 0 0.75rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--accent)' }}>
                            DATI AGGIUNTIVI
                          </p>

                          {/* Contatti opzionali — sempre editabili lato owner */}
                          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1rem' }}>
                            <div className="input-group">
                              <label>Email <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(opz.)</span></label>
                              <input
                                type="email"
                                placeholder="ospite@esempio.it"
                                value={editForm.email}
                                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                                className="rsvp-input"
                              />
                            </div>
                            <div className="input-group">
                              <label>Telefono <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(opz.)</span></label>
                              <input
                                type="tel"
                                placeholder="+39 333 123 4567"
                                value={editForm.phone}
                                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                                className="rsvp-input"
                              />
                            </div>
                          </div>

                          {(rsvpConfig.askIntolerances || editForm.allergies) && (
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                              <label>
                                Allergie / Intolleranze <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(vuoto = nessuna)</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Es. glutine, lattosio, frutta secca..."
                                value={editForm.allergies}
                                onChange={(e) => setEditForm((p) => ({ ...p, allergies: e.target.value }))}
                                className="rsvp-input"
                              />
                            </div>
                          )}

                          {rsvpConfig.customFields.length > 0 && (
                            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                              {rsvpConfig.customFields.map((field) => {
                                const val = editForm.customResponses[field.id];
                                return (
                                  <div key={field.id} className="input-group">
                                    <label>
                                      {field.label || "Domanda"}
                                      {field.required && <span style={{ color: 'var(--accent)' }}> *</span>}
                                    </label>
                                    {field.type === "checkbox" ? (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        {(["Sì", "No"] as const).map((opt) => {
                                          const selected = val === opt;
                                          return (
                                            <Button
                                              key={opt}
                                              type="button"
                                              variant={selected ? "primary" : "subtle"}
                                              onClick={() => setEditForm((p) => ({ ...p, customResponses: { ...p.customResponses, [field.id]: opt } }))}
                                              style={{ flex: 1, justifyContent: 'center', fontWeight: 700, padding: '10px 12px' }}
                                            >
                                              {opt}
                                            </Button>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        placeholder="Risposta..."
                                        value={val || ""}
                                        onChange={(e) => setEditForm((p) => ({ ...p, customResponses: { ...p.customResponses, [field.id]: e.target.value } }))}
                                        className="rsvp-input"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* ALLERGIE — callout color warm con icona */}
                      {(() => {
                        const allergies = extractAllergies(r);
                        if (!allergies) return null;
                        return (
                          <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '10px 12px', marginTop: '0.75rem',
                            background: 'rgba(244, 196, 107, 0.12)',
                            border: '1px solid rgba(244, 196, 107, 0.35)',
                            borderRadius: '10px',
                            color: '#8a6013'
                          }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: '2px' }}>
                                Allergie / Intolleranze
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' }}>
                                {allergies}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* RISPOSTE CUSTOM — griglia etichetta/valore, tipografia più distinta */}
                      {r.customResponses && r.customResponses.length > 0 && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '12px 14px',
                          background: 'rgba(var(--accent-rgb), 0.04)',
                          border: '1px solid rgba(var(--accent-rgb), 0.15)',
                          borderRadius: '10px',
                          display: 'grid',
                          gap: '10px',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                        }}>
                          {r.customResponses.map((cr) => (
                            <div key={cr.fieldId} style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--accent)',
                                marginBottom: '3px',
                                opacity: 0.85
                              }}>
                                {cr.label}
                              </div>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                wordBreak: 'break-word',
                                lineHeight: 1.35
                              }}>
                                {formatCustomAnswer(cr) || <span style={{ color: 'var(--text-soft)', fontWeight: 400 }}>—</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* MESSAGGIO LIBERO — reso solo se non è già stato mappato come allergie */}
                      {r.message && !/nessuna allergia/i.test(r.message) && r.message !== extractAllergies(r) && (
                        <div className="rsvp-message">{r.message}</div>
                      )}
                    </>
                  )}

                  <div className="rsvp-card-actions">
                    {!isEditing ? (
                      <>
                        <Button variant="ghost" onClick={() => startEdit(r)}>
                          Modifica
                        </Button>
                        <Button
                          variant={isDeleting ? "danger" : "ghost"}
                          onClick={() => {
                            if (isDeleting) {
                              deleteRsvp(r._id);
                            } else {
                              setDeletingId(r._id);
                              setTimeout(() => setDeletingId(null), 2500);
                            }
                          }}
                        >
                          {isDeleting ? "Conferma eliminazione" : "Elimina"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => saveEdit(r._id)}>Salva</Button>
                        <Button variant="ghost" onClick={cancelEdit}>
                          Annulla
                        </Button>
                      </>
                    )}
                  </div>

                  {r.createdAt && (
                    <small style={{ color: "var(--text-soft)" }}>
                      Ricevuto il {new Date(r.createdAt).toLocaleString("it-IT")}
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
