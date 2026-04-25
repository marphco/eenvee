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
    <div className="cookie-banner">
      <div
        className="cookie-banner__card"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-desc"
      >
        <p id="cookie-banner-title" className="cookie-banner__eyebrow">
          Cookie e privacy
        </p>
        <div className="cookie-banner__content">
          <div id="cookie-banner-desc" className="cookie-banner__copy">
            <p className="cookie-banner__p">
              Per la sessione e per la tua sicurezza utilizziamo cookie e dati sul
              dispositivo.
              <br />
              <span className="cookie-banner__inline-links">
                Approfondisci: <Link to="/cookie">Cookie policy</Link>
                <span className="cookie-banner__sep" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
                <Link to="/privacy">Privacy</Link>.
              </span>
            </p>
            <p className="cookie-banner__p cookie-banner__p--hint">
              Cliccando su <span className="cookie-banner__action-label">Ho capito</span> confermi di aver
              preso visione.
            </p>
          </div>
          <div className="cookie-banner__actions">
            <Button type="button" variant="primary" onClick={accept} className="cookie-banner__btn">
              Ho capito
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
