import React, { useEffect, useMemo, useState } from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectComponentsProvider } from '@stripe/react-connect-js';
import { apiFetch } from '../../../../utils/apiFetch';

const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || '';

interface StripeConnectProviderProps {
  children: React.ReactNode;
  /** Chiamato quando l'onboarding è completato (o chiuso dall'utente) per forzare refresh status. */
  onReady?: () => void;
}

const StripeConnectProvider: React.FC<StripeConnectProviderProps> = ({ children }) => {
  const [connectInstance, setConnectInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useMemo(() => async () => {
    const res = await apiFetch('/api/stripe/connect/account-session', { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Impossibile inizializzare Stripe');
    }
    const data = await res.json();
    return data.clientSecret as string;
  }, []);

  useEffect(() => {
    if (!STRIPE_PUBLISHABLE_KEY) {
      setError('Stripe non configurato: VITE_STRIPE_PUBLISHABLE_KEY mancante.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const instance = await loadConnectAndInitialize({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          fetchClientSecret,
          locale: 'it-IT',
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#1ABC9C',
              colorBackground: '#ffffff',
              colorText: '#1a1a1a',
              colorSecondaryText: '#666666',
              colorBorder: '#e5e5e5',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontSizeBase: '14px',
              borderRadius: '12px',
              buttonPrimaryColorBackground: '#1ABC9C',
              buttonPrimaryColorText: '#ffffff',
              buttonPrimaryColorBorder: '#1ABC9C',
              buttonSecondaryColorBackground: '#ffffff',
              buttonSecondaryColorText: '#1a1a1a',
              buttonSecondaryColorBorder: '#dddddd',
              badgeSuccessColorBackground: '#e8f8f3',
              badgeSuccessColorText: '#1ABC9C',
              badgeSuccessColorBorder: '#c9ecdf',
            },
          },
        });
        if (!cancelled) setConnectInstance(instance);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchClientSecret]);

  if (error) {
    return (
      <div style={{ padding: '16px', borderRadius: '10px', background: '#fdecea', color: '#c0392b', fontSize: '13px' }}>
        {error}
      </div>
    );
  }

  if (!connectInstance) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-soft)', fontSize: '13px' }}>
        Caricamento Stripe…
      </div>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={connectInstance}>
      {children}
    </ConnectComponentsProvider>
  );
};

export default StripeConnectProvider;
