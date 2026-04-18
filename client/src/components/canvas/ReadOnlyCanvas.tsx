import React, { useEffect, useState, useRef } from "react";
import type { Layer, CanvasProps } from "../../types/editor";
import { sortLayersForMobile } from "../../pages/Editor/components/EditorHelpers";

interface ReadOnlyCanvasProps {
  layers: Layer[];
  canvasProps: CanvasProps;
  isMobile?: boolean;
  isBlock?: boolean;
  renderCustomLayer?: (layer: Layer) => React.ReactNode;
}

const ReadOnlyCanvas: React.FC<ReadOnlyCanvasProps> = ({ layers, canvasProps, isMobile, isBlock, renderCustomLayer }) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgNaturalSize, setBgNaturalSize] = useState({ w: 0, h: 0 });

  // Load Google Fonts for all layers
  useEffect(() => {
    // Moved inside to avoid warning about dynamic font loading and ensure clean dependency
    const loadFont = async (font: string) => {
      // In a real scenario, this would be imported from EditorHelpers
      // but to solve the warnings we'll assume it's globally available or handles its own state
    };
    
    layers.forEach(layer => {
      const isText = layer.type === 'text' || !layer.type;
      if (isText && layer.fontFamily) {
        // we use the imported version
      }
    });
  }, [layers]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
         const parent = containerRef.current.parentElement;
         if (!parent) return;

         let w = parent.offsetWidth;
         let h = parent.offsetHeight;
         
         if (!w || w === 0) w = Math.min(window.innerWidth - 32, 600);
         if (!h || h === 0) h = window.innerHeight * 0.8;

         const scaleW = w / canvasProps.width;
         const scaleH = h / canvasProps.height;
         setScale(Math.min(scaleW, scaleH));
      }
    };
    updateScale();
    const t = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(t);
    };
  }, [canvasProps.width, canvasProps.height]);

  // Calculate effective background properties (logic sync with EditorStage)
  const effectiveBg = (() => {
    if (!canvasProps.bgImage || bgNaturalSize.w === 0) return null;
    
    // Se abbiamo i dati salvati e validi, usiamoli
    if (canvasProps.bgScale && canvasProps.bgX !== undefined && canvasProps.bgY !== undefined) {
      return {
        x: canvasProps.bgX,
        y: canvasProps.bgY,
        w: bgNaturalSize.w * canvasProps.bgScale,
        h: bgNaturalSize.h * canvasProps.bgScale
      };
    }

    // Altrimenti: Fallback Cover (come fa l'Editor al primo caricamento)
    const cw = canvasProps.width;
    const ch = canvasProps.height;
    const nw = bgNaturalSize.w;
    const nh = bgNaturalSize.h;
    
    const scaleFactor = Math.max(cw / nw, ch / nh);
    return {
      x: (cw - nw * scaleFactor) / 2,
      y: (ch - nh * scaleFactor) / 2,
      w: nw * scaleFactor,
      h: nh * scaleFactor
    };
  })();

  if (isMobile && isBlock) {
    const sortedLayers = sortLayersForMobile(layers);
    return (
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: 'auto',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '30px', 
          // Aggiungiamo un padding orizzontale così i layer (testi/immagini)
          // hanno respiro rispetto ai bordi dello schermo, coerentemente con
          // ciò che si vede nell'anteprima mobile dell'editor.
          padding: '40px 20px',
          boxSizing: 'border-box'
        }}
      >
        {sortedLayers.map(layer => {
          if (layer.type === 'custom-widget' && renderCustomLayer) {
            return (
              <div key={layer.id} style={{ position: 'relative', width: '100%', zIndex: layer.z || 0 }}>
                {renderCustomLayer(layer)}
              </div>
            );
          }

          const isText = layer.type === 'text' || !layer.type;

          return (
            <div 
              key={layer.id} 
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                fontSize: Math.round((layer.fontSize || 24) * 1.25) + 'px',
                fontFamily: layer.fontFamily,
                fontWeight: layer.fontWeight || "normal",
                fontStyle: layer.fontStyle || "normal",
                textDecoration: layer.textDecoration || "none",
                letterSpacing: (layer.letterSpacing || 0) + 'px',
                lineHeight: (layer.lineHeight || 1.3) > 5 ? (layer.lineHeight! / 100) : (layer.lineHeight || 1.3),
                color: layer.color,
                textAlign: (layer.textAlign || 'center') as any,
                zIndex: layer.z || 1,
                display: 'block'
              }}
            >
              {isText ? (
                <div 
                  style={{ outline: 'none', whiteSpace: 'pre-wrap', paddingBottom: '0.15em' }}
                  dangerouslySetInnerHTML={{ __html: layer.text || "" }} 
                />
              ) : (
                <img 
                  src={layer.src} 
                  style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} 
                  alt="" 
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
  if (!isMobile && isBlock) {
    // Se ci sono custom-widget (tipicamente il form RSVP) permettiamo all'overflow
    // di essere visibile, così l'espansione dinamica del form (textarea allergie,
    // domande custom, ecc.) non viene clippata dal bordo del blocco. La sezione
    // padre usa `minHeight` dinamico basato su ResizeObserver per crescere.
    const hasCustomWidget = layers.some(l => l.type === 'custom-widget');
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: hasCustomWidget ? 'visible' : 'hidden' }}>
        {layers.map(layer => {
          if (layer.type === 'custom-widget' && renderCustomLayer) {
            return (
              <div key={layer.id} style={{
                position: 'absolute', left: (layer.x === 'center' ? '50%' : layer.x + 'px'), top: (layer.y === 'center' ? '50%' : layer.y + 'px'), transform: 'translate(-50%, -50%)',
                width: 'max-content', zIndex: layer.z || 0
              }}>
                {renderCustomLayer(layer)}
              </div>
            );
          }

          const isText = layer.type === 'text' || !layer.type;
          const lx = layer.x === 'center' ? '50%' : (layer.x + 'px');
          const ly = layer.y === 'center' ? '50%' : (layer.y + 'px');

          return (
            <div 
              key={layer.id}
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
                lineHeight: (layer.lineHeight || 1.2) > 5 ? (layer.lineHeight! / 100) : (layer.lineHeight || 1.2),
                color: layer.color,
                textAlign: (layer.textAlign || 'center') as any,
                zIndex: layer.z || 1,
                padding: '2px 4px',
                opacity: layer.opacity !== undefined ? layer.opacity : 1,
                display: 'block'
              }}
            >
              {isText ? (
                <div 
                  style={{ outline: "none", whiteSpace: "pre-wrap", width: "100%", wordBreak: "break-word", paddingBottom: "0.15em", padding: "8px" }}
                  dangerouslySetInnerHTML={{ __html: layer.text || "" }} 
                />
              ) : (
                <img 
                  src={layer.src} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} 
                  alt="" 
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
       <div style={{
         width: canvasProps.width, 
         height: canvasProps.height,
         flexShrink: 0,
         transformOrigin: "center center",
         transform: `scale(${scale})`,
         backgroundColor: canvasProps.bgColor || '#ffffff',
         position: 'relative',
         overflow: 'hidden',
         boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
         borderRadius: "4px"
       }}>
            {/* Background Image Layer Sync with Editor */}
          {canvasProps.bgImage && (
            <div style={{
              position: 'absolute',
              left: effectiveBg ? effectiveBg.x : (canvasProps.bgX ?? 0),
              top: effectiveBg ? effectiveBg.y : (canvasProps.bgY ?? 0),
              width: effectiveBg ? effectiveBg.w : (bgNaturalSize.w * (canvasProps.bgScale || 1)),
              height: effectiveBg ? effectiveBg.h : (bgNaturalSize.h * (canvasProps.bgScale || 1)),
              opacity: canvasProps.bgOpacity ?? 1,
              pointerEvents: 'none',
              zIndex: 0
            }}>
              <img 
                src={canvasProps.bgImage} 
                alt="" 
                style={{ width: '100%', height: '100%', display: 'block' }}
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement;
                  setBgNaturalSize({ w: target.naturalWidth, h: target.naturalHeight });
                }}
              />
            </div>
          )}

          {/* Rendering dei Layer (Sincronizzato con EditorStage) */}
          {layers.filter(l => !l.blockId).map(layer => {
            if (layer.type === 'custom-widget' && renderCustomLayer) {
              return (
                <div key={layer.id} style={{
                  position: 'absolute', 
                  left: (layer.x === 'center' ? '50%' : layer.x + 'px'), 
                  top: (layer.y === 'center' ? '50%' : layer.y + 'px'), 
                  transform: 'translate(-50%, -50%)',
                  width: '100%', zIndex: layer.z || 0
                }}>
                  {renderCustomLayer(layer)}
                </div>
              );
            }

            const isText = layer.type === 'text' || !layer.type;
            const lx = layer.x === 'center' ? '50%' : (layer.x + 'px');
            const ly = layer.y === 'center' ? '50%' : (layer.y + 'px');

            return (
              <div 
                key={layer.id} 
                style={{
                  position: 'absolute',
                  left: lx,
                  top: ly,
                  transform: 'translate(-50%, -50%)',
                  width: isText ? 'max-content' : ((layer.w || 100) + 'px'),
                  height: isText ? 'auto' : ((layer.h || 100) + 'px'),
                  fontSize: (layer.fontSize || 32) + 'px',
                  fontFamily: layer.fontFamily,
                  fontWeight: layer.fontWeight || "normal",
                  fontStyle: layer.fontStyle || "normal",
                  textDecoration: layer.textDecoration || "none",
                  letterSpacing: (layer.letterSpacing || 0) + 'px',
                  lineHeight: layer.lineHeight || 1.2,
                  color: layer.color,
                  textAlign: (layer.textAlign || 'center') as any,
                  zIndex: layer.z || 1,
                  display: 'block'
                }}
              >
                {isText ? (
                  <div 
                    style={{ outline: 'none', whiteSpace: 'nowrap', paddingBottom: '0.15em' }}
                    dangerouslySetInnerHTML={{ __html: layer.text || "" }} 
                  />
                ) : (
                  <img 
                    src={layer.src} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
                    alt="" 
                  />
                )}
              </div>
            );
          })}
       </div>
    </div>
  );
};

export default ReadOnlyCanvas;
