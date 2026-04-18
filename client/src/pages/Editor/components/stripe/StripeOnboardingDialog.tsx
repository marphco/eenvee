import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import StripeEmbeddedOnboarding from './StripeEmbeddedOnboarding';
import PrefillWizard from './PrefillWizard';
import { apiFetch } from '../../../../utils/apiFetch';

interface StripeOnboardingDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
  /** Se true, salta il wizard interno e va direttamente a Stripe (utile se l'utente torna per completare documento). */
  skipPrefill?: boolean;
  /** Slug evento: usato da Stripe per pre-popolare business_profile.url. */
  eventSlug?: string;
  /** gift | donation — condiziona l'MCC Stripe. */
  paymentMode?: 'gift' | 'donation';
}

type Phase = 'wizard' | 'stripe';

const StripeOnboardingDialog: React.FC<StripeOnboardingDialogProps> = ({ open, onClose, onComplete, skipPrefill = false, eventSlug, paymentMode }) => {
  const [phase, setPhase] = useState<Phase>(skipPrefill ? 'stripe' : 'wizard');
  // Incrementato a ogni onExit di Stripe embedded per forzare il remount del
  // componente: Stripe emette onExit dopo la conferma di OGNI step principale
  // (es. "Verifica dati personali" → onExit → prossimo step "Verifica del
  // rappresentante"). Senza remount il componente resta "vuoto" e sembra che
  // la modal si sia chiusa; con remount + stesso account Stripe riprende da
  // dove aveva interrotto in un flusso unico.
  const [embeddedKey, setEmbeddedKey] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (open) {
      setPhase(skipPrefill ? 'stripe' : 'wizard');
      setEmbeddedKey(0);
    }
  }, [open, skipPrefill]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleWizardComplete = () => {
    setPhase('stripe');
  };

  // Chiamato quando Stripe embedded dichiara "exit" (fine di uno step o
  // dell'intero flusso). Controlliamo lo status server-side: se l'account è
  // effettivamente attivo chiudiamo la modal, altrimenti rimontiamo Stripe
  // embedded per proseguire con il prossimo step richiesto — senza forzare
  // l'utente a riaprire manualmente il dialog.
  const handleStripeExit = async () => {
    setCheckingStatus(true);
    try {
      const res = await apiFetch('/api/stripe/connect/status');
      const data = await res.json().catch(() => ({} as any));
      onComplete?.();
      if (data?.chargesEnabled) {
        onClose();
        return;
      }
      setEmbeddedKey((k) => k + 1);
    } catch {
      setEmbeddedKey((k) => k + 1);
    } finally {
      setCheckingStatus(false);
    }
  };

  const headerSubtitle = phase === 'wizard'
    ? 'Ti guidiamo passo per passo. Richiede circa 2 minuti.'
    : 'Ultimo passaggio: carica un documento e accetta i termini Stripe.';

  // Portal al document.body per evitare che il `position: fixed` del modal
  // venga ancorato a un antenato con `transform` (es. il .mobile-tab-panel
  // animato con translateY). Senza portal, su mobile il dialog finisce
  // dentro il pannello compatto ed è visivamente invisibile.
  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(10, 10, 15, 0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '92vh',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid #eaeaea',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {phase === 'stripe' && !skipPrefill && (
              <button
                type="button"
                aria-label="Torna ai dati"
                onClick={() => setPhase('wizard')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                title="Torna indietro"
              >
                <ArrowLeft size={18} color="#555" />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>
                Attiva i regali digitali
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                {headerSubtitle}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex' }}
          >
            <X size={22} color="#555" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
          {phase === 'wizard' ? (
            <PrefillWizard
              onComplete={handleWizardComplete}
              onCancel={onClose}
              eventSlug={eventSlug}
              paymentMode={paymentMode}
            />
          ) : checkingStatus ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
              Verifica stato account…
            </div>
          ) : (
            <StripeEmbeddedOnboarding key={embeddedKey} onExit={handleStripeExit} />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default StripeOnboardingDialog;
