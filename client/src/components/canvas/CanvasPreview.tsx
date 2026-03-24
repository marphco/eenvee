import React, { useEffect } from "react";
import type { Layer, CanvasProps } from "../../types/editor";

const loadGoogleFont = (fontFamily: string) => {
  if (!fontFamily) return;
  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(fontId)) return;
  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

interface CanvasPreviewProps {
  canvas: CanvasProps;
  layers: Layer[];
}

export default function CanvasPreview({ canvas, layers }: CanvasPreviewProps) {
  useEffect(() => {
    (layers || []).forEach(l => {
      if (l.fontFamily) loadGoogleFont(l.fontFamily);
    });
  }, [layers]);

  if (!canvas) return null;
  
  // Fallback to 800x1000 if not specified
  const width = canvas.width || 800;
  const height = canvas.height || 1000;

  return (
    <div style={{ 
      containerType: "inline-size", 
      width: "100%", 
      aspectRatio: `${width} / ${height}`,
      backgroundImage: canvas.bgImage ? `url(${canvas.bgImage})` : 'none',
      backgroundColor: canvas.bgImage ? 'transparent' : '#fff',
      backgroundSize: "cover",
      backgroundPosition: "center",
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-md) var(--radius-md) 0 0"
    } as React.CSSProperties}>
      {(layers || []).map(layer => {
        const lWidth = layer.width || layer.w;
        const isMaxContent = lWidth === 'max-content';
        const layerX = layer.x === 'center' ? '50%' : `${((layer.x as number) / width) * 100}%`;
        const layerY = layer.y === 'center' ? '50%' : `${((layer.y as number) / height) * 100}%`;
        
        return (
          <div key={layer.id} style={{
            position: "absolute",
            left: layerX,
            top: layerY,
            transform: 'translate(-50%, -50%)',
            width: isMaxContent ? 'max-content' : `${((lWidth as number) / width) * 100}%`,
            fontSize: `${((layer.fontSize || 32) / width) * 100}cqi`,
            fontFamily: layer.fontFamily,
            fontWeight: layer.fontWeight || "normal",
            fontStyle: layer.fontStyle || "normal",
            textDecoration: layer.textDecoration || "none",
            letterSpacing: `${(layer.letterSpacing || 0) / width * 100}cqi`,
            lineHeight: layer.lineHeight || 1.2,
            color: layer.color,
            textAlign: layer.textAlign,
            whiteSpace: isMaxContent ? 'nowrap' : 'pre-wrap',
          } as React.CSSProperties}>
            {layer.text}
          </div>
        );
      })}
    </div>
  );
}
