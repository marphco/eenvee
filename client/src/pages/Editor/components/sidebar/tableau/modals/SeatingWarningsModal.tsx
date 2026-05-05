import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Surface, Button } from '../../../../../../ui';
import type { SplitWarning } from '../../../../../../utils/seatingEngine';

interface SeatingWarningsModalProps {
  warnings: SplitWarning[];
  onClose: () => void;
  assignments: any[];
  tables: any[];
  patchConfig: (patch: any) => void;
}

const SeatingWarningsModal: React.FC<SeatingWarningsModalProps> = ({
  warnings,
  onClose,
  assignments,
  tables,
  patchConfig,
}) => {
  if (warnings.length === 0) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <Surface variant="soft" style={{
        maxWidth: '480px', width: '100%', borderRadius: '32px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.4)',
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px', background: '#fffbeb',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            border: '1.5px solid #ffe699'
          }}>
            <AlertTriangle size={32} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
            Assegnazione incompleta
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
            L'algoritmo non ha potuto rispettare tutte le preferenze. Rivedi e correggi le assegnazioni qui sotto.
          </p>
        </div>

        {/* Body — scrollabile */}
        <div style={{ overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {warnings.map((w, wi) => (
            <div key={wi}>
              <div style={{
                fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: w.type === 'group_split' ? '#f59e0b' : '#ef4444', marginBottom: '10px'
              }}>
                {w.type === 'group_split' ? 'Gruppo separato' : 'Vincolo irrisolvibile'}
              </div>
              <div style={{
                padding: '12px 14px', borderRadius: '14px',
                background: w.type === 'group_split' ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)',
                border: w.type === 'group_split' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(239,68,68,0.15)',
                marginBottom: '10px', fontSize: '12px', color: 'var(--text-soft)', lineHeight: 1.5
              }}>
                {w.reason}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {w.groupGuests.map(guest => {
                  const currentAssignment = assignments.find((a: any) => a.guestId === guest.id);
                  return (
                    <div key={guest.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', background: 'var(--surface-light)',
                      borderRadius: '12px', border: '1px solid var(--border)'
                    }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: currentAssignment?.tableId ? 'var(--accent)' : '#f59e0b',
                        boxShadow: currentAssignment?.tableId ? '0 0 8px rgba(var(--accent-rgb),0.4)' : '0 0 8px rgba(245,158,11,0.4)'
                      }} />
                      <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{guest.name}</span>
                      <select
                        value={currentAssignment?.tableId || ''}
                        onChange={(e) => {
                          const tableId = e.target.value;
                          let next = assignments.filter((a: any) => a.guestId !== guest.id);
                          if (tableId) next = [...next, { guestId: guest.id, tableId, guestName: guest.name }];
                          patchConfig({ tableauAssignments: next });
                        }}
                        style={{
                          fontSize: '11px', padding: '5px 8px', borderRadius: '8px',
                          border: '1.5px solid var(--border)', background: '#fff',
                          color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
                          maxWidth: '140px'
                        }}
                      >
                        <option value="">Non assegnato</option>
                        {tables.map((t: any) => {
                          const occ = assignments.filter((a: any) => a.tableId === t.id).length;
                          return <option key={t.id} value={t.id}>{t.name} ({occ}/{t.capacity})</option>;
                        })}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)' }}>
          <Button
            variant="accent"
            fullWidth
            onClick={onClose}
            style={{ height: '48px', borderRadius: '100px', fontWeight: 800, fontSize: '13px' }}
          >
            Fatto, chiudi
          </Button>
        </div>
      </Surface>
    </div>,
    document.body
  );
};

export default SeatingWarningsModal;
