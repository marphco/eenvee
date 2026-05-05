import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Surface, Button } from '../../../../../../ui';

interface PublishConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({ show, onClose, onConfirm }) => {
  if (!show) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <Surface variant="soft" style={{
        maxWidth: '440px', width: '100%', padding: '48px 40px', borderRadius: '32px',
        textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.4)',
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '24px', background: '#fffbeb',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
          border: '1.5px solid #ffe699'
        }}>
          <AlertTriangle size={40} color="#f59e0b" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Ospiti non assegnati</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: '32px' }}>
          Ci sono ancora degli ospiti che non hanno un tavolo assegnato. Vuoi pubblicare comunque o preferisci finire di sistemarli?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            variant="accent"
            fullWidth
            onClick={onConfirm}
            style={{ height: '52px', borderRadius: '100px', fontWeight: 800 }}
          >
            Sì, pubblica comunque
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={onClose}
            style={{ height: '52px', borderRadius: '100px', color: 'var(--text-primary)', fontWeight: 700 }}
          >
            No, fammi finire
          </Button>
        </div>
      </Surface>
    </div>,
    document.body
  );
};

export default PublishConfirmModal;
