import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../utils/apiFetch";
import { Surface, Button, Badge } from "../../ui";
import { BookUser, CheckCircle2 } from "lucide-react";
import "../Rsvps/EventRsvps.css";

export default function MobileImport() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNativeContactPicker = async () => {
    const supported = "contacts" in navigator && "ContactsManager" in window;
    if (!supported) {
      alert("Il tuo browser non supporta la rubrica da web. Prova Chrome su Android o aggiorna il browser.");
      return;
    }

    try {
      const props = ["name", "tel", "email"];
      const opts = { multiple: true };
      const contacts = await navigator.contacts?.select(props, opts);

      if (!contacts || contacts.length === 0) return;

      setStatus("loading");

      const parsedContacts = contacts.map((c) => ({
        name: (c.name && c.name[0]) || "Sconosciuto",
        phone: (c.tel && c.tel[0]) || "",
        email: (c.email && c.email[0]) || "",
        channel: "whatsapp",
      }));

      const res = await apiFetch(`/api/events/${slug}/invites`, {
        method: "POST",
        body: JSON.stringify({ contacts: parsedContacts }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  return (
    <div className="rsvp-page">
      <div className="rsvp-shell" style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Surface variant="glass" className="rsvp-empty-card" style={{ width: "100%", maxWidth: 440, padding: "2.5rem 1.75rem" }}>
          {status === "success" ? (
            <div>
              <CheckCircle2 size={56} style={{ color: "#3aaf92", margin: "0 auto 1.25rem", display: "block" }} aria-hidden />
              <p className="rsvp-eyebrow" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                IMPORT COMPLETATO
              </p>
              <h1 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-display, serif)", fontSize: "1.65rem", textAlign: "center", color: "var(--text-primary)" }}>
                Rubrica importata
              </h1>
              <p className="rsvp-subtitle" style={{ textAlign: "center", margin: 0 }}>
                I contatti sono stati aggiunti all&apos;evento. Torna al computer e ricarica la pagina inviti per vederli in elenco.
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 1.25rem",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(var(--accent-rgb), 0.1)",
                  border: "1px solid rgba(var(--accent-rgb), 0.22)",
                  color: "var(--accent)",
                }}
              >
                <BookUser size={34} aria-hidden />
              </div>
              <p className="rsvp-eyebrow" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                IMPORT DA TELEFONO
              </p>
              <h1 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-display, serif)", fontSize: "1.65rem", textAlign: "center", color: "var(--text-primary)" }}>
                Trasferisci contatti
              </h1>
              <p className="rsvp-subtitle" style={{ textAlign: "center", margin: "0 0 1.75rem" }}>
                Tocca il pulsante e scegli dalla rubrica del telefono i contatti da associare all&apos;evento. Devi essere connesso con lo stesso account eenvee.
              </p>

              <Button type="button" onClick={handleNativeContactPicker} disabled={status === "loading"} style={{ width: "100%", padding: "0.95rem 1rem" }}>
                {status === "loading" ? "Invio in corso…" : "Apri rubrica telefono"}
              </Button>

              {status === "error" ? (
                <Badge variant="warning" style={{ marginTop: "1rem", display: "block", textAlign: "center" }}>
                  Qualcosa non ha funzionato. Controlla la connessione e riprova.
                </Badge>
              ) : null}
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}
