import React, { useRef, useState } from 'react';
import type { Layer, CanvasProps, Block } from '../../../types/editor';
import EditableText from './EditableText';
import { sortLayersForMobile } from './EditorHelpers';

interface SectionCanvasProps {
  block: Block;
  layers: Layer[];
  selectedLayerIds: string[];
  setSelectedLayerIds: (ids: string[]) => void;
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  pushToHistory: () => void;
  setIsDirty: (val: boolean) => void;
  hoveredLayerId?: string | null;
  setHoveredLayerId?: (id: string | null) => void;
  onSelectBlock?: () => void;
  isMobile?: boolean;
  previewMobile?: boolean;
  editingLayerId: string | null;
  setEditingLayerId: (id: string | null) => void;
  editorScale?: number; // Prop per la compensazione del movimento
}

export const SectionCanvas: React.FC<SectionCanvasProps> = ({
  block, layers, selectedLayerIds, setSelectedLayerIds, setLayers, pushToHistory, setIsDirty, hoveredLayerId, setHoveredLayerId, onSelectBlock, isMobile, previewMobile, editingLayerId, setEditingLayerId,
  editorScale = 1
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [snapGuides, setSnapGuides] = useState<{axis: string, position: number}[]>([]);
  const lastClickRef = useRef({ id: null as string | null, time: 0 });

  const handleResizePointerDown = (e: React.PointerEvent, layer: Layer, position: string) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    setSelectedLayerIds([layer.id]);
    if (onSelectBlock) onSelectBlock();
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const startFontSize = layer.fontSize || 32;
    const isImage = layer.type === 'image';
    
    let startW = layer.w || 100;
    let startH = layer.h || 100;
    
    if (!layer.w || !layer.h) {
      const domNode = document.getElementById(`layer-${layer.id}`);
      if (domNode) {
        startW = layer.w || domNode.offsetWidth;
        startH = layer.h || domNode.offsetHeight;
      }
    }

    const handleResizeMove = (moveEv: PointerEvent) => {
      // COMPENSAZIONE DELLA SCALA: Dividiamo il delta per la scala corrente
      const dx = (moveEv.clientX - startX) / editorScale;
      const dy = (moveEv.clientY - startY) / editorScale;
      
      setLayers(prev => prev.map(l => {
        if (l.id !== layer.id) return l;
        
        if (isImage) {
            const ratio = startH / startW;
            let newW = startW;
            if (position.includes('e')) newW = Math.max(20, startW + dx);
            else if (position.includes('w')) newW = Math.max(20, startW - dx);
            return { ...l, w: newW, h: newW * ratio };
        } else {
            // Se usiamo le maniglie laterali (e, w) cambiamo la larghezza (wrapping)
            if (position === 'e' || position === 'w') {
                const deltaX = position === 'e' ? dx : -dx;
                const newW = Math.max(50, startW + deltaX * 2); // Moltiplicato per 2 perché centrato
                return { ...l, w: newW };
            }
            
            // Se usiamo gli angoli cambiamo il fontSize
            let delta = 0;
            if (position === 'nw') delta = (-dx - dy) / 2;
            if (position === 'ne') delta = (dx - dy) / 2;
            if (position === 'sw') delta = (-dx + dy) / 2;
            if (position === 'se') delta = (dx + dy) / 2;
            
            const newSize = Math.max(10, Math.min(200, Math.round(startFontSize + delta)));
            return { ...l, fontSize: newSize };
        }
      }));
      setIsDirty(true);
    };

    const handleResizeUp = (upEv: PointerEvent) => {
      target.releasePointerCapture(upEv.pointerId);
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeUp);
      pushToHistory();
    };

    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeUp);
  };

  const handlePointerDown = (e: React.PointerEvent, layer: Layer) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    if (onSelectBlock) onSelectBlock();
    
    // Gestione manuale doppio clic (per coerenza con editor invito e robustezza con pointer capture)
    const now = Date.now();
    const isDoubleClick = lastClickRef.current.id === layer.id && (now - lastClickRef.current.time < 300);
    lastClickRef.current = { id: layer.id, time: now };

    if (isDoubleClick && (layer.type === 'text' || !layer.type)) {
      setEditingLayerId(layer.id);
      return; 
    }

    if (editingLayerId !== layer.id) {
       setEditingLayerId(null);
    }
    
    setSelectedLayerIds([layer.id]);
    
    const startX = e.clientX;
    const startY = e.clientY;
    let initialX = typeof layer.x === 'number' && !isNaN(layer.x) ? layer.x : (containerRef.current?.clientWidth || 600) / 2;
    let initialY = typeof layer.y === 'number' && !isNaN(layer.y) ? layer.y : (containerRef.current?.clientHeight || 400) / 2;

    let dx = 0;
    let dy = 0;
    let ghostEl: HTMLElement | null = null;
    const elRect = document.getElementById(`layer-${layer.id}`)?.getBoundingClientRect();

    const handleMove = (moveEv: PointerEvent) => {
      // COMPENSAZIONE DELLA SCALA: Dividiamo il delta per la scala corrente per le coordinate LOGICHE (X, Y)
      const realDx = moveEv.clientX - startX;
      const realDy = moveEv.clientY - startY;
      dx = realDx / editorScale;
      dy = realDy / editorScale;
      
      let nx = initialX + dx;
      let ny = initialY + dy;
      
      const newGuides: {axis: string, position: number}[] = [];
      const SNAP_THRESHOLD = 5;
      
      if (containerRef.current) {
          const cw = containerRef.current.clientWidth;
          const ch = containerRef.current.clientHeight;
          
          const activeNode = document.getElementById(`layer-${layer.id}`);
          const elW = activeNode?.offsetWidth || 100;
          const elH = activeNode?.offsetHeight || 100;

          const activeLeft = nx - elW/2;
          const activeRight = nx + elW/2;
          const activeTop = ny - elH/2;
          const activeBottom = ny + elH/2;

          let snappedX = false;
          let snappedY = false;

          // Snap al Centro Canvas
          if (Math.abs(nx - cw/2) < SNAP_THRESHOLD) { nx = cw/2; newGuides.push({axis: 'x', position: cw/2}); snappedX = true; }
          if (Math.abs(ny - ch/2) < SNAP_THRESHOLD) { ny = ch/2; newGuides.push({axis: 'y', position: ch/2}); snappedY = true; }
          
          layers.forEach(otherL => {
             if (otherL.id === layer.id) return;
             const otherNode = document.getElementById(`layer-${otherL.id}`);
             const oW = otherNode?.offsetWidth || 100;
             const oH = otherNode?.offsetHeight || 100;
             const ox = typeof otherL.x === 'number' ? otherL.x : cw/2;
             const oy = typeof otherL.y === 'number' ? otherL.y : ch/2;
             
             const otherLeft = ox - oW/2;
             const otherRight = ox + oW/2;
             const otherTop = oy - oH/2;
             const otherBottom = oy + oH/2;

             if (!snappedX) {
                if (Math.abs(nx - ox) < SNAP_THRESHOLD) { nx = ox; newGuides.push({axis: 'x', position: ox}); snappedX = true; }
                else if (Math.abs(activeLeft - otherLeft) < SNAP_THRESHOLD) { nx = otherLeft + elW/2; newGuides.push({axis: 'x', position: otherLeft}); snappedX = true; }
                else if (Math.abs(activeRight - otherRight) < SNAP_THRESHOLD) { nx = otherRight - elW/2; newGuides.push({axis: 'x', position: otherRight}); snappedX = true; }
                else if (Math.abs(activeLeft - otherRight) < SNAP_THRESHOLD) { nx = otherRight + elW/2; newGuides.push({axis: 'x', position: otherRight}); snappedX = true; }
                else if (Math.abs(activeRight - otherLeft) < SNAP_THRESHOLD) { nx = otherLeft - elW/2; newGuides.push({axis: 'x', position: otherLeft}); snappedX = true; }
             }

             if (!snappedY) {
                if (Math.abs(ny - oy) < SNAP_THRESHOLD) { ny = oy; newGuides.push({axis: 'y', position: oy}); snappedY = true; }
                else if (Math.abs(activeTop - otherTop) < SNAP_THRESHOLD) { ny = otherTop + elH/2; newGuides.push({axis: 'y', position: otherTop}); snappedY = true; }
                else if (Math.abs(activeBottom - otherBottom) < SNAP_THRESHOLD) { ny = otherBottom - elH/2; newGuides.push({axis: 'y', position: otherBottom}); snappedY = true; }
                else if (Math.abs(activeTop - otherBottom) < SNAP_THRESHOLD) { ny = otherBottom + elH/2; newGuides.push({axis: 'y', position: otherBottom}); snappedY = true; }
                else if (Math.abs(activeBottom - otherTop) < SNAP_THRESHOLD) { ny = otherTop - elH/2; newGuides.push({axis: 'y', position: otherTop}); snappedY = true; }
             }
          });
      }
      setSnapGuides(newGuides);
      
      setLayers(prev => prev.map(l => 
        l.id === layer.id ? { ...l, x: nx, y: ny } : l
      ));
      setIsDirty(true);
      
      if (containerRef.current) {
         const containerRect = containerRef.current.getBoundingClientRect();
         // Check if pointer is outside current canvas
         const isOutside = 
            moveEv.clientY < containerRect.top || moveEv.clientY > containerRect.bottom ||
            moveEv.clientX < containerRect.left || moveEv.clientX > containerRect.right;
            
         if (isOutside) {
            if (!ghostEl && elRect) {
               ghostEl = document.createElement('div');
               ghostEl.style.position = 'fixed';
               ghostEl.style.border = '2px solid var(--accent)';
               ghostEl.style.width = elRect.width + 'px';
               ghostEl.style.height = elRect.height + 'px';
               ghostEl.style.pointerEvents = 'none';
               ghostEl.style.zIndex = '99999';
               ghostEl.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
               ghostEl.style.backdropFilter = 'blur(2px)';
               document.body.appendChild(ghostEl);
            }
            if (ghostEl && elRect) {
               // Per il GHOST visivo (fixed) usiamo lo spostamento REALE (non scalato)
               ghostEl.style.left = (elRect.left + realDx) + 'px';
               ghostEl.style.top = (elRect.top + realDy) + 'px';
            }
         } else {
            if (ghostEl) {
               ghostEl.remove();
               ghostEl = null;
            }
         }
      }
    };

    const handleUp = (upEv: PointerEvent) => {
      target.releasePointerCapture(upEv.pointerId);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      
      if (ghostEl) {
         ghostEl.remove();
         ghostEl = null;
      }
      setSnapGuides([]);
      
      const elements = document.elementsFromPoint(upEv.clientX, upEv.clientY);
      const targetBlockEl = elements.find(el => el.getAttribute('data-block-id'));
      
      if (targetBlockEl && containerRef.current) {
        const newBlockId = targetBlockEl.getAttribute('data-block-id');
        if (newBlockId && newBlockId !== block.id) {
           const oldRect = containerRef.current.getBoundingClientRect();
           const newRect = targetBlockEl.getBoundingClientRect();
           
           // Trova il centro reale in pixel dello schermo
           const vCenterY = oldRect.top + (initialY + dy) * editorScale;
           const vCenterX = oldRect.left + (initialX + dx) * editorScale;
           
           // Converti in coordinate logiche della nuova sezione
           const newY = (vCenterY - newRect.top) / editorScale;
           const newX = (vCenterX - newRect.left) / editorScale;
           
           setLayers(prev => prev.map(l => 
             l.id === layer.id ? { ...l, x: newX, y: newY, blockId: newBlockId } : l
           ));
           
           // Select the new block visually
           (targetBlockEl as HTMLElement).click();
        }
      }

      pushToHistory();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  if (previewMobile) {
    const sortedLayers = sortLayersForMobile(layers);
    return (
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: 'auto', 
          minHeight: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '30px', 
          padding: '40px 20px',
          boxSizing: 'border-box',
          backgroundColor: block.props?.bgColor || 'transparent'
        }}
        onClick={() => setSelectedLayerIds([])}
      >
        {sortedLayers.map(layer => {
          const isSelected = selectedLayerIds.includes(layer.id);
          const isText = layer.type === 'text' || !layer.type;
          
          return (
            <div 
              key={layer.id}
              id={`layer-${layer.id}`}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px', // Limite ragionevole per non spanciare su tablet in verticale
                margin: '0 auto',
                fontSize: Math.round((layer.fontSize || 24) * 1.25) + 'px', // Ingrandimento testi Canva-style
                fontFamily: layer.fontFamily,
                fontWeight: layer.fontWeight || "normal",
                fontStyle: layer.fontStyle || "normal",
                textDecoration: layer.textDecoration || "none",
                letterSpacing: (layer.letterSpacing || 0) + 'px',
                lineHeight: layer.lineHeight || 1.3,
                color: layer.color,
                textAlign: layer.textAlign || 'center',
                zIndex: isSelected ? 10 : layer.z || 1,
                opacity: layer.opacity !== undefined ? layer.opacity : 1,
                border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                borderRadius: '4px',
                padding: '4px',
                touchAction: 'none'
              }}
              onPointerDown={(e) => handlePointerDown(e, layer)}
              onClick={(e) => e.stopPropagation()}
            >
              {isText ? (
                <EditableText
                  id={`layer-content-${layer.id}`}
                  className="layer-content"
                  text={layer.text || ""}
                  isEditing={editingLayerId === layer.id}
                  onSync={(newHtml) => {
                    setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, text: newHtml } : l));
                    setIsDirty(true);
                  }}
                  onBlur={(newHtml) => {
                    pushToHistory();
                  }}
                  onFocus={() => {
                    setEditingLayerId(layer.id);
                    setSelectedLayerIds([layer.id]);
                  }}
                />
              ) : (
                <img 
                  src={layer.src} 
                  alt="" 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    display: 'block', 
                    objectFit: 'contain',
                    borderRadius: '8px' // Un tocco più moderno per le immagini a tutto schermo
                  }} 
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} onClick={(e) => {
      // Click on empty space inside section - let it bubble up to Select the Block
      setSelectedLayerIds([]);
    }}>
      {layers.map(layer => {
        const isSelected = selectedLayerIds.includes(layer.id);
        const isText = layer.type === 'text' || !layer.type;
        const lx = typeof layer.x === 'number' ? layer.x + 'px' : '50%';
        const ly = typeof layer.y === 'number' ? layer.y + 'px' : '50%';

        return (
          <div 
            key={layer.id}
            id={`layer-${layer.id}`}
            style={{
              position: 'absolute',
              left: lx,
              top: ly,
              transform: 'translate(-50%, -50%)',
              width: layer.w ? layer.w + 'px' : 'max-content',
              fontSize: (layer.fontSize || 32) + 'px',
              fontFamily: layer.fontFamily,
              fontWeight: layer.fontWeight || "normal",
              fontStyle: layer.fontStyle || "normal",
              textDecoration: layer.textDecoration || "none",
              letterSpacing: (layer.letterSpacing || 0) + 'px',
              lineHeight: layer.lineHeight || 1.2,
              color: layer.color,
              textAlign: layer.textAlign,
              zIndex: isSelected ? 10 : layer.z || 1,
              padding: '2px 4px',
              opacity: layer.opacity !== undefined ? layer.opacity : 1,
              userSelect: editingLayerId === layer.id ? 'auto' : 'none',
              touchAction: 'none'
            }}
            onPointerDown={(e) => handlePointerDown(e, layer)}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setHoveredLayerId && setHoveredLayerId(layer.id)}
            onMouseLeave={() => setHoveredLayerId && setHoveredLayerId(null)}
          >
            {hoveredLayerId === layer.id && <div style={{ position: 'absolute', inset: -4, border: '2px solid #FF007F', pointerEvents: 'none', zIndex: 101, borderRadius: '4px', boxShadow: '0 0 10px rgba(255, 0, 127, 0.3)' }} />}
            
            {isText ? (
              <EditableText
                id={`layer-content-${layer.id}`}
                className="layer-content"
                text={layer.text || ""}
                isEditing={editingLayerId === layer.id}
                onSync={(val) => {
                  setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, text: val } : l));
                  setIsDirty(true);
                }}
                onBlur={(val) => {
                  let updatedText = val;
                  if (!updatedText || updatedText === "<br>") updatedText = "Testo Vuoto";
                  setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, text: updatedText } : l));
                  setIsDirty(true);
                  setEditingLayerId(null);
                }}
                onFocus={() => pushToHistory()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingLayerId(layer.id);
                }}
                onPointerDown={(e) => {
                  if (editingLayerId === layer.id) e.stopPropagation();
                }}
                style={{
                  outline: "none",
                  minWidth: "20px",
                  minHeight: "1em",
                  cursor: editingLayerId === layer.id ? "text" : (isSelected ? "grab" : "pointer"),
                  userSelect: editingLayerId === layer.id ? "auto" : "none",
                  whiteSpace: "pre-wrap",
                  width: '100%',
                  wordBreak: 'break-word',
                  paddingBottom: "0.15em",
                  padding: "8px"
                }}
              />
            ) : (
              <img src={layer.src} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} alt="" />
            )}
            
            {isSelected && (
               <>
                 <div className="layer-outline" style={{ 
                    border: '1.5px solid var(--accent)', 
                    position: 'absolute', 
                    inset: '-4px', 
                    pointerEvents: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 0 10px rgba(var(--accent-rgb), 0.2)'
                 }}></div>
                 
                 {/* Maniglie Angolari (Cerchi) */}
                 {['NW', 'NE', 'SW', 'SE'].map(pos => (
                    <div 
                      key={pos} 
                      onPointerDown={(e) => handleResizePointerDown(e, layer, pos.toLowerCase())} 
                      style={{ 
                        position: 'absolute', 
                        width: '12px', 
                        height: '12px', 
                        background: '#fff', 
                        border: '1.5px solid var(--accent)', 
                        borderRadius: '50%', 
                        top: pos.includes('N') ? '-10px' : 'auto', 
                        bottom: pos.includes('S') ? '-10px' : 'auto', 
                        left: pos.includes('W') ? '-10px' : 'auto', 
                        right: pos.includes('E') ? '-10px' : 'auto', 
                        cursor: pos === 'NW' || pos === 'SE' ? 'nwse-resize' : 'nesw-resize', 
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }} 
                    />
                 ))}

                 {/* Maniglie Laterali (Pillole) per il wrapping */}
                 {isText && ['E', 'W'].map(pos => (
                    <div 
                      key={pos} 
                      onPointerDown={(e) => handleResizePointerDown(e, layer, pos.toLowerCase())} 
                      style={{ 
                        position: 'absolute', 
                        width: '6px', 
                        height: '18px', 
                        background: '#fff', 
                        border: '1.5px solid var(--accent)', 
                        borderRadius: '10px', 
                        top: '50%',
                        transform: 'translateY(-50%)',
                        left: pos === 'W' ? '-7px' : 'auto', 
                        right: pos === 'E' ? '-7px' : 'auto', 
                        cursor: 'ew-resize', 
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        pointerEvents: 'auto'
                      }} 
                    />
                 ))}
               </>
            )}
          </div>
        );
      })}
      {snapGuides.map((guide, i) => {
        if (guide.axis === 'x') return <div key={`gx_${i}`} style={{position: 'absolute', top: 0, bottom: 0, left: guide.position + 'px', width: '1px', background: '#FF007F', zIndex: 99, pointerEvents: 'none'}} />;
        if (guide.axis === 'y') return <div key={`gy_${i}`} style={{position: 'absolute', left: 0, right: 0, top: guide.position + 'px', height: '1px', background: '#FF007F', zIndex: 99, pointerEvents: 'none'}} />;
        return null;
      })}
    </div>
  );
};
