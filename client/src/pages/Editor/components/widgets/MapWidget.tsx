import React from 'react';

interface MapWidgetProps {
  address?: string | undefined;
  zoom?: number | undefined;
  style?: {
    borderRadius?: string;
    border?: string;
    boxShadow?: string;
  };
  previewMobile?: boolean;
}

const MapWidget: React.FC<MapWidgetProps> = ({ 
  address = "Piazza del Duomo, Milano", 
  zoom = 15,
  style = {},
  previewMobile = false
}) => {
  // Genera URL per Google Maps Embed (No API key required for basic embed)
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY_HERE&q=${encodedAddress}&zoom=${zoom}`;
  
  // Per ora usiamo un placeholder elegante di OpenStreetMap o un iframe generico se non abbiamo la key
  // Usiamo Google Maps Embed senza KEY (mappa statica/semplice) o un'alternativa sicura per il demo
  const fallbackUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="map-widget-container" style={{
      width: '100%',
      height: '100%',
      minHeight: previewMobile ? '250px' : '400px',
      borderRadius: style.borderRadius || '16px',
      overflow: 'hidden',
      border: style.border || '1.5px solid var(--accent-soft)',
      boxShadow: style.boxShadow || '0 10px 30px rgba(0,0,0,0.1)',
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
      
      {/* Overlay per bloccare gli eventi del mouse durante il drag nell'editor */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        pointerEvents: 'none' // Lasciamo passare i clic ma blocchiamo lo scroll se necessario
      }} />
    </div>
  );
};

export default MapWidget;
