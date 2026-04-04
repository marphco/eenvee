import React, { useRef, useState } from 'react';
import EnvelopeAnimation from "../../../components/envelope/EnvelopeAnimation";
import ReadOnlyCanvas from "../../../components/canvas/ReadOnlyCanvas";
import BuilderSection from "./BuilderSection";
import { ScrollHint } from "../../../components/ui/ScrollHint";
import type { Layer, CanvasProps, Block } from "../../../types/editor";

interface EventPageBuilderProps {
  event: any;
  canvasProps: CanvasProps;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  selectedLayerIds: string[];
  setSelectedLayerIds: (ids: string[]) => void;
  isMobile: boolean;
  scenarioScale: number;
  updateTheme: (updates: any, pushToHistory?: () => void) => void;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  selectedBlockId: string | null;
  setSelectedBlockId: React.Dispatch<React.SetStateAction<string | null>>;
  pushToHistory: () => void;
  setIsDirty: (val: boolean) => void;
  previewMobile: boolean;
  editingLayerId: string | null;
  setEditingLayerId: (id: string | null) => void;
}

export function EventPageBuilder({
  event,
  canvasProps,
  layers,
  setLayers,
  selectedLayerIds,
  setSelectedLayerIds,
  isMobile,
  scenarioScale,
  updateTheme,
  blocks,
  setBlocks,
  selectedBlockId,
  setSelectedBlockId,
  pushToHistory,
  setIsDirty,
  previewMobile,
  editingLayerId,
  setEditingLayerId
}: EventPageBuilderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInvitationOpened, setIsInvitationOpened] = useState(false);
  const [editorScale, setEditorScale] = useState(1);
  const LOGICAL_WIDTH = 1000;
  const MAX_CANVA_WIDTH = 1200;

  // CALCOLO SCALA UNIFICATA (Busta + Sezioni)
  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const availableW = entry.contentRect.width;
        // Riserviamo 100px per la toolbar a destra
        const effectiveW = isMobile ? availableW : (availableW - 100); 
        const newScale = Math.min(effectiveW, MAX_CANVA_WIDTH) / LOGICAL_WIDTH;
        setEditorScale(newScale);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  const handleHeightChange = (index: number, newHeight: number) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], height: newHeight } as any;
    setBlocks(newBlocks); // Reattività immediata
  };

  const handleHeightChangeComplete = () => {
    // Sincronizza con il tema dell'evento solo alla fine del drag per performance e history pulita
    updateTheme({ blocks: blocks }); 
    pushToHistory();
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    const current = newBlocks[index];
    const target = newBlocks[targetIndex];
    if (!current || !target) return;

    newBlocks[index] = target;
    newBlocks[targetIndex] = current;
    
    setBlocks(newBlocks);
    updateTheme({ blocks: newBlocks });
    pushToHistory();
  };

  const duplicateBlock = (index: number) => {
    const blockToDuplicate = blocks[index];
    if (!blockToDuplicate) return;

    const newBlockId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const newBlock: Block = { 
      ...blockToDuplicate, 
      id: newBlockId 
    };

    // Deep copy of layers belonging to this block
    const blockLayers = layers.filter(l => l.blockId === blockToDuplicate.id);
    const newLayers = blockLayers.map(l => ({
      ...l,
      id: 'layer-' + Math.random().toString(36).substr(2, 9),
      blockId: newBlockId
    }));
    
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    
    setBlocks(newBlocks);
    setLayers(prev => [...prev, ...newLayers]); // Aggiungi i nuovi layer clonati
    updateTheme({ blocks: newBlocks, layers: [...layers, ...newLayers] });
    pushToHistory();
  };

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
    updateTheme({ blocks: newBlocks });
    pushToHistory();
  };

  const handleBlockColorChange = (index: number, newColor: string) => {
    const newBlocks = [...blocks];
    const targetBlock = { ...newBlocks[index] };
    const targetProps = { ...targetBlock.props, bgColor: newColor };
    newBlocks[index] = { ...targetBlock, props: targetProps } as any;
    setBlocks(newBlocks);
    updateTheme({ blocks: newBlocks }, pushToHistory);
  };

  return (
    <div 
      className="event-page-builder-container custom-scrollbar" 
      ref={containerRef}
      onClick={() => { setSelectedBlockId(null); setSelectedLayerIds([]); }}
      style={{ 
        width: '100%', 
        height: '100%', 
        overflowY: 'auto', 
        overflowX: 'hidden',
        background: 'var(--bg-body)',
        position: 'relative'
      }}
    >
      <div 
        className="event-page-width-constraint"
        style={{
          width: '100%',
          maxWidth: previewMobile ? '1020px' : '100%', // Allineato alla larghezza della busta + padding
          margin: '0 auto', 
          // CANALE SICURO PER LA TOOLBAR: reserviamo 100px a destra
          paddingRight: isMobile ? '0' : '100px', 
          position: 'relative',
          minHeight: '100%',
          zIndex: 5,
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: previewMobile ? '0 0 50px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        {/* =======================
            HERO SECTION (Blocco 1) - ALLINEATA E SCALATA
            ======================= */}
        <div 
          className="event-hero-section"
          style={{
            width: previewMobile ? '100%' : (editorScale * LOGICAL_WIDTH) + 'px',
            minHeight: event?.theme?.envelopeFormat === 'vertical'
              ? (isMobile ? '83vh' : '85vh') 
              : (event?.theme?.envelopeFormat === 'horizontal'
                  ? '80vh'
                  : ((Math.abs((event?.canvas?.width || 0) - (event?.canvas?.height || 0)) < 10) ? (isMobile ? '720px' : '980px') : '100vh')),
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: event?.theme?.heroBgColor || 'transparent',
            backgroundImage: (event?.theme?.heroBg && !event.theme.heroBg.startsWith('#') && !event.theme.heroBg.startsWith('rgb') && event.theme.heroBg !== 'none') 
              ? `url(${event.theme.heroBg})` 
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: event?.theme?.heroBgPosition || 'center',
            backgroundRepeat: 'no-repeat',
            overflow: 'visible' 
          }}
        >
          {/* Overlay solo se c'è un'immagine di sfondo */}
          {(event?.theme?.heroBg && event.theme.heroBg !== 'none' && !event.theme.heroBg.startsWith('#')) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: event?.theme?.heroBgColor || 'transparent',
              opacity: 1 - (event?.theme?.heroBgOpacity ?? 1),
              zIndex: 1,
              pointerEvents: 'none'
            }} />
          )}

          <div style={{ 
            position: 'relative', 
            zIndex: 2,
            width: LOGICAL_WIDTH + 'px', 
            display: 'flex',
            justifyContent: 'center',
            transform: isMobile ? 'scale(0.72)' : 'none', 
            transformOrigin: 'center center', 
            flexShrink: 0,
            marginTop: event?.theme?.envelopeFormat === 'vertical'
              ? (isMobile ? '1vh' : '5vh')
              : (event?.theme?.envelopeFormat === 'horizontal'
                  ? (isMobile ? '-10vh' : '0')
                  : '0')
          }}>
            <EnvelopeAnimation 
              envelopeFormat={event?.theme?.envelopeFormat || 'vertical'}
              envelopeColor={event?.theme?.coverBg || '#54392d'}
              linerImg={event?.theme?.coverLiner === 'none' ? null : (event?.theme?.coverLiner || null)}
              pocketColor={event?.theme?.coverPocketColor || event?.theme?.coverBg || '#54392d'}
              pocketLinerImg={event?.theme?.coverPocketLiner}
              linerX={event?.theme?.linerX || 0}
              linerY={event?.theme?.linerY || 0}
              linerScale={event?.theme?.linerScale || 1}
              linerOpacity={event?.theme?.linerOpacity ?? 1}
              linerColor={event?.theme?.coverLinerColor || '#ffffff'}
              canvasProps={canvasProps}
              manualPhase={null}
              isEventPage={true}
              isBuilder={true}
              isMobile={isMobile}
              scale={editorScale}
              onOpenComplete={() => setIsInvitationOpened(true)}
            >
               <ReadOnlyCanvas layers={layers} canvasProps={canvasProps} />
            </EnvelopeAnimation>
          </div>

          {/* SCROLL HINT */}
          {isInvitationOpened && <ScrollHint isMobile={isMobile} color={event?.theme?.accentColor || 'var(--accent)'} />}
        </div>

        {/* =======================
            DYNAMIC SECTIONS (Blocks)
            ======================= */}
        <div className="dynamic-sections-container" style={{ position: 'relative', overflow: 'visible', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {blocks.map((block, idx) => (
          <BuilderSection 
            key={block.id || idx}
            block={block}
            index={idx}
            isSelected={selectedBlockId === block.id}
            onClick={() => setSelectedBlockId(block.id || null)}
            onHeightChange={(h) => handleHeightChange(idx, h)}
            onHeightChangeComplete={handleHeightChangeComplete}
            onMoveUp={() => moveBlock(idx, 'up')}
            onMoveDown={() => moveBlock(idx, 'down')}
            onDuplicate={() => duplicateBlock(idx)}
            onDelete={() => deleteBlock(idx)}
            onColorChange={(color) => handleBlockColorChange(idx, color)}
            isFirst={idx === 0}
            isLast={idx === blocks.length - 1}
            isMobile={isMobile}
            bgColor={block.props?.bgColor || '#ffffff'}
            layers={layers}
            selectedLayerIds={selectedLayerIds}
            setSelectedLayerIds={setSelectedLayerIds}
            setLayers={setLayers}
            pushToHistory={pushToHistory}
            setIsDirty={setIsDirty}
            previewMobile={previewMobile}
            editingLayerId={editingLayerId}
            setEditingLayerId={setEditingLayerId}
            editorScale={editorScale} // Passiamo la scala calcolata
          />
        ))}
      </div>

      {/* BUtton Aggiungi Sezione placeholder */}
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-soft)', fontSize: '13px', marginBottom: '16px' }}>
             Questa è la pagina che i tuoi invitati vedranno scorrendo verso il basso.
          </p>
          <button 
            style={{ 
              padding: '10px 20px', 
              borderRadius: '30px', 
              border: '1px dashed var(--accent)', 
              backgroundColor: 'transparent',
              color: 'var(--accent)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
            onClick={() => {
              const newBlocks = [...blocks, { 
                id: 'block-' + Date.now(), 
                type: 'custom',
                y: 0, // Required by Block interface
                title: 'Nuova Sezione', 
                height: 400, 
                bgColor: '#ffffff' 
              } as Block];
              updateTheme({ blocks: newBlocks });
              pushToHistory();
            }}
          >
            + Aggiungi Sezione
          </button>
      </div>
      </div>
    </div>
  );
};

export default EventPageBuilder;
