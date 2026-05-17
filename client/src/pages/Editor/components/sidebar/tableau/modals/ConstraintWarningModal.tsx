import React from 'react';
import { createPortal } from 'react-dom';
import { Heart, HeartOff } from 'lucide-react';
import { Surface, Button } from '../../../../../../ui';

export interface ConstraintWarning {
  type: 'avoid' | 'together';
  guestName: string;
  otherGuestName: string;
  otherTableName?: string;
  onConfirm: () => void;
}

interface ConstraintWarningModalProps {
  warning: ConstraintWarning | null;
  onClose: () => void;
}

const ConstraintWarningModal: React.FC<ConstraintWarningModalProps> = ({ warning, onClose }) => {
  if (!warning) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100002,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    }}>
      <Surface variant="soft" style={{
        maxWidth: '420px', width: '100%', padding: '36px 32px', borderRadius: '32px',
        textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.4)',
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '90dvh', overflowY: 'auto', boxSizing: 'border-box',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: warning.type === 'avoid' ? 'rgba(239,68,68,0.08)' : 'rgba(var(--accent-rgb),0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          border: warning.type === 'avoid' ? '1.5px solid rgba(239,68,68,0.2)' : '1.5px solid rgba(var(--accent-rgb),0.2)'
        }}>
          {warning.type === 'avoid'
            ? <HeartOff size={30} color="#ef4444" />
            : <Heart size={30} color="var(--accent)" fill="var(--accent)" />
          }
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
          {warning.type === 'avoid' ? 'Vincolo di separazione' : 'Vincolo di vicinanza'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-soft)', lineHeight: 1.7, marginBottom: '28px' }}>
          {warning.type === 'avoid'
            ? <><strong>{warning.guestName}</strong> e <strong>{warning.otherGuestName}</strong> hanno un vincolo <em>Separati</em> ma finirebbero allo stesso tavolo.</>
            : <><strong>{warning.guestName}</strong> ha un vincolo <em>Insieme</em> con <strong>{warning.otherGuestName}</strong>, che si trova già al <strong>{warning.otherTableName}</strong>.</>
          }
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button variant="accent" fullWidth onClick={() => { warning.onConfirm(); onClose(); }}
            style={{ height: '48px', borderRadius: '100px', fontWeight: 800 }}>
            Procedi comunque
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}
            style={{ height: '48px', borderRadius: '100px', color: 'var(--text-soft)', fontWeight: 700 }}>
            Annulla
          </Button>
        </div>
      </Surface>
    </div>,
    document.body
  );
};

export default ConstraintWarningModal;
