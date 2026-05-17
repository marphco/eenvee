/**
 * Trust strip "Pagamento sicuro via Stripe" + loghi metodi accettati.
 *
 * Pattern usato come standard per tutti i form di pagamento Stripe del sito
 * (busta digitale, paywall eventi, marketing landing, payment widget editor).
 *
 * Prop `bg` indica il colore di sfondo SOTTO la strip:
 *   - `bg="light"` (default): sfondo chiaro → usa loghi COLORATI (visibili su bianco)
 *   - `bg="dark"`: sfondo scuro → usa loghi BIANCHI (`*-dark.svg`, visibili su nero)
 *
 * Per il PaymentWidget pubblico che dipende dalla palette adattiva della sezione,
 * passare `bg={palette.isDark ? 'dark' : 'light'}`.
 */
import React from 'react';
import visaLogo from '../../assets/visa.svg';
import visaDarkLogo from '../../assets/visa-dark.svg';
import mastercardLogo from '../../assets/mastercard.svg';
import amexLogo from '../../assets/amex.svg';
import applePayLogo from '../../assets/apple-pay.svg';
import applePayDarkLogo from '../../assets/apple-pay-dark.svg';
import googlePayLogo from '../../assets/google-pay.svg';
import googlePayDarkLogo from '../../assets/google-pay-dark.svg';
import sepaLogo from '../../assets/sepa.svg';
import sepaDarkLogo from '../../assets/sepa-dark.svg';
import stripeLogo from '../../assets/stripe.svg';
import stripeDarkLogo from '../../assets/stripe-dark.svg';

interface Props {
  /** Sfondo SOTTO la strip. Default 'light' (la maggior parte dei modal/form). */
  bg?: 'light' | 'dark';
  /** Override colore testo "Pagamento sicuro via" (default: dipende dal bg). */
  textColor?: string;
  /** Margine superiore rispetto al CTA che lo precede. Default 4px. */
  marginTop?: number | string;
}

const StripeTrustStrip: React.FC<Props> = ({
  bg = 'light',
  textColor,
  marginTop = 4,
}) => {
  // bg='dark' → sfondo scuro → loghi BIANCHI (`*-dark.svg` fill #FFFFFF).
  // bg='light' → sfondo chiaro → loghi COLORATI (`*.svg` con colori brand).
  const onDarkBg = bg === 'dark';
  const stripeSrc = onDarkBg ? stripeDarkLogo : stripeLogo;
  const visaSrc = onDarkBg ? visaDarkLogo : visaLogo;
  const applePaySrc = onDarkBg ? applePayDarkLogo : applePayLogo;
  const googlePaySrc = onDarkBg ? googlePayDarkLogo : googlePayLogo;
  const sepaSrc = onDarkBg ? sepaDarkLogo : sepaLogo;
  // Mastercard e Amex hanno loghi colorati ufficiali → unica variante per
  // entrambi i fondi (è il pattern già usato in DonationModal).
  const fallbackText = onDarkBg ? 'rgba(255,255,255,0.75)' : '#888';

  return (
    <div style={{
      fontSize: '10px',
      color: textColor || fallbackText,
      textAlign: 'center',
      letterSpacing: '0.02em',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      marginTop,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', opacity: 0.8 }}>
        <span style={{ fontSize: '10px' }}>Pagamento sicuro via</span>
        <img src={stripeSrc} alt="Stripe" style={{ height: '11px', width: 'auto', display: 'block' }} />
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        opacity: 0.5,
        flexWrap: 'wrap',
      }}>
        <img src={visaSrc} alt="Visa" style={{ height: '9px', width: 'auto', display: 'block' }} />
        <img src={mastercardLogo} alt="Mastercard" style={{ height: '13px', width: 'auto', display: 'block' }} />
        <img src={amexLogo} alt="Amex" style={{ height: '11px', width: 'auto', display: 'block' }} />
        <img src={applePaySrc} alt="Apple Pay" style={{ height: '12px', width: 'auto', display: 'block' }} />
        <img src={googlePaySrc} alt="Google Pay" style={{ height: '12px', width: 'auto', display: 'block' }} />
        <img src={sepaSrc} alt="SEPA" style={{ height: '9px', width: 'auto', display: 'block' }} />
      </div>
    </div>
  );
};

export default StripeTrustStrip;
