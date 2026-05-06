import React from 'react';
import { ChevronUp, ChevronDown, Trash2, UserPlus, Plus, Minus } from 'lucide-react';
import { Surface } from '../../../../../../ui';
import CustomTableSelect from '../shared/CustomTableSelect';

interface GuestManualCardProps {
  assignment: any;
  numPeople: number;
  isAssigned: boolean;
  isConfirmingDelete: boolean;
  isExpanded: boolean;
  namesArr: string[];
  tables: any[];
  assignments: any[];
  onToggle: () => void;
  onUpdateNumPeople: (delta: number) => void;
  onUpdateName: (idx: number, value: string) => void;
  onAssignTable: (tableId: string) => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
}

const GuestManualCard: React.FC<GuestManualCardProps> = ({
  assignment,
  numPeople,
  isAssigned,
  isConfirmingDelete,
  isExpanded,
  namesArr,
  tables,
  assignments,
  onToggle,
  onUpdateNumPeople,
  onUpdateName,
  onAssignTable,
  onRequestDelete,
  onConfirmDelete,
}) => {
  return (
    <Surface variant="soft" style={{
      padding: '12px',
      borderRadius: '16px',
      border: isExpanded ? '1.5px solid var(--accent)' : '1px solid var(--border)',
      background: isExpanded ? 'rgba(var(--accent-rgb), 0.02)' : 'var(--surface)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Top row: badge "AGGIUNTO MANUALMENTE" + cestino con doppio check */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '100px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <UserPlus size={11} color="#d97706" strokeWidth={2.5} />
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Aggiunto Manualmente
            </span>
          </div>
          {isConfirmingDelete ? (
            <button
              onClick={onConfirmDelete}
              style={{
                background: '#fee2e2', border: 'none', borderRadius: '10px',
                padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.15)'
              }}
            >
              <Trash2 size={12} color="#ef4444" strokeWidth={2.5} />
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sicuro?</span>
            </button>
          ) : (
            <button
              onClick={onRequestDelete}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                width: '28px', height: '28px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.6, flexShrink: 0
              }}
              title="Elimina"
            >
              <Trash2 size={14} color="#ef4444" />
            </button>
          )}
        </div>

        {/* HEADER — identico a card RSVP: chevron + nome + meta cliccabile */}
        <div
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: isExpanded ? 'var(--accent)' : 'rgba(var(--accent-rgb), 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}>
            {isExpanded ? <ChevronUp size={16} color="#fff" /> : <ChevronDown size={16} color="var(--accent)" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {assignment.guestName || 'Senza nome'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-soft)' }}>
                {numPeople} {numPeople === 1 ? 'Persona' : 'Persone'}
              </div>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--border)', opacity: 0.5 }} />
              <div style={{
                fontSize: '9px',
                fontWeight: 800,
                color: isAssigned ? 'var(--accent)' : '#f59e0b',
                textTransform: 'uppercase'
              }}>
                {isAssigned ? `${numPeople}/${numPeople} Assegnati` : `0/${numPeople} Assegnati`}
              </div>
            </div>
          </div>
        </div>

        {/* COLLAPSED — bulk select identico a RSVP */}
        {!isExpanded && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>Assegna intero gruppo</label>
            <CustomTableSelect
              value={assignment.tableId || ''}
              tables={tables}
              assignments={assignments}
              onChange={onAssignTable}
              isBulk
            />
          </div>
        )}

        {/* EXPANDED — counter + nomi individuali + bulk select */}
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>
                Numero persone
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--surface-light)', border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden', height: '32px' }}>
                <button
                  onClick={() => onUpdateNumPeople(-1)}
                  disabled={numPeople <= 1}
                  style={{
                    width: '32px', height: '100%', border: 'none', background: 'none',
                    cursor: numPeople <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: numPeople <= 1 ? 0.3 : 1
                  }}
                >
                  <Minus size={13} color="var(--text-soft)" strokeWidth={2.5} />
                </button>
                <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {numPeople}
                </span>
                <button
                  onClick={() => onUpdateNumPeople(1)}
                  style={{
                    width: '32px', height: '100%', border: 'none', background: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Plus size={13} color="var(--accent)" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>
                Nomi ospiti
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {namesArr.map((name, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'var(--surface-light)', border: '1px solid var(--border-subtle)',
                    borderRadius: '10px', padding: '6px 10px'
                  }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)', minWidth: '14px' }}>
                      {idx + 1}.
                    </span>
                    <input
                      value={name}
                      onChange={e => onUpdateName(idx, e.target.value)}
                      placeholder={`Ospite ${idx + 1}`}
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)',
                        minWidth: 0
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>Assegna intero gruppo</label>
              <CustomTableSelect
                value={assignment.tableId || ''}
                tables={tables}
                assignments={assignments}
                onChange={onAssignTable}
                isBulk
              />
            </div>
          </div>
        )}
      </div>
    </Surface>
  );
};

export default GuestManualCard;
