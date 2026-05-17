import React from 'react';
import { Plus, AlertTriangle, Zap, Pencil } from 'lucide-react';
import { Surface, Button } from '../../../../../../ui';
import GuestManualCard from '../cards/GuestManualCard';
import GuestRsvpCard from '../cards/GuestRsvpCard';
import type { CapacityWarning } from '../modals/CapacityWarningModal';
import type { ConstraintWarning } from '../modals/ConstraintWarningModal';

interface GuestsSectionProps {
  assignments: any[];
  tables: any[];
  eventRsvps: any[];
  config: any;
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  manualGuestName: string;
  setManualGuestName: React.Dispatch<React.SetStateAction<string>>;
  manualGuestCount: number;
  setManualGuestCount: React.Dispatch<React.SetStateAction<number>>;
  confirmDeleteManualId: string | null;
  setConfirmDeleteManualId: React.Dispatch<React.SetStateAction<string | null>>;
  setCapacityWarning: React.Dispatch<React.SetStateAction<CapacityWarning | null>>;
  setConstraintWarning: React.Dispatch<React.SetStateAction<ConstraintWarning | null>>;
  setShowPublishConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  totalConfirmedGuests: number;
  totalCapacity: number;
  missingSeats: number;
  patchConfig: (patch: any) => void;
  openOverflowModal: (deficit: number) => void;
  checkConstraintConflict: (guestIds: string[], tableId: string) => any;
}

