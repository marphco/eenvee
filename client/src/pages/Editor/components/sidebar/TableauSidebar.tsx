import React, { useState, useEffect } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Surface, Button } from "../../../../ui";
import type { Block, EventData } from "../../../../types/editor";
import { optimizeSeating } from "../../../../utils/seatingEngine";
import type { SplitWarning } from "../../../../utils/seatingEngine";
import EventPurchaseModal from "../../../../components/payments/EventPurchaseModal";
import { useTableauTotals } from './tableau/hooks/useTableauTotals';
import OverflowModal from './tableau/modals/OverflowModal';
import PublishConfirmModal from './tableau/modals/PublishConfirmModal';
import SeatingWarningsModal from './tableau/modals/SeatingWarningsModal';
import ConstraintWarningModal from './tableau/modals/ConstraintWarningModal';
import CapacityWarningModal from './tableau/modals/CapacityWarningModal';
import TablesSection from './tableau/sections/TablesSection';
import RulesSection from './tableau/sections/RulesSection';
import GuestsSection from './tableau/sections/GuestsSection';
import MetadataSection from './tableau/sections/MetadataSection';
import TableauHeader from './tableau/sections/TableauHeader';

export type TableauSection = 'tables' | 'guests' | 'rules' | 'style' | 'publish' | 'paywall';

interface TableauSidebarProps {
  selectedBlock: Block;
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void;
  eventRsvps: any[];
  hasTableauAccess?: boolean | undefined;
  slug?: string | undefined;
  eventTitle?: string | undefined;
  updateEventData?: ((updates: Partial<EventData>, pushToHistory?: () => void) => void) | undefined;
  event?: EventData | null | undefined;
  /** Modalità "compact" (mobile): salta header/paywall/tabs, mostra solo la section richiesta. */
  compact?: boolean | undefined;
  /** In modalità compact, quale section renderizzare. Ignorato in desktop. */
  section?: TableauSection | undefined;
}

