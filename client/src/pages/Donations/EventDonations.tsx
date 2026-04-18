import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/apiFetch";
import { Surface, Button, Badge, StatCard } from "../../ui";
import {
  Gift,
  Download,
  AlertTriangle,
  Search,
  FileText,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import StripeEmbeddedPayments from "../Editor/components/stripe/StripeEmbeddedPayments";
import "./EventDonations.css";

type DonationStatus = "requires_payment" | "processing" | "succeeded" | "failed" | "refunded" | "disputed";

interface Donation {
  _id: string;
  eventSlug: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  applicationFee: number;
  netToHost: number;
  status: DonationStatus;
  donor?: {
    name?: string;
    email?: string;
    message?: string;
  };
  createdAt?: string;
}

interface DonationsResponse {
  donations: Donation[];
  totals: {
    grossReceived: number;
    netReceived: number;
    count: number;
  };
}

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

function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

type BadgeTone = "default" | "accent" | "success" | "warning";
function statusLabel(s: DonationStatus): { label: string; tone: BadgeTone } {
  switch (s) {
    case "succeeded":
      return { label: "Completato", tone: "success" };
    case "refunded":
      return { label: "Rimborsato", tone: "warning" };
    case "disputed":
      return { label: "Contestato", tone: "warning" };
    case "failed":
      return { label: "Fallito", tone: "warning" };
    case "processing":
      return { label: "In elaborazione", tone: "accent" };
    default:
      return { label: "In attesa", tone: "default" };
  }
}

export default function EventDonations() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [totals, setTotals] = useState({ grossReceived: 0, netReceived: 0, count: 0 });
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [filterStatus, setFilterStatus] = useState<"all" | DonationStatus>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "stripe">("table");

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
        } else {
          setEventTitle(slug || "");
        }

        const dRes = await apiFetch(`/api/donations/event/${slug}`);
        if (dRes.ok) {
          const dData: DonationsResponse = await dRes.json();
          setDonations(Array.isArray(dData.donations) ? dData.donations : []);
          setTotals(dData.totals || { grossReceived: 0, netReceived: 0, count: 0 });
        } else {
          setDonations([]);
        }
      } catch (err: any) {
        if (err.message !== "Unauthorized") {
          console.error(err);
          setDonations([]);
          setEventTitle(slug || "");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [slug]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donations.filter((d) => {
      if (filterStatus !== "all" && d.status !== filterStatus) return false;
      if (!q) return true;
      const hay = `${d.donor?.name || ""} ${d.donor?.email || ""} ${d.donor?.message || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [donations, filterStatus, search]);

  const avgAmount = useMemo(() => {
    if (totals.count === 0) return 0;
    return Math.round(totals.grossReceived / totals.count);
  }, [totals]);

  const handleExportCsv = () => {
    const headers = [
      "Data",
      "Donatore",
      "Email",
      "Messaggio",
      "Importo lordo (€)",
      "Commissione piattaforma (€)",
      "Netto ricevuto (€)",
      "Stato",
      "Stripe Payment Intent",
    ];
    const rows = donations.map((d) => [
      d.createdAt ? new Date(d.createdAt).toLocaleString("it-IT") : "",
      d.donor?.name || "Anonimo",
      d.donor?.email || "",
      d.donor?.message || "",
      (d.amount / 100).toFixed(2),
      (d.applicationFee / 100).toFixed(2),
      (d.netToHost / 100).toFixed(2),
      statusLabel(d.status).label,
      d.stripePaymentIntentId || "",
    ]);
    const csv = buildCsv(headers, rows);
    const safeSlug = (slug || "evento").replace(/[^a-z0-9-_]/gi, "_");
    downloadCsv(`regali_${safeSlug}.csv`, csv);
  };

  if (loading) {
    return (
      <div className="don-page">
        <div className="don-shell">
          <Surface variant="glass">Caricamento regali digitali…</Surface>
        </div>
      </div>
    );
  }

  if (!authChecked) return null;

  const filterOptions: Array<{ key: "all" | DonationStatus; label: string }> = [
    { key: "all", label: "Tutti" },
    { key: "succeeded", label: "Completati" },
    { key: "refunded", label: "Rimborsati" },
    { key: "disputed", label: "Contestati" },
    { key: "failed", label: "Falliti" },
  ];

  return (
    <div className="don-page">
      <div className="don-shell">
        <div className="don-topbar">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            ← Torna alla dashboard
          </Button>
          <div className="don-header">
            <div>
              <p className="don-eyebrow">REGALI DIGITALI</p>
              <h1>{eventTitle}</h1>
              <p className="don-subtitle">
                Monitora i regali ricevuti, scarica i dati e gestisci pagamenti e rimborsi senza
                uscire da eenvee.
              </p>
            </div>
            <div className="don-header-actions">
              <Button variant="subtle" onClick={() => navigate(`/edit/${slug}`)}>
                Modifica evento
              </Button>
              <Button onClick={handleExportCsv} disabled={donations.length === 0}>
                <Download size={16} style={{ marginRight: 8 }} />
                Esporta CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="don-stats-grid">
          <StatCard label="Regali ricevuti" value={String(totals.count)} />
          <StatCard label="Totale lordo" value={formatEuro(totals.grossReceived)} />
          <StatCard
            label="Netto sul tuo conto"
            value={formatEuro(totals.netReceived)}
            hint={totals.count > 0 ? "Accreditato via Stripe" : undefined}
          />
          <StatCard label="Regalo medio" value={formatEuro(avgAmount)} />
        </div>

        <Surface variant="glass" className="don-view-switcher">
          <button
            className={`don-view-tab ${view === "table" ? "is-active" : ""}`}
            onClick={() => setView("table")}
          >
            <BarChart3 size={16} />
            Panoramica eenvee
          </button>
          <button
            className={`don-view-tab ${view === "stripe" ? "is-active" : ""}`}
            onClick={() => setView("stripe")}
          >
            <ExternalLink size={16} />
            Vista Stripe (refund & dispute)
          </button>
        </Surface>

        {view === "table" && (
          <>
            <Surface variant="glass" className="don-filters-card">
              <div className="don-filters-row">
                <div className="don-filters-chips">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.key}
                      className={`don-chip ${filterStatus === opt.key ? "is-active" : ""}`}
                      onClick={() => setFilterStatus(opt.key)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="don-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Cerca per nome, email o messaggio…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </Surface>

            {filtered.length === 0 ? (
              <Surface variant="glass" className="don-empty">
                <Gift size={32} strokeWidth={1.5} />
                <h3>Nessun regalo ricevuto</h3>
                <p>
                  Quando i tuoi invitati faranno un regalo digitale, comparirà qui con tutti i
                  dettagli e potrai scaricarne il riepilogo in un click.
                </p>
              </Surface>
            ) : (
              <Surface variant="glass" className="don-table-card">
                <div className="don-table-wrapper">
                  <table className="don-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Donatore</th>
                        <th>Messaggio</th>
                        <th className="num">Lordo</th>
                        <th className="num">Commissione</th>
                        <th className="num">Netto</th>
                        <th>Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((d) => {
                        const sl = statusLabel(d.status);
                        return (
                          <tr key={d._id}>
                            <td className="don-cell-date">
                              {d.createdAt
                                ? new Date(d.createdAt).toLocaleString("it-IT", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td>
                              <div className="don-donor">
                                <strong>{d.donor?.name || "Anonimo"}</strong>
                                {d.donor?.email && <span>{d.donor.email}</span>}
                              </div>
                            </td>
                            <td className="don-cell-message">
                              {d.donor?.message ? (
                                <span title={d.donor.message}>{d.donor.message}</span>
                              ) : (
                                <span style={{ color: "var(--text-soft)" }}>—</span>
                              )}
                            </td>
                            <td className="num">{formatEuro(d.amount)}</td>
                            <td className="num don-fee">-{formatEuro(d.applicationFee)}</td>
                            <td className="num don-net">{formatEuro(d.netToHost)}</td>
                            <td>
                              <Badge variant={sl.tone}>{sl.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Surface>
            )}

            <Surface variant="glass" className="don-info-card">
              <AlertTriangle size={18} />
              <div>
                <strong>Come funzionano i pagamenti</strong>
                <p>
                  Gli importi lordi includono il regalo dell'invitato. La commissione di
                  piattaforma (3% + 0,50€) viene trattenuta automaticamente da eenvee; il netto
                  arriva direttamente sul tuo conto bancario tramite Stripe. Per rimborsi,
                  contestazioni e ricevute fiscali usa la{" "}
                  <button
                    type="button"
                    className="don-linklike"
                    onClick={() => setView("stripe")}
                  >
                    vista Stripe
                  </button>
                  .
                </p>
              </div>
            </Surface>
          </>
        )}

        {view === "stripe" && (
          <Surface variant="glass" className="don-stripe-card">
            <div className="don-stripe-header">
              <FileText size={18} />
              <div>
                <strong>Gestione avanzata pagamenti</strong>
                <p>
                  Vista Stripe embedded: ogni pagamento include dettagli completi (carta usata,
                  indirizzo, log 3DS), e da qui puoi emettere rimborsi o rispondere a
                  contestazioni senza uscire da eenvee.
                </p>
              </div>
            </div>
            <div className="don-stripe-embed">
              <StripeEmbeddedPayments />
            </div>
          </Surface>
        )}
      </div>
    </div>
  );
}
