import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../ui";
import "./CookieBanner.css";

const STORAGE_KEY = "eenvee_cookie_info_v1";

/**
 * Informativa breve e consapevolezza sull'uso di cookie / storage necessari (GDPR/ePrivacy, lettura semplificata).
 * Non sostituisce consulenza legale; memorizza solo che l'utente ha visto l'avviso.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ t: Date.now() }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Informativa sui cookie">
      <div className="cookie-banner__inner">
        <p className="cookie-banner__text">
          Usiamo cookie e storage necessari a login, sicurezza e funzionamento del servizio. Per i dettagli:{" "}
          <Link to="/cookie">Cookie Policy</Link> e <Link to="/privacy">Privacy</Link>. Continuando accetti
          l’uso di queste tecnologie secondo l’informativa.
        </p>
        <div className="cookie-banner__actions">
          <Button type="button" onClick={accept} className="cookie-banner__btn">
            Ho capito
          </Button>
        </div>
      </div>
    </div>
  );
}