const TableauSidebar: React.FC<TableauSidebarProps> = ({
  selectedBlock,
  onUpdateBlock,
  eventRsvps,
  hasTableauAccess = false,
  slug,
  eventTitle = "Evento",
  updateEventData,
  event,
  compact = false,
  section,
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'guests'>('tables');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [guestA, setGuestA] = useState('');
  const [guestB, setGuestB] = useState('');
  const [manualGuestName, setManualGuestName] = useState('');
  const [manualGuestCount, setManualGuestCount] = useState(1);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [confirmDeleteTableId, setConfirmDeleteTableId] = useState<string | null>(null);
  const [seatingWarnings, setSeatingWarnings] = useState<SplitWarning[]>([]);

  useEffect(() => {
    if (confirmDeleteTableId) {
      const timer = setTimeout(() => {
        setConfirmDeleteTableId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteTableId]);

  const [displayColorPicker, setDisplayColorPicker] = useState<boolean | string>(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [capacityWarning, setCapacityWarning] = useState<{
    tableId: string;
    tableIndex: number;
    guestCount: number;
    capacity: number;
    incomingGuests: { id: string; name: string }[];
    snapshotAssignments: any[];
    onConfirm: (idsToCommit?: string[]) => void;
    onRedirect: (newTableId: string) => void;
  } | null>(null);
  const [constraintWarning, setConstraintWarning] = useState<{
    type: 'avoid' | 'together';
    guestName: string;
    otherGuestName: string;
    otherTableName?: string;
    onConfirm: () => void;
  } | null>(null);
  // Tracking sessione modale: ospiti "in arrivo" che l'utente ha già riassegnato esplicitamente in questo modale
  const [modalHandledIds, setModalHandledIds] = useState<string[]>([]);
  const [confirmDeleteManualId, setConfirmDeleteManualId] = useState<string | null>(null);
  const [confirmResetAssignments, setConfirmResetAssignments] = useState(false);
  // Modale overflow ospiti > posti
  const [showOverflowModal, setShowOverflowModal] = useState(false);
  const [newTableNameInput, setNewTableNameInput] = useState('');
  const [newTableCapacityInput, setNewTableCapacityInput] = useState(10);

  // Reset del tracking ogni volta che il modale apre/cambia contesto
  useEffect(() => {
    setModalHandledIds([]);
  }, [capacityWarning]);

  // Auto-reset double-check elimina ospite manuale
  useEffect(() => {
    if (confirmDeleteManualId) {
      const t = setTimeout(() => setConfirmDeleteManualId(null), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmDeleteManualId]);

  // Auto-reset double-check azzera assegnazioni
  useEffect(() => {
    if (confirmResetAssignments) {
      const t = setTimeout(() => setConfirmResetAssignments(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmResetAssignments]);

  const config = selectedBlock.widgetProps || {};
  const tables = config.tableauTables || [];
  const assignments = (config.tableauAssignments || []) as any[];
  const constraints = config.tableauConstraints || [];

  const {
    allGuests,
    totalRsvpGuests,
    totalManualGuests,
    totalConfirmedGuests,
    totalCapacity,
    missingSeats,
    spareSeats,
  } = useTableauTotals(eventRsvps, assignments, tables);

  // Helper: apre il modale overflow con valori suggeriti, dato un missing calcolato (anche proiettato)
  const openOverflowModal = (missing: number) => {
    if (missing <= 0) return;
    setShowOverflowModal(true);
    setNewTableNameInput(`Tavolo ${tables.length + 1}`);
    setNewTableCapacityInput(Math.max(2, missing));
  };

  const closeOverflowModal = () => {
    setShowOverflowModal(false);
  };

  const patchConfig = (patch: any) => {
    if (!hasTableauAccess) return;
    onUpdateBlock(selectedBlock.id!, {
      widgetProps: { ...config, ...patch }
    });
  };

  // Normalizza i sub-id dei membri di gruppi manuali (manual-X__subN -> manual-X)
  // perché in `assignments` esiste solo il record del gruppo, non dei singoli membri.
  const normalizeGuestId = (id: string) => id.replace(/__sub\d+$/, '');

  const checkConstraintConflict = (guestIds: string[], targetTableId: string) => {
    for (const guestId of guestIds) {
      const gIdNorm = normalizeGuestId(guestId);
      for (const c of constraints as any[]) {
        const c1 = normalizeGuestId(c.guestId1);
        const c2 = normalizeGuestId(c.guestId2);
        if (c1 !== gIdNorm && c2 !== gIdNorm) continue;
        const otherId = c1 === gIdNorm ? c2 : c1;
        const otherAssignment = assignments.find((a: any) => a.guestId === otherId);
        if (c.type === 'avoid' && otherAssignment?.tableId === targetTableId) {
          return {
            type: 'avoid' as const,
            guestName: allGuests.find(g => g.id === guestId)?.name || 'Ospite',
            otherGuestName: allGuests.find(g => g.id === otherId || normalizeGuestId(g.id) === otherId)?.name || 'Ospite',
          };
        }
        if (c.type === 'together' && otherAssignment?.tableId && otherAssignment.tableId !== targetTableId) {
          return {
            type: 'together' as const,
            guestName: allGuests.find(g => g.id === guestId)?.name || 'Ospite',
            otherGuestName: allGuests.find(g => g.id === otherId || normalizeGuestId(g.id) === otherId)?.name || 'Ospite',
            otherTableName: tables.find((t: any) => t.id === otherAssignment.tableId)?.name || 'altro tavolo',
          };
        }
      }
    }
    return null;
  };

  const handleOptimize = () => {
    // Se ci sono più ospiti che posti, l'ottimizzazione non può funzionare bene.
    // Mostra il modale per aumentare capienza/aggiungere tavolo invece di lanciarla.
    if (missingSeats > 0) {
      openOverflowModal(missingSeats);
      return;
    }
    const manualAll = assignments.filter((a: any) => a.guestId.startsWith('manual-'));
    const manualAssigned = manualAll.filter((a: any) => a.tableId);
    const manualUnassigned = manualAll.filter((a: any) => !a.tableId);

    // PreOccupancy iniziale: solo i manuali ESPLICITAMENTE assegnati (l'utente li
    // ha messi a un tavolo specifico, non vogliamo spostarli).
    const preOccupancy = new Map<string, number>();
    manualAssigned.forEach((a: any) => {
      preOccupancy.set(a.tableId, (preOccupancy.get(a.tableId) || 0) + (a.numPeople || 1));
    });

    // FIX: piazziamo i manuali NON assegnati PRIMA di optimizeSeating, riservando
    // la loro capienza nel preOccupancy. In questo modo gli RSVP si adattano allo
    // spazio rimanente e nessun manuale resta fuori.
    // Bug precedente: optimizeSeating riempiva i tavoli con gli RSVP fino al limite,
    // poi i manuali "size > 1" non trovavano un tavolo con N posti consecutivi
    // anche se la capienza totale combaciava (frammentazione).
    // Greedy: gruppi più grandi prima (servono N posti consecutivi).
    const sortedManuals = [...manualUnassigned].sort((a: any, b: any) => (b.numPeople || 1) - (a.numPeople || 1));

    // Mappa tableId → guestId[] dei manuali già piazzati al tavolo: serve per il
    // controllo dei vincoli `avoid` durante il greedy. Inizializziamo con i manuali
    // già esplicitamente assegnati dall'utente.
    const placedManualsByTable = new Map<string, string[]>();
    manualAssigned.forEach((a: any) => {
      const arr = placedManualsByTable.get(a.tableId) || [];
      arr.push(a.guestId);
      placedManualsByTable.set(a.tableId, arr);
    });

    /** Controlla se piazzare il manuale `m` al tavolo `t` violerebbe un vincolo
        `avoid` con un altro manuale già al tavolo. */
    const violatesAvoid = (m: any, tableId: string): boolean => {
      const peers = placedManualsByTable.get(tableId) || [];
      if (peers.length === 0) return false;
      return constraints.some((c: any) => {
        if (c.type !== 'avoid') return false;
        const involvesMe = c.guestId1 === m.guestId || c.guestId2 === m.guestId;
        if (!involvesMe) return false;
        const otherId = c.guestId1 === m.guestId ? c.guestId2 : c.guestId1;
        return peers.includes(otherId);
      });
    };

    /** Restituisce il tavolo dove un peer di `m` legato da vincolo `together`
        è già stato piazzato (se esiste). Permette di forzare il piazzamento
        al tavolo del peer per rispettare la regola "Insieme". */
    const findTogetherPeerTable = (m: any): string | null => {
      for (const c of constraints) {
        if (c.type !== 'together') continue;
        const involvesMe = c.guestId1 === m.guestId || c.guestId2 === m.guestId;
        if (!involvesMe) continue;
        const otherId = c.guestId1 === m.guestId ? c.guestId2 : c.guestId1;
        const placedEntries: Array<[string, string[]]> = Array.from(placedManualsByTable.entries());
        for (const [tableId, ids] of placedEntries) {
          if (ids.includes(otherId)) return tableId;
        }
      }
      return null;
    };

    const manualPlacements = sortedManuals.map((m: any) => {
      const groupSize = m.numPeople || 1;

      // Priorità 1: vincolo "Insieme" — se un peer è già al tavolo X e c'è
      // capienza, piazziamo lì anche `m`. Avoid potrebbe entrare in conflitto
      // (raro), in tal caso il check successivo lo segnalerà.
      let targetTable: any = null;
      const peerTableId = findTogetherPeerTable(m);
      if (peerTableId) {
        const peerTable = tables.find((t: any) => t.id === peerTableId);
        if (peerTable) {
          const occ = preOccupancy.get(peerTable.id) || 0;
          if ((peerTable.capacity - occ) >= groupSize) {
            targetTable = peerTable;
          }
        }
      }

      // Priorità 2: tavolo con capienza E senza violazione avoid.
      if (!targetTable) {
        targetTable = tables.find((t: any) => {
          const occ = preOccupancy.get(t.id) || 0;
          if ((t.capacity - occ) < groupSize) return false;
          return !violatesAvoid(m, t.id);
        });
      }

      // Priorità 3: rilassamento — solo capienza. Conflitti residui verranno
      // segnalati all'utente come warning (vedi sotto).
      if (!targetTable) {
        targetTable = tables.find((t: any) => {
          const occ = preOccupancy.get(t.id) || 0;
          return (t.capacity - occ) >= groupSize;
        });
      }

      if (targetTable) {
        preOccupancy.set(targetTable.id, (preOccupancy.get(targetTable.id) || 0) + groupSize);
        const arr = placedManualsByTable.get(targetTable.id) || [];
        arr.push(m.guestId);
        placedManualsByTable.set(targetTable.id, arr);
        return { ...m, tableId: targetTable.id };
      }
      return m; // resta unassigned se proprio nessun tavolo regge il gruppo intero
    });

    // Ora optimizeSeating gira con la capienza già impegnata dai manuali.
    const result = optimizeSeating(tables, eventRsvps, constraints, preOccupancy);

    const finalManuals = [...manualAssigned, ...manualPlacements];

    // Verifica post-hoc: se un vincolo manuale-vs-manuale è ancora violato dopo
    // il greedy, emettiamo un warning visibile nel SeatingWarningsModal.
    const extraWarnings: SplitWarning[] = [];
    constraints.forEach((c: any) => {
      const a1 = finalManuals.find(a => a.guestId === c.guestId1);
      const a2 = finalManuals.find(a => a.guestId === c.guestId2);
      if (!a1 || !a2 || !a1.tableId || !a2.tableId) return;
      if (c.type === 'avoid' && a1.tableId === a2.tableId) {
        const t = tables.find((tb: any) => tb.id === a1.tableId);
        extraWarnings.push({
          type: 'constraint_unresolved',
          groupGuests: [
            { id: a1.guestId, name: a1.guestName || 'Ospite' },
            { id: a2.guestId, name: a2.guestName || 'Ospite' },
          ],
          reason: `Impossibile separare ${a1.guestName} e ${a2.guestName}: nessun altro tavolo li accoglie. Sono entrambi al ${t?.name || 'tavolo'}.`,
        });
      }
      if (c.type === 'together' && a1.tableId !== a2.tableId) {
        const t1 = tables.find((tb: any) => tb.id === a1.tableId);
        const t2 = tables.find((tb: any) => tb.id === a2.tableId);
        extraWarnings.push({
          type: 'constraint_unresolved',
          groupGuests: [
            { id: a1.guestId, name: a1.guestName || 'Ospite' },
            { id: a2.guestId, name: a2.guestName || 'Ospite' },
          ],
          reason: `Impossibile tenere insieme ${a1.guestName} e ${a2.guestName}: capienza insufficiente al ${t1?.name || 'primo tavolo'}. Ora sono al ${t1?.name || '?'} e al ${t2?.name || '?'}.`,
        });
      }
    });

    patchConfig({ tableauAssignments: [...finalManuals, ...result.assignments] });
    const allWarnings = [...result.warnings, ...extraWarnings];
    if (allWarnings.length > 0) {
      setSeatingWarnings(allWarnings);
    }
  };

  const addTable = () => {
    const newTable = {
      id: `table-${Date.now()}`,
      name: `Tavolo ${tables.length + 1}`,
      capacity: 10,
      shape: 'round' as const,
      x: 400,
      y: 300
    };
    patchConfig({ tableauTables: [...tables, newTable] });
  };

  const removeTable = (id: string) => {
    patchConfig({ 
      tableauTables: tables.filter((t: any) => t.id !== id),
      tableauAssignments: assignments.filter((a: any) => a.tableId !== id)
    });
  };

  const moveTable = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tables.length) return;
    const next = [...tables];
    const a = next[index];
    const b = next[newIndex];
    if (!a || !b) return;
    next[index] = b;
    next[newIndex] = a;
    patchConfig({ tableauTables: next });
  };

  // Modali sono renderizzati come Portal: identici in desktop e mobile.
  const modals = (
    <>
      <PublishConfirmModal
        show={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={() => {
          patchConfig({ tableauIsPublished: true });
          setShowPublishConfirm(false);
        }}
      />
      <SeatingWarningsModal
        warnings={seatingWarnings}
        onClose={() => setSeatingWarnings([])}
        assignments={assignments}
        tables={tables}
        patchConfig={patchConfig}
      />
      <CapacityWarningModal
        warning={capacityWarning}
        onClose={() => setCapacityWarning(null)}
        assignments={assignments}
        tables={tables}
        modalHandledIds={modalHandledIds}
        setModalHandledIds={setModalHandledIds}
        patchConfig={patchConfig}
      />
      <ConstraintWarningModal
        warning={constraintWarning}
        onClose={() => setConstraintWarning(null)}
      />
      <OverflowModal
        show={showOverflowModal}
        onClose={closeOverflowModal}
        totalConfirmedGuests={totalConfirmedGuests}
        totalCapacity={totalCapacity}
        missingSeats={missingSeats}
        tables={tables}
        patchConfig={patchConfig}
        setActiveTab={setActiveTab}
        newTableNameInput={newTableNameInput}
        setNewTableNameInput={setNewTableNameInput}
        newTableCapacityInput={newTableCapacityInput}
        setNewTableCapacityInput={setNewTableCapacityInput}
      />
    </>
  );

  // ── MODALITÀ COMPACT (mobile) ──
  // Renderizza solo la section richiesta, niente paywall/header/tabs.
  // Il MobileToolbar fa già da wrapper con padding e gestisce la nav fra tab.
  if (compact) {
    // Paywall mobile: utente non ha ancora attivato l'add-on tableau.
    // Renderizza la card di acquisto invece dei tab di modifica.
    if (section === 'paywall' || !hasTableauAccess) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 16px', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(var(--accent-rgb), 0.2)'
          }}>
            <LayoutGrid size={28} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Tableau Premium</h4>
            <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: 'var(--text-soft)', maxWidth: '280px' }}>
              Attiva l'add-on per gestire i tavoli, gli ospiti e usare l'algoritmo intelligente di assegnazione posti.
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={() => setIsPurchaseModalOpen(true)}
            style={{ height: '52px', justifyContent: 'center', borderRadius: '100px', fontWeight: 800, fontSize: '13px', maxWidth: '320px' }}
          >
            Attiva ora per €15
          </Button>
          {slug && (
            <EventPurchaseModal
              open={isPurchaseModalOpen}
              onClose={() => setIsPurchaseModalOpen(false)}
              eventSlug={slug}
              eventTitle={eventTitle}
              purchaseType="tableau_addon"
              onUnlocked={() => {
                setIsPurchaseModalOpen(false);
                if (updateEventData) {
                  updateEventData({
                    addons: {
                      ...(event?.addons || {}),
                      tableau: true
                    }
                  });
                }
              }}
            />
          )}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {section === 'tables' && (
          <TablesSection
            tables={tables}
            totalConfirmedGuests={totalConfirmedGuests}
            totalCapacity={totalCapacity}
            missingSeats={missingSeats}
            spareSeats={spareSeats}
            confirmDeleteTableId={confirmDeleteTableId}
            patchConfig={patchConfig}
            addTable={addTable}
            moveTable={moveTable}
            removeTable={removeTable}
            setConfirmDeleteTableId={setConfirmDeleteTableId}
          />
        )}
        {section === 'guests' && (
          <GuestsSection
            assignments={assignments}
            tables={tables}
            eventRsvps={eventRsvps}
            config={config}
            expandedGroups={expandedGroups}
            setExpandedGroups={setExpandedGroups}
            manualGuestName={manualGuestName}
            setManualGuestName={setManualGuestName}
            manualGuestCount={manualGuestCount}
            setManualGuestCount={setManualGuestCount}
            confirmDeleteManualId={confirmDeleteManualId}
            setConfirmDeleteManualId={setConfirmDeleteManualId}
            setCapacityWarning={setCapacityWarning}
            setConstraintWarning={setConstraintWarning}
            setShowPublishConfirm={setShowPublishConfirm}
            totalConfirmedGuests={totalConfirmedGuests}
            totalCapacity={totalCapacity}
            missingSeats={missingSeats}
            patchConfig={patchConfig}
            openOverflowModal={openOverflowModal}
            checkConstraintConflict={checkConstraintConflict}
          />
        )}
        {section === 'rules' && (
          <RulesSection
            guestA={guestA}
            guestB={guestB}
            setGuestA={setGuestA}
            setGuestB={setGuestB}
            allGuests={allGuests}
            assignments={assignments}
            constraints={constraints}
            confirmResetAssignments={confirmResetAssignments}
            setConfirmResetAssignments={setConfirmResetAssignments}
            patchConfig={patchConfig}
            handleOptimize={handleOptimize}
          />
        )}
        {section === 'style' && (
          <MetadataSection
            config={config}
            patchConfig={patchConfig}
            displayColorPicker={displayColorPicker}
            setDisplayColorPicker={setDisplayColorPicker}
            themeAccent={event?.theme?.accent}
          />
        )}
        {section === 'publish' && (() => {
          const totalAssigned = assignments.filter((a: any) => a.tableId).reduce((acc, a) => acc + (a.numPeople || 1), 0);
          const isPublished = !!config.tableauIsPublished;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Recap */}
              <div style={{
                padding: '16px', borderRadius: '20px',
                background: isPublished ? 'rgba(var(--accent-rgb), 0.08)' : 'rgba(245, 158, 11, 0.06)',
                border: isPublished ? '1.5px solid rgba(var(--accent-rgb), 0.2)' : '1.5px solid rgba(245, 158, 11, 0.2)',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                  background: isPublished ? 'var(--accent)' : '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isPublished ? '0 4px 12px rgba(var(--accent-rgb), 0.3)' : '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <span style={{ fontSize: '20px' }}>{isPublished ? '✓' : '✎'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: isPublished ? 'var(--accent)' : '#d97706', marginBottom: '2px' }}>
                    {isPublished ? 'Online' : 'Bozza privata'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {totalAssigned}/{totalConfirmedGuests} ospiti assegnati
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-soft)', lineHeight: 1.5, margin: 0, padding: '0 4px' }}>
                {isPublished
                  ? 'Il tableau è visibile a tutti gli ospiti nella pagina pubblica dell\'evento. Puoi tornare in bozza se devi rivedere la disposizione.'
                  : 'Il tableau è ancora in bozza: solo tu lo vedi. Pubblicalo quando sei sicuro della disposizione finale.'}
              </p>

              <Button
                variant={isPublished ? 'subtle' : 'accent'}
                fullWidth
                onClick={() => {
                  if (!isPublished && totalAssigned < totalConfirmedGuests) {
                    setShowPublishConfirm(true);
                  } else {
                    patchConfig({ tableauIsPublished: !isPublished });
                  }
                }}
                style={{ height: '52px', borderRadius: '100px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.02em' }}
              >
                {isPublished ? 'Rendi Privato (Bozza)' : 'Pubblica Tableau'}
              </Button>
            </div>
          );
        })()}
        {modals}
      </div>
    );
  }

  // ── MODALITÀ DESKTOP ──
  return (
    <Surface variant="soft" className="panel-section" style={{ position: 'relative', overflow: hasTableauAccess ? 'visible' : 'hidden', minHeight: '400px' }}>
      <TableauHeader
        hasTableauAccess={hasTableauAccess}
        isPurchaseModalOpen={isPurchaseModalOpen}
        setIsPurchaseModalOpen={setIsPurchaseModalOpen}
        slug={slug}
        eventTitle={eventTitle}
        event={event}
        updateEventData={updateEventData}
        config={config}
        patchConfig={patchConfig}
        showPublishConfirm={showPublishConfirm}
        setShowPublishConfirm={setShowPublishConfirm}
      />

      <MetadataSection
        config={config}
        patchConfig={patchConfig}
        displayColorPicker={displayColorPicker}
        setDisplayColorPicker={setDisplayColorPicker}
      />

      {/* TABS */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'var(--surface-light)', padding: '3px', borderRadius: '100px', border: '1px solid var(--border)' }}>
        <Button
          variant={activeTab === 'tables' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('tables')}
          style={{ flex: 1, padding: '6px 2px', fontSize: '10px', height: 'auto', fontWeight: 800, borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em', justifyContent: 'center' }}
        >
          Tavoli
        </Button>
        <Button
          variant={activeTab === 'guests' ? 'primary' : 'ghost'}
          onClick={() => {
            const wasOnTables = activeTab !== 'guests';
            setActiveTab('guests');
            if (wasOnTables && missingSeats > 0) openOverflowModal(missingSeats);
          }}
          style={{ flex: 1, padding: '6px 2px', fontSize: '10px', height: 'auto', fontWeight: 800, borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em', justifyContent: 'center' }}
        >
          Ospiti &amp; Regole
        </Button>
      </div>

      {/* CONTENT: TABLES */}
      {activeTab === 'tables' && (
        <TablesSection
          tables={tables}
          totalConfirmedGuests={totalConfirmedGuests}
          totalCapacity={totalCapacity}
          missingSeats={missingSeats}
          spareSeats={spareSeats}
          confirmDeleteTableId={confirmDeleteTableId}
          patchConfig={patchConfig}
          addTable={addTable}
          moveTable={moveTable}
          removeTable={removeTable}
          setConfirmDeleteTableId={setConfirmDeleteTableId}
        />
      )}

      {/* CONTENT: GUESTS + RULES */}
      {activeTab === 'guests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ── MOTORE INTELLIGENTE ── */}
          <RulesSection
            guestA={guestA}
            guestB={guestB}
            setGuestA={setGuestA}
            setGuestB={setGuestB}
            allGuests={allGuests}
            assignments={assignments}
            constraints={constraints}
            confirmResetAssignments={confirmResetAssignments}
            setConfirmResetAssignments={setConfirmResetAssignments}
            patchConfig={patchConfig}
            handleOptimize={handleOptimize}
          />

          {/* ── DIVIDER ── */}
          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

          <GuestsSection
            assignments={assignments}
            tables={tables}
            eventRsvps={eventRsvps}
            config={config}
            expandedGroups={expandedGroups}
            setExpandedGroups={setExpandedGroups}
            manualGuestName={manualGuestName}
            setManualGuestName={setManualGuestName}
            manualGuestCount={manualGuestCount}
            setManualGuestCount={setManualGuestCount}
            confirmDeleteManualId={confirmDeleteManualId}
            setConfirmDeleteManualId={setConfirmDeleteManualId}
            setCapacityWarning={setCapacityWarning}
            setConstraintWarning={setConstraintWarning}
            setShowPublishConfirm={setShowPublishConfirm}
            totalConfirmedGuests={totalConfirmedGuests}
            totalCapacity={totalCapacity}
            missingSeats={missingSeats}
            patchConfig={patchConfig}
            openOverflowModal={openOverflowModal}
            checkConstraintConflict={checkConstraintConflict}
          />
        </div>
      )}

      {/* MODALI (PORTAL) — vedi const modals sopra */}
      {modals}
    </Surface>
  );
};

export default TableauSidebar;
