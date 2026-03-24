import React, { useState } from 'react';
import type { Block } from '../../../types/editor';

interface BuilderSectionProps {
  block: Block;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onHeightChange: (height: number) => void;
  onHeightChangeComplete?: () => void;
}

const BuilderSection: React.FC<BuilderSectionProps> = ({ 
  block, 
  index, 
  isSelected, 
  onClick, 
  onHeightChange, 
  onHeightChangeComplete 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnchorHovered, setIsAnchorHovered] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId); // Crucial for reliable dragging
    
    const startY = e.clientY;
    const initHeight = block.height || 400;

    const handleMove = (moveEv: PointerEvent) => {
      const dy = moveEv.clientY - startY;
      onHeightChange(Math.max(100, initHeight + dy));
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

  return (
    <div 
      className={`builder-section-item ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: '100%',
        height: (block.height || 400) + 'px',
        backgroundColor: block.bgColor || '#ffffff',
        position: 'relative',
        boxSizing: 'border-box',
        border: `2px solid ${isSelected || isHovered ? 'var(--accent)' : 'transparent'}`,
        transition: 'border-color 0.2s ease',
        marginTop: index > 0 ? '-2px' : '0px', // elimina il doppio bordo tra blocchi
        zIndex: currentZIndex, 
        cursor: 'default',
        overflow: 'visible'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contenitore interno per futuri widget (Testi, Immagini) */}
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Futura renderizzazione items */}
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
              width: '100%',
              height: '14px',
              cursor: 'ns-resize',
              zIndex: 200,
              touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
          >
            {/* Maniglia Visiva Pillola (Canva Style) */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '42px',
                height: '8px',
                backgroundColor: isAnchorHovered ? 'var(--accent)' : '#ffffff',
                border: `1.5px solid var(--accent)`,
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                pointerEvents: 'none' 
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BuilderSection;
