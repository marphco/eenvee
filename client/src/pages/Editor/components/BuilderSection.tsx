import React, { useState } from 'react';
import type { Block, Layer } from '../../../types/editor';
import SectionToolbar from './SectionToolbar';
import { SectionCanvas } from './SectionCanvas';

interface BuilderSectionProps {
  block: Block;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onHeightChange: (height: number) => void;
  onHeightChangeComplete?: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  isMobile: boolean;
  onColorChange: (color: string) => void;
  bgColor: string;
  layers: Layer[];
  selectedLayerIds: string[];
  setSelectedLayerIds: (ids: string[]) => void;
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  pushToHistory: () => void;
  setIsDirty: (val: boolean) => void;
  previewMobile: boolean;
  editingLayerId: string | null;
  setEditingLayerId: (id: string | null) => void;
  editorScale: number; // Prop sincronizzata
}

const BuilderSection: React.FC<BuilderSectionProps> = ({ 
  block, 
  index, 
  isSelected, 
  onClick, 
  onHeightChange, 
  onHeightChangeComplete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  isFirst,
  isLast,
  isMobile,
  onColorChange,
  bgColor,
  layers,
  selectedLayerIds,
  setSelectedLayerIds,
  setLayers,
  pushToHistory,
  setIsDirty,
  previewMobile,
  editingLayerId,
  setEditingLayerId,
  editorScale
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnchorHovered, setIsAnchorHovered] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId); 
    
    const startY = e.clientY;
    const initHeight = block.height || 400;

    const handleMove = (moveEv: PointerEvent) => {
      const dy = moveEv.clientY - startY;
      // Adattiamo il delta y alla scala per un trascinamento naturale
      onHeightChange(Math.max(100, initHeight + (dy / editorScale)));
    };

    const handleUp = (upEv: PointerEvent) => {
      target.releasePointerCapture(upEv.pointerId);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      if (onHeightChangeComplete) onHeightChangeComplete();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const currentZIndex = isSelected ? 10 : (isHovered ? 5 : 1);
  
  const LOGICAL_WIDTH = 1000; 
  const currentScale = previewMobile ? 1 : editorScale;
  const scaledHeight = (block.height || 400) * currentScale;

  return (
    <div 
      className={`builder-section-item ${isSelected ? 'selected' : ''}`}
      data-block-id={block.id}
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: previewMobile ? '100%' : (currentScale * LOGICAL_WIDTH) + 'px', // Fluidità in anteprima, fisso in design libero
        height: (previewMobile ? 'auto' : (scaledHeight + 'px')),
        minHeight: previewMobile ? '200px' : 'auto',
        backgroundColor: bgColor || '#ffffff',
        position: 'relative',
        boxSizing: 'border-box',
        border: `2px solid ${isSelected || isHovered ? 'var(--accent)' : 'transparent'}`,
        transition: 'border-color 0.2s ease',
        marginTop: index > 0 ? '-2px' : '0px', 
        zIndex: currentZIndex, 
        cursor: 'default',
        overflow: 'visible',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={!previewMobile ? { 
        width: LOGICAL_WIDTH + 'px', 
        height: (block.height || 400) + 'px', 
        position: 'relative', 
        flexShrink: 0,
        transform: `scale(${currentScale})`, 
        transformOrigin: 'top left', // Crucial: scale from 0,0 to fill the centered parent
        pointerEvents: 'auto',
        zIndex: 1
      } : { 
        width: '100%', 
        maxWidth: '100%',
        height: '100%', 
        position: 'relative',
        zIndex: 1
      }}>
        <SectionCanvas 
          block={block}
          layers={layers.filter(l => l.blockId === block.id)}
          selectedLayerIds={selectedLayerIds}
          setSelectedLayerIds={setSelectedLayerIds}
          setLayers={setLayers}
          onSelectBlock={onClick}
          pushToHistory={pushToHistory}
          setIsDirty={setIsDirty}
          isMobile={isMobile}
          previewMobile={previewMobile}
          editingLayerId={editingLayerId}
          setEditingLayerId={setEditingLayerId}
          editorScale={editorScale}
        />
      </div>

      {isSelected && (
        <>
          <div 
            className="section-resize-hitbox"
            onMouseEnter={(e: React.MouseEvent) => { e.stopPropagation(); setIsAnchorHovered(true); }}
            onMouseLeave={(e: React.MouseEvent) => { e.stopPropagation(); setIsAnchorHovered(false); }}
            style={{
              position: 'absolute',
              bottom: '-7px',
              left: '0',
              right: '0',
              height: '14px',
              cursor: 'ns-resize',
              zIndex: 200,
              touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
          >
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '48px',
                height: '6px',
                backgroundColor: isAnchorHovered ? 'var(--accent)' : '#ffffff',
                border: `1.5px solid var(--accent)`,
                borderRadius: '20px',
                boxShadow: isAnchorHovered ? '0 0 10px rgba(var(--accent-rgb), 0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                pointerEvents: 'none' 
              }}
            />
          </div>
          <SectionToolbar 
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onColorChange={onColorChange}
            bgColor={bgColor}
            isFirst={isFirst}
            isLast={isLast}
            layout={isMobile ? 'horizontal' : 'vertical'}
          />
        </>
      )}
    </div>
  );
};

export default BuilderSection;
