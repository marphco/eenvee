import React from 'react';
import EnvelopeAnimation from './envelope/EnvelopeAnimation';
import ReadOnlyCanvas from './canvas/ReadOnlyCanvas';

interface ScenarioThumbnailProps {
  canvas: any;
  layers: any[];
  theme: any;
  scale?: number;
}

const ScenarioThumbnail: React.FC<ScenarioThumbnailProps> = ({ canvas, layers, theme, scale = 0.12 }) => {
  const envFormat = theme?.envelopeFormat || 'vertical';
  const baseW = envFormat === 'horizontal' ? 600 : 500;
  const envScenarioScale = (canvas?.width * 1.02) / baseW;

  return (
    <div className="scenario-thumbnail" style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'center center',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        width: '1px', // Trick per evitare che il flex container si espanda troppo
        height: '1px'
      }}>
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '-40px'
        }}>
          {/* Invito */}
          <div style={{ 
            position: 'relative', 
            zIndex: 10, 
            width: canvas?.width || 800, 
            height: canvas?.height || 1000, 
            boxShadow: '0 15px 50px rgba(0,0,0,0.15)',
            borderRadius: '4px',
            background: canvas?.bgColor || '#fff',
            flexShrink: 0
          }}>
            <ReadOnlyCanvas layers={layers} canvasProps={canvas} />
          </div>

          {/* Busta */}
          <div style={{ 
            position: 'relative', 
            zIndex: 5, 
            transform: `translateX(-28%) translateY(15%)`,
            flexShrink: 0
          }}>
            <EnvelopeAnimation 
              envelopeFormat={envFormat}
              envelopeColor={theme?.coverBg || '#54392d'}
              linerImg={theme?.coverLiner === 'none' ? null : (theme?.coverLiner || null)}
              pocketColor={theme?.coverPocketColor || theme?.coverBg || '#54392d'}
              pocketLinerImg={theme?.coverPocketLiner}
              linerX={theme?.linerX || 0}
              linerY={theme?.linerY || 0}
              linerScale={theme?.linerScale || 1}
              linerOpacity={theme?.linerOpacity ?? 1}
              linerColor={theme?.coverLinerColor || '#ffffff'}
              canvasProps={canvas}
              manualPhase="extracted"
              preview={true}
              isBuilder={true}
              scale={envScenarioScale}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioThumbnail;
