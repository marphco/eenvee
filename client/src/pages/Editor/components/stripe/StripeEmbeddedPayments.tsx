import React from 'react';
import { ConnectPayments } from '@stripe/react-connect-js';
import StripeConnectProvider from './StripeConnectProvider';

/**
 * Tabella Stripe nativa con le donazioni ricevute: supporta filtri, dettaglio PI,
 * refund, dispute management — tutto dentro eenvee senza mandare l'host su Stripe.
 */
const StripeEmbeddedPayments: React.FC = () => {
  return (
    <StripeConnectProvider>
      <ConnectPayments />
    </StripeConnectProvider>
  );
};

export default StripeEmbeddedPayments;