const GuestsSection: React.FC<GuestsSectionProps> = ({
  assignments,
  tables,
  eventRsvps,
  config,
  expandedGroups,
  setExpandedGroups,
  manualGuestName,
  setManualGuestName,
  manualGuestCount,
  setManualGuestCount,
  confirmDeleteManualId,
  setConfirmDeleteManualId,
  setCapacityWarning,
  setConstraintWarning,
  setShowPublishConfirm,
  totalConfirmedGuests,
  totalCapacity,
  missingSeats,
  patchConfig,
  openOverflowModal,
  checkConstraintConflict,
}) => {
  const addManualGuest = () => {
    const guestId = `manual-${Date.now()}`;
    const names = Array.from({ length: manualGuestCount }, (_, i) => i === 0 ? manualGuestName : '');
    patchConfig({ tableauAssignments: [...assignments, { guestId, guestName: manualGuestName, numPeople: manualGuestCount, names, tableId: '' }] });
    const projectedTotal = totalConfirmedGuests + manualGuestCount;
    if (projectedTotal > totalCapacity) openOverflowModal(projectedTotal - totalCapacity);
    setManualGuestName(''); setManualGuestCount(1);
  };

  return (
    <>
      {/* MANUAL GUEST ADD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Aggiungi ospite / gruppo extra
        </label>
        {/* Wrapper con icona Pencil per chiarire che è un campo compilabile.
            Bug precedente: input bianco su sfondo bianco senza icona — l'utente
            non capiva che doveva digitare il nome lì dentro. */}
        <div
          onClick={() => (document.getElementById('manual-guest-input') as HTMLInputElement | null)?.focus()}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', minWidth: 0, boxSizing: 'border-box',
            background: 'var(--surface, #f6f7fb)',
            border: '1.5px solid var(--accent-soft, rgba(0,0,0,0.18))',
            borderRadius: '12px', padding: '12px 14px',
            cursor: 'text',
            transition: 'border-color .15s ease, background .15s ease',
          }}
        >
          <Pencil size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <input
            id="manual-guest-input"
            placeholder="Scrivi il nome dell'ospite o del gruppo…"
            value={manualGuestName}
            onChange={(e) => setManualGuestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualGuestName.trim()) addManualGuest();
            }}
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none',
              background: 'transparent', fontSize: '13px', fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          {/* Contatore persone */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <button
              onClick={() => setManualGuestCount(c => Math.max(1, c - 1))}
              style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >−</button>
            <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{manualGuestCount}</span>
            <button
              onClick={() => setManualGuestCount(c => c + 1)}
              style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >+</button>
          </div>
          <Button
            variant="subtle"
            disabled={!manualGuestName.trim()}
            onClick={addManualGuest}
            style={{ flex: 1, minWidth: 0, padding: '0 14px', borderRadius: '12px', height: '40px', justifyContent: 'center', gap: '6px' }}
          >
            <Plus size={16} /> <span style={{ fontSize: '12px', fontWeight: 800 }}>Aggiungi</span>
          </Button>
        </div>
        {manualGuestCount > 1 && (
          <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, paddingLeft: '4px' }}>
            Gruppo di {manualGuestCount} persone — l'ottimizzazione li terrà insieme
          </div>
        )}
      </div>

      {/* MANUAL GUESTS LIST */}
      {assignments.filter(a => a.guestId.startsWith('manual-')).map((assignment: any) => {
        const numPeople = assignment.numPeople || 1;
        const isAssigned = !!assignment.tableId;
        const isConfirmingDelete = confirmDeleteManualId === assignment.guestId;
        const isExpanded = expandedGroups.includes(assignment.guestId);
        const namesArr: string[] = (assignment.names && Array.isArray(assignment.names) && assignment.names.length > 0)
          ? assignment.names
          : Array.from({ length: numPeople }, (_, i) => i === 0 ? (assignment.guestName || '') : '');
        const toggleManualGroup = () => {
          setExpandedGroups(prev => prev.includes(assignment.guestId) ? prev.filter(id => id !== assignment.guestId) : [...prev, assignment.guestId]);
        };
        const updateNumPeople = (delta: number) => {
          const newCount = Math.max(1, numPeople + delta);
          const newNames = [...namesArr];
          while (newNames.length < newCount) newNames.push('');
          while (newNames.length > newCount) newNames.pop();
          const next = assignments.map(a => a.guestId === assignment.guestId
            ? { ...a, numPeople: newCount, names: newNames, guestName: newNames[0] || assignment.guestName }
            : a);
          patchConfig({ tableauAssignments: next });
        };
        const updateName = (idx: number, value: string) => {
          const newNames = [...namesArr];
          newNames[idx] = value;
          const next = assignments.map(a => a.guestId === assignment.guestId
            ? { ...a, names: newNames, guestName: newNames[0] || a.guestName }
            : a);
          patchConfig({ tableauAssignments: next });
        };
        return (
          <GuestManualCard
            key={assignment.guestId}
            assignment={assignment}
            numPeople={numPeople}
            isAssigned={isAssigned}
            isConfirmingDelete={isConfirmingDelete}
            isExpanded={isExpanded}
            namesArr={namesArr}
            tables={tables}
            assignments={assignments}
            onToggle={toggleManualGroup}
            onUpdateNumPeople={updateNumPeople}
            onUpdateName={updateName}
            onAssignTable={(tableId) => {
              const next = assignments.map(a => a.guestId === assignment.guestId ? { ...a, tableId } : a);
              patchConfig({ tableauAssignments: next });
            }}
            onRequestDelete={() => setConfirmDeleteManualId(assignment.guestId)}
            onConfirmDelete={() => {
              const next = assignments.filter(a => a.guestId !== assignment.guestId);
              patchConfig({ tableauAssignments: next });
              setConfirmDeleteManualId(null);
            }}
          />
        );
      })}

      {/* RIEPILOGO */}
      <div style={{
        padding: '12px 16px', background: 'rgba(var(--accent-rgb), 0.08)', borderRadius: '14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
        border: '1px solid rgba(var(--accent-rgb), 0.15)'
      }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '2px' }}>Riepilogo Posti</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Ospiti confermati</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
            {assignments.filter((a: any) => a.tableId).reduce((acc, a) => acc + (a.numPeople || 1), 0)}
            <span style={{ fontSize: '13px', opacity: 0.3, margin: '0 4px', fontWeight: 400 }}>/</span>
            <span style={{ opacity: 0.5 }}>{totalConfirmedGuests}</span>
          </div>
          <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', marginTop: '2px' }}>Assegnati</div>
        </div>
      </div>

      {/* Alert overflow inline */}
      {missingSeats > 0 && (
        <div style={{
          marginTop: '-8px', marginBottom: '16px',
          padding: '12px 14px', borderRadius: '14px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1.5px solid rgba(239, 68, 68, 0.22)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <AlertTriangle size={16} color="#ef4444" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
              Posti insufficienti
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              Mancano {missingSeats} {missingSeats === 1 ? 'posto' : 'posti'} per tutti gli ospiti.
            </div>
          </div>
          <button
            onClick={() => openOverflowModal(missingSeats)}
            style={{
              background: '#ef4444', color: '#fff', border: 'none',
              padding: '8px 14px', borderRadius: '100px', cursor: 'pointer',
              fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
              whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
            }}
          >
            Risolvi
          </button>
        </div>
      )}

      {/* RSVP GUESTS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {eventRsvps.filter(r => r.status === 'yes').map((rsvp: any) => {
          const rsvpId = rsvp._id || rsvp.id;
          const isExpanded = expandedGroups.includes(rsvpId);

          // Genera la lista degli ospiti basandosi su guestsCount (totale persone)
          let rsvpGuests: any[] = [];
          const totalCount = rsvp.guestsCount || 1;

          if (rsvp.guests && rsvp.guests.length > 0) {
            rsvpGuests = rsvp.guests;
          } else if (rsvp.allergiesDetail?.people && rsvp.allergiesDetail.people.length > 0) {
            rsvpGuests = rsvp.allergiesDetail.people;
          }

          if (rsvpGuests.length === 0) {
            rsvpGuests.push({ name: rsvp.name });
          }

          const currentNamesCount = rsvpGuests.length;
          if (currentNamesCount < totalCount) {
            for (let i = currentNamesCount; i < totalCount; i++) {
              rsvpGuests.push({ name: `Ospite ${i + 1}` });
            }
          } else if (currentNamesCount > totalCount && totalCount > 0) {
            rsvpGuests = rsvpGuests.slice(0, totalCount);
          }

          // Bulk assignment logic
          const groupAssignments = rsvpGuests.map((_, idx) => assignments.find(a => a.guestId === `${rsvpId}-${idx}`));
          const firstTableId = groupAssignments[0]?.tableId || '';
          const isUniform = groupAssignments.every(a => (a?.tableId || '') === firstTableId);
          const bulkTableId = isUniform ? firstTableId : 'multiple';

          const toggleGroup = () => {
            setExpandedGroups(prev => prev.includes(rsvpId) ? prev.filter(id => id !== rsvpId) : [...prev, rsvpId]);
          };

          const bulkAssign = (tableId: string) => {
            if (!tableId) {
              let next = assignments.filter(a => !rsvpGuests.some((_, i) => a.guestId === `${rsvpId}-${i}`));
              patchConfig({ tableauAssignments: next });
              return;
            }

            const table = tables.find((t: any) => t.id === tableId);
            const tableIndex = tables.findIndex((t: any) => t.id === tableId);
            const incomingCount = rsvpGuests.length;

            const execute = (idsToCommit?: string[]) => {
              let next = [...assignments];
              rsvpGuests.forEach((g, idx) => {
                const gid = `${rsvpId}-${idx}`;
                if (idsToCommit && !idsToCommit.includes(gid)) return;
                const current = next.find(a => a.guestId === gid);
                next = next.filter(a => a.guestId !== gid);
                next.push({ guestId: gid, tableId, guestName: current?.guestName || g.name });
              });
              patchConfig({ tableauAssignments: next });
              setCapacityWarning(null);
              setConstraintWarning(null);
            };

            const proceed = () => {
              const currentOccupancy = assignments.filter(a => a.tableId === tableId).reduce((acc, a) => acc + (a.numPeople || 1), 0);
              if (table && currentOccupancy + incomingCount > table.capacity) {
                setCapacityWarning({
                  tableId, tableIndex, guestCount: incomingCount, capacity: table.capacity,
                  incomingGuests: rsvpGuests.map((g: any, idx: number) => ({ id: `${rsvpId}-${idx}`, name: g.name })),
                  snapshotAssignments: [...assignments],
                  onConfirm: execute,
                  onRedirect: (newTableId: string) => { setCapacityWarning(null); bulkAssign(newTableId); }
                });
              } else {
                execute();
              }
            };

            const guestIds = rsvpGuests.map((_: any, i: number) => `${rsvpId}-${i}`);
            const conflict = checkConstraintConflict(guestIds, tableId);
            if (conflict) {
              setConstraintWarning({ ...conflict, onConfirm: proceed });
            } else {
              proceed();
            }
          };

          const handleSingleAssign = (guestId: string, displayName: string, tableId: string) => {
            if (!tableId) {
              patchConfig({ tableauAssignments: assignments.filter(a => a.guestId !== guestId) });
              return;
            }

            const table = tables.find((t: any) => t.id === tableId);
            const tableIndex = tables.findIndex((t: any) => t.id === tableId);

            const execute = (idsToCommit?: string[]) => {
              if (idsToCommit && !idsToCommit.includes(guestId)) {
                setCapacityWarning(null);
                setConstraintWarning(null);
                return;
              }
              let nextAssignments = assignments.filter((a: any) => a.guestId !== guestId);
              nextAssignments.push({ guestId, tableId, guestName: displayName });
              patchConfig({ tableauAssignments: nextAssignments });
              setCapacityWarning(null);
              setConstraintWarning(null);
            };

            const proceed = () => {
              const currentOccupancy = assignments.filter(a => a.tableId === tableId).reduce((acc, a) => acc + (a.numPeople || 1), 0);
              if (table && currentOccupancy + 1 > table.capacity) {
                setCapacityWarning({
                  tableId, tableIndex, guestCount: 1, capacity: table.capacity,
                  incomingGuests: [{ id: guestId, name: displayName }],
                  snapshotAssignments: [...assignments],
                  onConfirm: execute,
                  onRedirect: (newTableId: string) => { setCapacityWarning(null); handleSingleAssign(guestId, displayName, newTableId); }
                });
              } else {
                execute();
              }
            };

            const conflict = checkConstraintConflict([guestId], tableId);
            if (conflict) {
              setConstraintWarning({ ...conflict, onConfirm: proceed });
            } else {
              proceed();
            }
          };

          return (
            <GuestRsvpCard
              key={rsvpId}
              rsvp={rsvp}
              rsvpId={rsvpId}
              rsvpGuests={rsvpGuests}
              isExpanded={isExpanded}
              groupAssignments={groupAssignments}
              bulkTableId={bulkTableId}
              tables={tables}
              assignments={assignments}
              onToggle={toggleGroup}
              onBulkAssign={bulkAssign}
              onSingleAssign={handleSingleAssign}
            />
          );
        })}

        {eventRsvps.filter(r => r.status === 'yes').length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 20px', opacity: 0.5, fontSize: '12px', background: 'var(--surface-light)', borderRadius: '12px', border: '1px dotted var(--border)' }}>
            Nessun ospite confermato trovato.
          </div>
        )}
      </div>

      {/* FOOTER DI PUBBLICAZIONE */}
      <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1.5px solid var(--border)' }}>
        <Surface variant="soft" style={{
          padding: '24px',
          borderRadius: '24px',
          border: '1.5px solid var(--border)',
          background: 'rgba(var(--accent-rgb), 0.03)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 8px 20px rgba(var(--accent-rgb), 0.2)'
          }}>
            <Zap size={20} color="#fff" />
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pubblicazione
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--text-soft)', lineHeight: 1.5, marginBottom: '20px' }}>
            Salva le assegnazioni finali e rendi il tableau visibile ai tuoi ospiti nella pagina dell'evento.
          </p>

          <Button
            variant="accent"
            fullWidth
            onClick={() => {
              const totalAssigned = assignments.filter((a: any) => a.tableId).reduce((acc, a) => acc + (a.numPeople || 1), 0);

              if (totalAssigned < totalConfirmedGuests) {
                setShowPublishConfirm(true);
              } else {
                patchConfig({ tableauIsPublished: !config.tableauIsPublished });
              }
            }}
            style={{ height: '48px', borderRadius: '100px', fontWeight: 800, fontSize: '13px' }}
          >
            Pubblica Tableau
          </Button>
        </Surface>
      </div>
    </>
  );
};

export default GuestsSection;
