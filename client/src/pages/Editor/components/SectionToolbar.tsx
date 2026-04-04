import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react';
import CustomColorPicker from './CustomColorPicker';

interface SectionToolbarProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
  bgColor: string;
  isFirst: boolean;
  isLast: boolean;
  layout?: 'vertical' | 'horizontal';
}

const SectionToolbar: React.FC<SectionToolbarProps> = ({ 
  onMoveUp, 
  onMoveDown, 
  onDuplicate, 
  onDelete,
  onColorChange,
  bgColor,
  isFirst,
  isLast,
  layout = 'vertical'
}) => {
  const isHorizontal = layout === 'horizontal';
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Auto-reset per la conferma eliminazione dopo 3 secondi
  useEffect(() => {
    if (isConfirmingDelete) {
      const timer = setTimeout(() => setIsConfirmingDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingDelete]);

  const handleDeleteClick = () => {
    if (isConfirmingDelete) {
      onDelete();
      setIsConfirmingDelete(false);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  return (
    <div 
      className={`section-floating-toolbar ${layout}`}
      style={{
        position: 'absolute',
        top: isHorizontal ? '-42px' : '0', 
        right: isHorizontal ? 'auto' : '-75px',
        left: isHorizontal ? '50%' : 'auto',
        transform: isHorizontal ? 'translateX(-50%)' : 'none',
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        gap: isHorizontal ? '4px' : '6px',
        padding: isHorizontal ? '6px 8px' : '8px 6px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: isHorizontal ? '12px' : '14px',
        border: '1.5px solid var(--accent)',
        boxShadow: isHorizontal 
          ? '0 8px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)' 
          : 'var(--shadow-soft)',
        zIndex: 1000,
        pointerEvents: 'auto',
        minWidth: isHorizontal ? '220px' : '56px',
        justifyContent: 'center'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ToolbarButton 
        onClick={onMoveUp} 
        disabled={isFirst} 
        icon={<ChevronUp size={isHorizontal ? 16 : 18} />} 
        label="SPOSTA SU"
        title="Sposta Su" 
      />
      <ToolbarButton 
        onClick={onMoveDown} 
        disabled={isLast} 
        icon={<ChevronDown size={isHorizontal ? 16 : 18} />} 
        label="SPOSTA GIÙ"
        title="Sposta Giù" 
      />
      
      {/* Separator */}
      <div style={{ 
        width: isHorizontal ? '1.5px' : '70%', 
        height: isHorizontal ? '22px' : '1.5px', 
        background: 'var(--accent)', 
        opacity: 0.25,
        margin: isHorizontal ? '0 4px' : '2px 0' 
      }} />
      
      {/* Color Swatch Button */}
      <div style={{ position: 'relative' }}>
        <ToolbarButton 
          onClick={() => setShowColorPicker(!showColorPicker)} 
          icon={
            <div style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: bgColor || '#ffffff', 
              borderRadius: '6px',
              border: '2px solid #fff',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} />
          } 
          label="COLORE"
          title="Colore Sfondo" 
          isActive={showColorPicker}
        />
        
        {/* Sub-Popover for Color Picker (Flipped to left on desktop to avoid clipping) */}
        {showColorPicker && (
          <div style={{
            position: 'absolute',
            bottom: isHorizontal ? '60px' : 'auto',
            right: isHorizontal ? 'auto' : '65px', // Mostra a SINISTRA della toolbar su desktop
            left: isHorizontal ? '50%' : 'auto',
            top: isHorizontal ? 'auto' : '0',
            transform: isHorizontal ? 'translateX(-50%)' : 'none',
            zIndex: 2000,
            pointerEvents: 'auto'
          }}>
             <div style={{ 
               backgroundColor: 'var(--bg-surface)',
               padding: '12px',
               borderRadius: '12px',
               border: '1.5px solid var(--accent)',
               boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
               width: '260px'
             }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                   <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>COLORE SEZIONE</span>
                   <button 
                     onClick={() => setShowColorPicker(false)}
                     style={{ background: 'var(--accent-soft)', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}
                   >
                     OK
                   </button>
                </div>
                <CustomColorPicker color={bgColor} onChange={onColorChange} />
             </div>
          </div>
        )}
      </div>

      <ToolbarButton 
        onClick={onDuplicate} 
        icon={<Copy size={isHorizontal ? 14 : 16} />} 
        label="DUPLICA"
        title="Duplica" 
      />
      <ToolbarButton 
        onClick={handleDeleteClick} 
        icon={<Trash2 size={isHorizontal ? 14 : 16} />} 
        label={isConfirmingDelete ? "SICURO?" : "ELIMINA"}
        title="Elimina" 
        isDestructive 
        isActive={isConfirmingDelete}
      />

      {/* Puntatore di ancoraggio (Solo mobile/horizontal) */}
      {isHorizontal && (
        <div style={{
          position: 'absolute',
          bottom: '-7.5px', 
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1.5px solid var(--accent)',
          borderBottom: '1.5px solid var(--accent)',
          zIndex: 2, 
          boxShadow: '2px 2px 5px rgba(0,0,0,0.05)'
        }} />
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  title: string;
  label: string;
  isDestructive?: boolean;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, icon, disabled, title, label, isDestructive, isActive }) => (
  <button
    onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
    disabled={disabled}
    title={title}
    style={{
      width: '44px',
      height: '44px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      backgroundColor: isActive ? (isDestructive ? 'rgba(231, 76, 60, 0.2)' : 'var(--accent-soft)') : 'transparent',
      color: disabled ? 'var(--text-soft)' : (isDestructive ? '#e74c3c' : (isActive ? 'var(--accent)' : 'var(--text-primary)')),
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      opacity: disabled ? 0.4 : 1,
      gap: '2px'
    }}
    onMouseEnter={(e) => {
      if (!disabled && !isActive) {
        e.currentTarget.style.backgroundColor = isDestructive ? 'rgba(231, 76, 60, 0.1)' : 'var(--accent-soft)';
        e.currentTarget.style.color = isDestructive ? '#e74c3c' : 'var(--accent)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled && !isActive) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = isDestructive ? '#e74c3c' : 'var(--text-primary)';
      }
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px' }}>
      {icon}
    </div>
    <span style={{ 
      fontSize: '7px', 
      fontWeight: 800, 
      letterSpacing: '0.02em',
      opacity: disabled ? 0.5 : (isActive ? 1 : 0.7),
      color: isDestructive ? '#e74c3c' : 'inherit'
    }}>
      {label}
    </span>
  </button>
);

export default SectionToolbar;
