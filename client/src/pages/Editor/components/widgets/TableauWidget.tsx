import React from 'react';
import { Users, Search, Map as MapIcon } from "lucide-react";
import { getAdaptivePalette } from '../../../../utils/colorUtils';
import type { Block } from "../../../../types/editor";

interface TableauWidgetProps {
  block: Block;
  isEditor?: boolean | undefined;
  hasTableauAccess?: boolean | undefined;
  onUpdateBlock?: ((blockId: string, updates: Partial<Block>) => void) | undefined;
  accentColor?: string | undefined;
  sectionBg?: string | undefined;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

const TableauWidget: React.FC<TableauWidgetProps> = ({ block, isEditor, hasTableauAccess = false, onUpdateBlock, accentColor, sectionBg: propSectionBg }) => {
  const config = block.widgetProps || {};
  const tables = config.tableauTables || [];
  const assignments = (config.tableauAssignments || []) as any[];
  const layout = config.tableauLayout || 'grid';
  const [search, setSearch] = React.useState('');
  /** Quando la ricerca produce match a tavoli DIVERSI, l'utente deve scegliere
      quale ospite è effettivamente lui (es. due Marco a tavoli diversi). */
  const [pickedMatchId, setPickedMatchId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Reset della selezione di disambiguazione ogni volta che il termine cambia
  React.useEffect(() => { setPickedMatchId(null); }, [search]);

  // L'overlay viene mostrato SOLO se siamo in vista PUBBLICA e non c'è accesso.
  // In editor l'utente deve poterlo configurare per vedere cosa sta comprando.
  const showOverlay = !isEditor && !hasTableauAccess;
  const isDraft = !isEditor && !config.tableauIsPublished && hasTableauAccess;

  /** Espande un'assignment in array di nomi (gestisce ospiti manuali multi-persona). */
  const expandAssignmentNames = (a: any): string[] => {
    const isManual = typeof a.guestId === 'string' && a.guestId.startsWith('manual-');
    if (isManual) {
      if (Array.isArray(a.names) && a.names.length > 0) {
        return a.names.map((n: string, i: number) => n || `Ospite ${i + 1}`);
      }
      if ((a.numPeople || 1) > 1) {
        return Array.from({ length: a.numPeople }, (_, i) =>
          i === 0 ? (a.guestName || 'Ospite') : `Ospite ${i + 1}`
        );
      }
    }
    return [a.guestName || 'Ospite'];
  };

  /** Tutti i match per il termine corrente (tutti i nomi a livello di singola
      persona, anche dentro gruppi manuali, tutti i tavoli). Ogni elemento ha un
      id univoco usato per la disambiguazione quando ci sono più tavoli. */
  type Match = { id: string; displayName: string; tableId: string; tableName: string };
  const matches: Match[] = React.useMemo(() => {
    if (!search.trim() || search.length < 2) return [];
    const term = search.toLowerCase();
    const results: Match[] = [];
    for (const a of assignments) {
      if (!a.tableId) continue;
      const names = expandAssignmentNames(a);
      names.forEach((n, idx) => {
        if (!n.toLowerCase().includes(term)) return;
        const table = tables.find((t: any) => t.id === a.tableId);
        if (!table) return;
        results.push({
          id: `${a.guestId}__${idx}`,
          displayName: n,
          tableId: a.tableId,
          tableName: table.name,
        });
      });
    }
    return results;
  }, [search, assignments, tables]);

  /** Tavoli unici tra i match — se 1 solo, niente disambiguazione. */
  const uniqueMatchTableIds = React.useMemo(
    () => Array.from(new Set(matches.map(m => m.tableId))),
    [matches]
  );

  /** Match "attivo": quello mostrato nel pannello pieno.
      - Se l'utente ha cliccato su una scelta in disambiguazione → usa quella.
      - Se tutti i match sono allo STESSO tavolo → uso il primo (l'evidenziazione
        sotto coprirà comunque tutti i nomi che combaciano col termine).
      - Se i match sono distribuiti su più tavoli → null (mostriamo lista). */
  const activeMatch: Match | null = React.useMemo(() => {
    if (matches.length === 0) return null;
    if (pickedMatchId) return matches.find(m => m.id === pickedMatchId) ?? null;
    if (uniqueMatchTableIds.length === 1) return matches[0] ?? null;
    return null;
  }, [matches, pickedMatchId, uniqueMatchTableIds]);

  /** Compagni di tavolo del match attivo (espansi). */
  const activeTableMates: string[] = React.useMemo(() => {
    if (!activeMatch) return [];
    return assignments
      .filter((a: any) => a.tableId === activeMatch.tableId)
      .flatMap(expandAssignmentNames);
  }, [activeMatch, assignments]);

  /** Stato sintetico per il rendering del pannello: 'empty' (no input), 'not_found',
      'ambiguous' (>1 tavolo, scelta richiesta), 'resolved' (pannello pieno). */
  const searchState: 'empty' | 'not_found' | 'ambiguous' | 'resolved' =
    !search.trim() || search.length < 2 ? 'empty'
    : matches.length === 0 ? 'not_found'
    : !activeMatch ? 'ambiguous'
    : 'resolved';

  if (isDraft) {
    return (
      <div style={{
        width: '100%', height: '100%', minHeight: '400px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px', textAlign: 'center', background: block.bgColor || 'transparent'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px', border: '1px dashed var(--accent)'
        }}>
          <MapIcon size={32} />
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px', fontFamily: 'var(--font-heading)' }}>Disposizione Tavoli</h3>
        <p style={{ maxWidth: '360px', margin: '0', fontSize: '15px', opacity: 0.6, lineHeight: 1.6 }}>
          La mappa dei tavoli è in fase di ultimazione. 
          Torna a trovarci tra poco per scoprire il tuo posto!
        </p>
      </div>
    );
  }

  // Default hex (non var CSS): serve hex per derivare accent-rgb e usare
  // `rgba(var(--accent-rgb), …)` per overlay/opacità all'interno del widget.
  // #1ABC9C = tiffany brand di eenvee.
  const accent = accentColor || '#1ABC9C';
  const isHex = accent.startsWith('#');
  const accentRgb = isHex ? hexToRgb(accent) : null;
  const sectionBg = propSectionBg || block.props?.bgColor || block.bgColor || 'transparent';
  const palette = getAdaptivePalette(sectionBg, accent);
  const customStyles = {
    '--accent': accent,
    ...(accentRgb ? { '--accent-rgb': accentRgb } : {}),
    '--text-primary': palette.text,
    '--text-soft': palette.textSoft,
    '--border': palette.border,
    '--surface': palette.surface,
  };

  // Signature che cambia quando il contenuto effettivo cambia (numPeople, names, ecc.)
  const contentSignature = React.useMemo(() => {
    const tablesSig = tables.map((t: any) => `${t.id}:${t.name}:${t.capacity}`).join('|');
    const assignSig = assignments.map((a: any) => {
      const n = (a.names && a.names.length > 0) ? a.names.length : (a.numPeople || 1);
      return `${a.guestId}:${a.tableId || ''}:${n}`;
    }).join('|');
    return `${tablesSig}::${assignSig}`;
  }, [tables, assignments]);

  // Auto-resize: combina ResizeObserver (cattura cambi reali di dimensione) + trigger esplicito su cambio contenuto.
  // Multiple misurazioni a delay crescenti per catturare layout asincroni (font, immagini).
  const blockHeightRef = React.useRef(block.height || 400);
  React.useEffect(() => { blockHeightRef.current = block.height || 400; }, [block.height]);

  const measureAndUpdate = React.useCallback(() => {
    if (!isEditor || !onUpdateBlock || !containerRef.current) return;
    const widgetH = containerRef.current.scrollHeight;
    const currentH = blockHeightRef.current;
    // Buffer per non incollare il widget al bordo della sezione
    const requiredH = Math.max(widgetH + 80, 400);
    if (Math.abs(requiredH - currentH) > 8) {
      const oldH = currentH;
      const oldY = (block.widgetProps as any)?.tableauY;
      blockHeightRef.current = requiredH;
      const updates: any = { height: requiredH };
      // Se il widget era stato draggato (tableauY in pixel), scala proporzionalmente alla nuova altezza
      // così il widget mantiene la stessa posizione relativa e non finisce fuori dalla sezione.
      if (typeof oldY === 'number' && !isNaN(oldY) && oldH > 0) {
        const newY = (oldY / oldH) * requiredH;
        updates.widgetProps = { ...(block.widgetProps || {}), tableauY: newY };
      }
      onUpdateBlock(block.id!, updates);
    }
  }, [isEditor, onUpdateBlock, block.id, block.widgetProps]);

  // Trigger 1: ResizeObserver
  React.useEffect(() => {
    if (!isEditor || !onUpdateBlock || !containerRef.current) return;
    const el = containerRef.current;
    let debounceTimer: number | undefined;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(measureAndUpdate, 80);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(debounceTimer);
    };
  }, [isEditor, onUpdateBlock, measureAndUpdate]);

  // Trigger 2: cambio contenuto. Multiple misurazioni a 100/350/800ms per catturare layout asincroni.
  React.useEffect(() => {
    if (!isEditor || !onUpdateBlock) return;
    const t1 = window.setTimeout(measureAndUpdate, 100);
    const t2 = window.setTimeout(measureAndUpdate, 350);
    const t3 = window.setTimeout(measureAndUpdate, 800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [contentSignature, isEditor, onUpdateBlock, measureAndUpdate]);

  return (
    <div className="tableau-widget" ref={containerRef} style={{
      ...customStyles as React.CSSProperties,
      width: '100%',
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '60px 20px',
      color: 'var(--text-primary)',
      minHeight: '400px',
      position: 'relative',
      overflow: 'visible'
    }}>
      {showOverlay && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          backdropFilter: 'blur(20px)',
          background: palette.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '84px', height: '84px', borderRadius: '28px',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '28px', boxShadow: '0 20px 40px rgba(var(--accent-rgb), 0.3)'
          }}>
            <Users size={40} fill="currentColor" />
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 16px', fontFamily: 'var(--font-heading)' }}>Tableau de Mariage</h3>
          <p style={{ maxWidth: '420px', margin: '0', fontSize: '17px', opacity: 0.8, lineHeight: 1.6 }}>
            Accedi alla disposizione dei tavoli e scopri i tuoi compagni di cena. 
            Questo modulo è disponibile con il pacchetto Premium.
          </p>
        </div>
      )}
      
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* HEADER STILE RSVP (Senza background card, Senza titolo) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '14px',
            background: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid rgba(var(--accent-rgb), 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={24} color="var(--accent)" />
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading, serif)',
            lineHeight: 1.2,
            color: 'var(--text-primary)'
          }}>
            {config.tableauTitle || 'TABLEAU DE MARIAGE'}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-soft)', lineHeight: 1.6, maxWidth: '480px' }}>
            {config.tableauDescription || (tables.length === 0 && isEditor ? 'Aggiungi i tavoli dalla sidebar per iniziare' : 'Cerca il tuo nome per trovare il tuo posto.')}
          </div>
        </div>

        {tables.length > 0 && (
          <div style={{ width: '100%' }}>
            <style>{`
              .tableau-search-input::placeholder {
                color: var(--text-soft);
                opacity: 0.8;
              }
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          {/* SEARCH BAR REDESIGN */}
          <div style={{
            maxWidth: '540px',
            margin: '0 auto 60px',
            position: 'relative',
            zIndex: 30
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '6px 6px 6px 24px',
              boxShadow: search ? '0 10px 40px rgba(var(--accent-rgb), 0.12)' : '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <Search size={20} style={{ color: search ? 'var(--accent)' : 'var(--text-soft)', marginRight: '16px' }} />
              <input
                type="text"
                className="tableau-search-input"
                placeholder="Cerca il tuo nome…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                // FIX UX: il browser autofill mostrava un'icona profilo a destra
                // dell'input perché interpretava il campo come username.
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                name="tableau-guest-search"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '16px', fontWeight: 500,
                  fontFamily: 'inherit'
                }}
                readOnly={isEditor}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{
                    background: 'var(--surface-light)', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', marginRight: '4px', color: 'var(--text-soft)'
                  }}
                >
                  <Search size={14} style={{ transform: 'rotate(45deg)' }} />
                </button>
              )}
            </div>

            {/* SEARCH RESULTS OVERLAY — opaco (no trasparenza), copre la grid sotto */}
            {searchState !== 'empty' && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 16px)',
                left: '10px', right: '10px',
                // Sfondo OPACO: var(--surface) era semi-trasparente in alcuni temi.
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '32px',
                padding: '32px 28px',
                zIndex: 40,
                boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
                textAlign: 'center',
                animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {searchState === 'not_found' && (
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-soft)' }}>
                    Non abbiamo trovato "{search}" tra gli invitati assegnati.
                  </div>
                )}

                {/* AMBIGUOUS: più match su tavoli diversi.
                    Mostriamo per ogni tavolo coinvolto: nome + lista dei compagni
                    (con i nomi che combaciano evidenziati). L'utente riconosce
                    il proprio tavolo dal contesto degli altri ospiti (es. la
                    moglie/marito vicino al proprio nome) — niente click obbligato.
                    Le card sono comunque cliccabili per "fissare" il pannello. */}
                {searchState === 'ambiguous' && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px' }}>
                      {matches.length} risultati su {uniqueMatchTableIds.length} tavoli
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: 1.5 }}>
                      Riconosci il tuo tavolo dagli altri ospiti
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {uniqueMatchTableIds.map((tableId) => {
                        const tableInfo = tables.find((t: any) => t.id === tableId);
                        if (!tableInfo) return null;
                        // Match a questo tavolo (per evidenziazione)
                        const matchesAtTable = matches.filter((m) => m.tableId === tableId);
                        const matchNamesLower = new Set(matchesAtTable.map((m) => m.displayName.toLowerCase()));
                        // Compagni di tavolo (espansi a livello di singola persona)
                        const mates: string[] = assignments
                          .filter((a: any) => a.tableId === tableId)
                          .flatMap(expandAssignmentNames);

                        // Click sulla card → fissa il match (apre il pannello pieno)
                        const firstMatchId = matchesAtTable[0]?.id ?? null;

                        return (
                          <div
                            key={tableId}
                            role="button"
                            tabIndex={0}
                            onClick={() => firstMatchId && setPickedMatchId(firstMatchId)}
                            onKeyDown={(e) => {
                              if ((e.key === 'Enter' || e.key === ' ') && firstMatchId) {
                                e.preventDefault();
                                setPickedMatchId(firstMatchId);
                              }
                            }}
                            style={{
                              padding: '16px 18px',
                              background: 'rgba(var(--accent-rgb), 0.04)',
                              border: '1px solid rgba(var(--accent-rgb), 0.20)',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              transition: 'all .15s ease',
                              textAlign: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.08)';
                              e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.35)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.04)';
                              e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.20)';
                            }}
                          >
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
                              Tavolo
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-heading)', marginBottom: '12px', lineHeight: 1.1 }}>
                              {tableInfo.name}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {mates.map((name, i) => {
                                const isMatch = matchNamesLower.has(name.toLowerCase());
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: isMatch ? 800 : 500,
                                      color: isMatch ? 'var(--accent)' : 'var(--text-primary)',
                                      background: isMatch ? 'rgba(var(--accent-rgb), 0.10)' : 'transparent',
                                      border: isMatch ? '1px solid rgba(var(--accent-rgb), 0.25)' : '1px solid transparent',
                                      borderRadius: '100px',
                                      padding: '5px 12px',
                                    }}
                                  >
                                    {name}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* RESOLVED: 1 match (o tutti allo stesso tavolo), oppure
                    l'utente ha cliccato sulla disambiguazione. Mostriamo il
                    tavolo + lista compagni con i nomi che combaciano evidenziati. */}
                {searchState === 'resolved' && activeMatch && (
                  <div>
                    {pickedMatchId && (
                      <button
                        onClick={() => setPickedMatchId(null)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          fontSize: '11px', fontWeight: 700, color: 'var(--text-soft)',
                          padding: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em',
                          fontFamily: 'inherit',
                        }}
                      >
                        ← Altri risultati
                      </button>
                    )}
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px' }}>
                      Tavolo
                    </div>
                    <h3 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                      {activeMatch.tableName}
                    </h3>

                    {activeTableMates.length > 0 && (
                      <div style={{
                        marginTop: '24px',
                        paddingTop: '20px',
                        borderTop: '1px solid var(--border-subtle, var(--border))',
                        display: 'flex', flexDirection: 'column', gap: '6px',
                        maxWidth: '340px', margin: '24px auto 0',
                      }}>
                        {activeTableMates.map((name, i) => {
                          const term = search.toLowerCase().trim();
                          // Evidenziamo se l'utente ha disambiguato → solo il nome esatto scelto.
                          // Altrimenti tutti i nomi che combaciano (caso "5 zii Marco stesso tavolo").
                          const isMe = pickedMatchId
                            ? name === activeMatch.displayName
                            : (term.length >= 2 && name.toLowerCase().includes(term));
                          return (
                            <div
                              key={i}
                              style={{
                                fontSize: '14px',
                                fontWeight: isMe ? 800 : 500,
                                color: isMe ? 'var(--accent)' : 'var(--text-primary)',
                                background: isMe ? 'rgba(var(--accent-rgb), 0.10)' : 'transparent',
                                border: isMe ? '1px solid rgba(var(--accent-rgb), 0.25)' : '1px solid transparent',
                                borderRadius: '100px',
                                padding: '8px 14px',
                                textAlign: 'center',
                              }}
                            >
                              {name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TABLES GRID (SMART CENTERING).
              Quando c'è un risultato di ricerca attivo, sfochiamo + sbiadiamo
              la grid in modo che il pannello risultati (sopra) risalti senza
              competere visivamente con i nomi dei tavoli. */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '40px',
            opacity: searchState !== 'empty' ? 0.25 : 1,
            filter: searchState !== 'empty' ? 'blur(4px)' : 'none',
            pointerEvents: searchState !== 'empty' ? 'none' : 'auto',
            transition: 'opacity 0.35s ease, filter 0.35s ease'
          }}>
            {tables.map((table: any) => {
                const tableAssignments = assignments.filter(a => a.tableId === table.id);
                const tableOccupancy = tableAssignments.reduce((acc, a) => acc + (a.numPeople || 1), 0);
                
                return (
                  <div key={table.id} style={{
                    flex: '0 1 300px', // Base width of 300px
                    minHeight: '280px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '32px', // Sempre rettangolare stondato
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start', // Partiamo dall'alto
                    gap: '20px',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    textAlign: 'center',
                    borderTop: `6px solid var(--accent)`,
                    transform: activeMatch && activeMatch.tableId === table.id ? 'scale(1.05)' : 'scale(1)',
                    zIndex: activeMatch && activeMatch.tableId === table.id ? 2 : 1,
                    boxShadow: activeMatch && activeMatch.tableId === table.id ? '0 20px 50px rgba(var(--accent-rgb), 0.2)' : '0 12px 40px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: 'rgba(var(--accent-rgb), 0.05)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginBottom: '4px'
                      }}>
                        <Users size={18} color="var(--accent)" />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <h5 style={{ 
                          margin: 0, fontSize: '20px', fontWeight: 900, 
                          fontFamily: 'var(--font-heading)',
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.02em'
                        }}>
                          {table.name}
                        </h5>
                        <div style={{ 
                          fontSize: '11px', fontWeight: 800, color: 'var(--accent)', 
                          textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px',
                          opacity: 0.8
                        }}>
                          {tableOccupancy} / {table.capacity} Ospiti
                        </div>
                      </div>
                    </div>

                  {/* GUEST LIST */}
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: '10px', 
                    paddingTop: '20px', borderTop: '1px solid var(--border-subtle)',
                    width: '100%', maxWidth: '200px'
                  }}>
                    {tableAssignments.length > 0 ? (
                      tableAssignments.flatMap((guest: any, idx: number) => {
                        const isManual = typeof guest.guestId === 'string' && guest.guestId.startsWith('manual-');
                        // Per ospiti manuali con multiple persone: mostra ciascun nome individualmente.
                        let rows: string[];
                        if (isManual) {
                          if (guest.names && Array.isArray(guest.names) && guest.names.length > 0) {
                            rows = guest.names.map((n: string, i: number) => n || `Ospite ${i + 1}`);
                          } else if ((guest.numPeople || 1) > 1) {
                            rows = Array.from({ length: guest.numPeople }, (_, i) => i === 0 ? (guest.guestName || 'Ospite') : `Ospite ${i + 1}`);
                          } else {
                            rows = [guest.guestName || 'Ospite'];
                          }
                        } else {
                          rows = [guest.guestName || 'Ospite'];
                        }
                        return rows.map((name, i) => (
                          <div key={`${idx}-${i}`} style={{
                            fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            fontFamily: 'var(--font-body)'
                          }}>
                            {name}
                          </div>
                        ));
                      })
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-soft)', fontStyle: 'italic', opacity: 0.5 }}>
                        Tavolo vuoto
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TableauWidget;
