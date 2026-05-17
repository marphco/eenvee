/**
 * CustomSelect — dropdown generico, stesso look di CustomFontSelect.
 *
 * Sostituto del `<select>` nativo per garantire consistenza visiva con
 * il resto dell'editor (form invito, payment, libretto, ecc.).
 *
 * API: `value`, `onChange(value)`, `options: { value, label }[]`,
 * opzionale `placeholder` mostrato se nessun valore selezionato.
 */

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Se presente, mostrata sotto al label nel dropdown (descrizione opzionale). */
  description?: string;
  /** Etichetta gruppo (sostituto di optgroup nativo). Le opzioni con stessa
      `group` vengono raggruppate sotto un'intestazione nel dropdown. */
  group?: string;
}

interface Props<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  placeholder?: string;
  /** Bloccato (read-only) — utile per stati "in elaborazione". */
  disabled?: boolean;
}

function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = '— scegli —',
  disabled = false,
}: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chiudi cliccando fuori
  useEffect(() => {
    const onClickOut = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label || placeholder;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '10px 12px',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          // Sfondo solido (no var) — alcuni contesti (modal libretto, ecc.)
          // hanno --surface trasparente o non set, causando dropdown
          // vedi-attraverso con contenuto sottostante che fa pasticci.
          background: disabled ? '#f5f5f0' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: selected ? 'var(--text-primary)' : 'var(--text-soft)',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-soft)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            // Sfondo solido garantito (vedi commento sopra).
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 1000,
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {(() => {
            // Raggruppa per `group` preservando l'ordine originale
            const seen = new Set<string>();
            const result: React.ReactNode[] = [];
            options.forEach((opt, i) => {
              const groupKey = opt.group;
              if (groupKey && !seen.has(groupKey)) {
                seen.add(groupKey);
                result.push(
                  <div
                    key={`group-${groupKey}`}
                    style={{
                      padding: i === 0 ? '6px 10px 4px' : '10px 10px 4px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'var(--text-soft)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {groupKey}
                  </div>
                );
              }
              const active = opt.value === value;
              result.push(
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'rgba(var(--accent-rgb), 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: active ? 700 : 500 }}>{opt.label}</div>
                  {opt.description && (
                    <div style={{
                      fontSize: '11px',
                      opacity: active ? 0.85 : 0.55,
                      lineHeight: 1.3,
                    }}>
                      {opt.description}
                    </div>
                  )}
                </div>
              );
            });
            return result;
          })()}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
