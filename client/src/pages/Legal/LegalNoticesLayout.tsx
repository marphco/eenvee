import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../ui";
import { LEGAL, companyFullAddress } from "../../config/legalEntity";
import "./LegalNoticesLayout.css";

type Props = {
  eyebrow: string;
  title: string;
  updatedLabel?: string;
  children: React.ReactNode;
};

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
          <p className="legal-page__foot-line">
            <strong>{LEGAL.brand}</strong> è un marchio di <strong>{LEGAL.company.legalName}</strong> — {companyFullAddress()} —
            P.IVA {LEGAL.company.vat} — R.E.A. {LEGAL.company.rea} — PEC{" "}
            <a href={`mailto:${LEGAL.company.pec}`}>{LEGAL.company.pec}</a>
          </p>
          <p>
            Contatti: <a href={`mailto:${LEGAL.publicEmail}`}>{LEGAL.publicEmail}</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
