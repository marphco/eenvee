import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { getAdaptivePalette } from '../../../../utils/colorUtils';

interface MapWidgetProps {
  address?: string | undefined;
  title?: string | undefined;
  zoom?: number | undefined;
  style?: {
    borderRadius?: string;
    border?: string;
    boxShadow?: string;
  };
  previewMobile?: boolean;
  /**
   * Sfondo effettivo della sezione — serve per calcolare l'adaptive palette.
   * Se non passato il widget assume sfondo chiaro (testo scuro).
   */
  sectionBg?: string | null;
  accentColor?: string;
}

const MapWidget: React.FC<MapWidgetProps> = ({
  address = "Piazza del Duomo, Milano",
  title = "Come Arrivare",
  zoom = 15,
  style = {},
  previewMobile = false,
  sectionBg,
  accentColor = 'var(--accent)'
}) => {
  const encodedAddress = encodeURIComponent(address);
  const fallbackUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  // Palette adattiva: sezione scura → testo bianco; sezione chiara → testo nero.
  // Accent resta sempre quello del tema (non lo tocchiamo, è un "brand constraint").
  const palette = getAdaptivePalette(sectionBg, accentColor);

  return (
    <div className="map-widget-wrapper" style={{
      width: '100%',
      padding: previewMobile ? '10px' : '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      boxSizing: 'border-box',
      color: palette.text
    }}>
      {/* Title & Address Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{
          margin: 0,
          fontSize: previewMobile ? '18px' : '22px',
          fontWeight: 700,
          color: palette.text,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MapPin size={previewMobile ? 18 : 22} color={accentColor} />
          {title}
        </h3>
        <p style={{
          margin: 0,
          fontSize: previewMobile ? '13px' : '14px',
          color: palette.textSoft,
        }}>
          {address}
        </p>
      </div>

      {/* Map Container */}
      <div className="map-widget-container" style={{
        width: '100%',
        height: previewMobile ? '280px' : '360px',
        borderRadius: style.borderRadius || '16px',
        overflow: 'hidden',
        border: style.border || `1px solid ${palette.border}`,
        boxShadow: style.boxShadow || '0 10px 30px rgba(0,0,0,0.08)',
        position: 'relative'
      }}>
        <iframe
          title="Event Location"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          src={fallbackUrl}
          allowFullScreen
        />

        {/* Overlay for editor selection interaction */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: 'none'
        }} />
      </div>

      {/* Action Button — bg/bordo ricavati DINAMICAMENTE dall'accent passato,
          non da `--accent-rgb` hardcoded (che ignorava il color picker utente).
          Su hex a 6 char possiamo concatenare suffisso alpha: `#14b8a61A` = 10%.
          Per valori non-hex (CSS var) fallback su rgba con --accent-rgb. */}
      {(() => {
        const isHex = /^#[0-9a-fA-F]{6}$/.test(accentColor);
        const bgLight = isHex ? `${accentColor}1A` : 'rgba(var(--accent-rgb), 0.1)';
        const borderLight = isHex ? `${accentColor}40` : 'rgba(var(--accent-rgb), 0.25)';
        return (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '100px',
              background: palette.isDark ? 'rgba(255,255,255,0.1)' : bgLight,
              color: palette.isDark ? '#ffffff' : accentColor,
              fontSize: '14px',
              fontWeight: 600,
              border: `1px solid ${palette.isDark ? 'rgba(255,255,255,0.25)' : borderLight}`,
              transition: 'all 0.2s ease'
            }}
          >
            <ExternalLink size={16} />
            Apri su Google Maps
          </a>
        );
      })()}
    </div>
  );
};

export default MapWidget;
