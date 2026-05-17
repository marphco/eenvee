import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { getAdaptivePalette } from '../../../../utils/colorUtils';

/**
 * Singola istanza di mappa — l'utente può averne più di una nella stessa
 * sezione (es. Chiesa + Ricevimento) renderizzate affiancate desktop /
 * impilate mobile.
 */
export interface MapEntry {
  id: string;
  title?: string;
  description?: string;
  address?: string;
  zoom?: number;
}

interface MapWidgetProps {
  /**
   * Array di mappe. Se assente o vuoto, viene derivato un singolo entry
   * da `address/title/description/zoom` (back-compat con block.props legacy).
   */
  maps?: MapEntry[] | undefined;
  // Back-compat: campi singola-mappa
  address?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  zoom?: number | undefined;
  style?: {
    borderRadius?: string;
    border?: string;
    boxShadow?: string;
  };
  previewMobile?: boolean;
  sectionBg?: string | null;
  accentColor?: string;
}

const DEFAULT_TITLE = 'Come Arrivare';
const DEFAULT_DESCRIPTION = 'Trova facilmente il luogo dell\'evento con la mappa qui sotto.';

/**
 * Card singola mappa. Estratta per riusarla nel rendering multi-mappa
 * (grid desktop / stack mobile) senza duplicare il markup.
 */
const MapCard: React.FC<{
  entry: MapEntry;
  palette: ReturnType<typeof getAdaptivePalette>;
  accentColor: string;
  previewMobile: boolean;
  style: NonNullable<MapWidgetProps['style']>;
  /** True se affiancata ad altre mappe (riduce padding/dimensioni). */
  compact?: boolean;
}> = ({ entry, palette, accentColor, previewMobile, style, compact }) => {
  const rawAddress = typeof entry.address === 'string' ? entry.address.trim() : '';
  const hasAddress = rawAddress.length > 0;
  const zoom = entry.zoom ?? 15;
  const encodedAddress = encodeURIComponent(rawAddress);
  const fallbackUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=${zoom}&hl=it&ie=UTF8&iwloc=&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  const cardBg = palette.isDark
    ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
    : '#ffffff';
  const cardBorder = palette.isDark ? 'rgba(255,255,255,0.22)' : palette.border;
  const cardShadow = palette.isDark
    ? '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)'
    : '0 4px 20px rgba(0,0,0,0.06)';
  const cardPadding = previewMobile
    ? '24px 20px'
    : compact
      ? '24px 24px'
      : '32px';
  const mapHeight = previewMobile ? '240px' : compact ? '260px' : '320px';

  const isHex = /^#[0-9a-fA-F]{6}$/.test(accentColor);
  const bgLight = isHex ? `${accentColor}1A` : 'rgba(var(--accent-rgb), 0.1)';
  const borderLight = isHex ? `${accentColor}40` : 'rgba(var(--accent-rgb), 0.25)';

  return (
    <div style={{
      width: '100%',
      padding: cardPadding,
      borderRadius: '20px',
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      boxShadow: cardShadow,
      color: palette.text,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
        <div style={{
          width: '52px', height: '52px',
          borderRadius: '14px',
          background: `${accentColor}1A`,
          border: `1px solid ${accentColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MapPin size={24} color={accentColor} />
        </div>
        <div style={{
          fontSize: previewMobile ? '20px' : compact ? '22px' : '24px',
          fontWeight: 700,
          fontFamily: 'var(--font-heading, serif)',
          lineHeight: 1.2,
        }}>
          {entry.title || DEFAULT_TITLE}
        </div>
        <div style={{ fontSize: '14px', color: palette.textSoft, lineHeight: 1.6, maxWidth: '480px' }}>
          {entry.description || DEFAULT_DESCRIPTION}
        </div>
      </div>

      {hasAddress && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: palette.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${palette.border}`,
          fontSize: '13px',
          color: palette.text,
        }}>
          <MapPin size={14} color={accentColor} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rawAddress}
          </span>
        </div>
      )}

      <div style={{
        width: '100%',
        height: mapHeight,
        borderRadius: style.borderRadius || '14px',
        overflow: 'hidden',
        border: style.border || `1px solid ${palette.border}`,
        position: 'relative',
        background: palette.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
      }}>
        {hasAddress ? (
          <>
            <iframe
              title={entry.title || DEFAULT_TITLE}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              src={fallbackUrl}
              allowFullScreen
            />
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 1,
              pointerEvents: 'none'
            }} />
          </>
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '20px 16px',
            textAlign: 'center',
            fontSize: previewMobile ? '13px' : '14px',
            lineHeight: 1.5,
            color: palette.textSoft,
          }}>
            <MapPin size={28} color={accentColor} style={{ opacity: 0.5 }} />
            <span>Inserisci un indirizzo nella sidebar per mostrare la mappa.</span>
          </div>
        )}
      </div>

      {hasAddress && (
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
            padding: '14px',
            borderRadius: '999px',
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
      )}
    </div>
  );
};

const MapWidget: React.FC<MapWidgetProps> = ({
  maps,
  address = '',
  title,
  description,
  zoom = 15,
  style = {},
  previewMobile = false,
  sectionBg,
  accentColor = '#1ABC9C'
}) => {
  const palette = getAdaptivePalette(sectionBg, accentColor);

  // Multi-mappa: usa array. Single-mappa: deriva da legacy props.
  const entries: MapEntry[] = (maps && maps.length > 0)
    ? maps
    : [{
        id: 'legacy',
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        address,
        zoom,
      }];

  const isMulti = entries.length > 1;
  const compact = isMulti && !previewMobile;

  return (
    <div style={{
      width: '100%',
      maxWidth: isMulti ? '1100px' : '620px',
      margin: '0 auto',
      display: 'grid',
      // Desktop multi-mappa: grid auto-fit con minmax 320 → si affiancano
      // finché c'è spazio; sotto ai 320px collassano in colonna.
      // Mobile (previewMobile): sempre singola colonna.
      gridTemplateColumns: previewMobile
        ? '1fr'
        : isMulti
          ? 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))'
          : '1fr',
      gap: previewMobile ? '20px' : '24px',
      boxSizing: 'border-box',
    }}>
      {entries.map((entry) => (
        <MapCard
          key={entry.id}
          entry={entry}
          palette={palette}
          accentColor={accentColor}
          previewMobile={previewMobile}
          style={style}
          compact={compact}
        />
      ))}
    </div>
  );
};

export default MapWidget;
