import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../ui";
import "./LegalNoticesLayout.css";

type Props = {
  eyebrow: string;
  title: string;
  updatedLabel?: string;
  children: React.ReactNode;
};

/**
 * Guscio condiviso per Privacy, Termini, Cookie: tipografia e link interni coerenti con le altre pagine marketing/legal.
 */
export default function LegalNoticesLayout({ eyebrow, title, updatedLabel, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <div className="legal-page__toolbar">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            ← Indietro
          </Button>
          <div className="legal-page__toolbar-links">
            <Link to="/privacy">Privacy</Link>
            <span aria-hidden>·</span>
            <Link to="/termini">Termini</Link>
            <span aria-hidden>·</span>
            <Link to="/cookie">Cookie</Link>
          </div>
        </div>

        <header className="legal-page__header">
          <p className="legal-page__eyebrow">{eyebrow}</p>
          <h1 className="legal-page__title">{title}</h1>
          {updatedLabel && <p className="legal-page__updated">{updatedLabel}</p>}
        </header>

        <article className="legal-page__body">{children}</article>

        <footer className="legal-page__foot">
          <p>
            In caso di domande:{" "}
            <a href="mailto:privacy@eenvee.com">privacy@eenvee.com</a> (indirizzo indicativo: aggiornare con
            P.IVA e ragione sociale del titolare effettivo).
          </p>
        </footer>
      </div>
    </div>
  );
}
