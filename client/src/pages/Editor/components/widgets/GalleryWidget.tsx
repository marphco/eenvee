import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { getAdaptivePalette } from '../../../../utils/colorUtils';

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

interface GalleryWidgetProps {
  title?: string;
  images?: GalleryImage[];
  /**
   * 'masonry' = colonne CSS con altezze naturali (best per mix verticale/orizzontale)
   * 'grid'    = griglia regolare quadrata (best per reportage uniforme)
   */
  layout?: 'masonry' | 'grid';
  /** Spaziatura in px tra le foto (sia gap orizzontale che margin bottom masonry) */
  gap?: number;
  /** Numero colonne desktop */
  columns?: number;
  accentColor?: string;
  /**
   * Sfondo effettivo della sezione. Se fornito, il widget adatta colore testo,
   * bordi e surface in base alla luminanza. Se omesso fallback palette chiara.
   */
  sectionBg?: string | null;
  previewMobile?: boolean;
  /** Se true disabilita il lightbox (editor preview con pointer-events off) */
  readOnly?: boolean;
  /**
   * Callback opzionale per upload file (drag&drop o click sull'empty state).
   * Quando definita l'empty state diventa **una dropzone attiva**: accetta il
   * drop di uno o più file immagine e/o apre il file picker al click. Usato
   * solo lato editor (la public view non la passa mai → empty state normale).
   */
  onUploadImages?: (files: File[]) => void | Promise<void>;
  /** Indicatore upload in corso: cambia copy e disabilita il drop. */
  uploading?: boolean;
}

const GalleryWidget: React.FC<GalleryWidgetProps> = ({
  title,
  images = [],
  layout = 'masonry',
  gap = 12,
  columns = 3,
  accentColor = 'var(--accent)',
  sectionBg,
  previewMobile = false,
  readOnly = false,
  onUploadImages,
  uploading = false
}) => {
  // Palette adattiva: la luminosità del bg decide se usare testo chiaro/scuro.
  // Single source of truth, stesso helper riusato da Video/Mappa/RSVP.
  const palette = getAdaptivePalette(sectionBg, accentColor);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    if (!files || !onUploadImages || uploading) return;
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    onUploadImages(arr);
  }, [onUploadImages, uploading]);

  const close = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);
  const prev = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, close, next, prev]);

  const effectiveColumns = previewMobile ? Math.min(2, columns) : columns;

  // Empty state — design unificato con VideoWidget (stesso container "cinema",
  // stessa icona-card accent, stesso layout verticale). L'unica differenza è
  // l'icona (Upload/Gallery vs Video/Play) e la copy.
  //
  // Diventa una DROPZONE ATTIVA se c'è un onUploadImages callback (in editor
  // quando il canvas ci collega l'uploader). In pagina pubblica è solo visivo.
  if (!images.length) {
    const isInteractive = !!onUploadImages;
    return (
      <div
        onDragOver={isInteractive ? (e) => { e.preventDefault(); setIsDragOver(true); } : undefined}
        onDragEnter={isInteractive ? (e) => { e.preventDefault(); setIsDragOver(true); } : undefined}
        onDragLeave={isInteractive ? () => setIsDragOver(false) : undefined}
        onDrop={isInteractive ? (e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        } : undefined}
        onClick={isInteractive ? () => fileInputRef.current?.click() : undefined}
        style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          aspectRatio: previewMobile ? 'auto' : '16 / 9',
          minHeight: previewMobile ? '240px' : undefined,
          padding: previewMobile ? '40px 16px' : '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          border: `2px dashed ${isDragOver ? accentColor : palette.border}`,
          borderRadius: '16px',
          background: isDragOver ? `${accentColor}18` : palette.surface,
          color: palette.text,
          boxSizing: 'border-box',
          cursor: isInteractive && !uploading ? 'pointer' : 'default',
          transition: 'border-color .2s ease, background .2s ease, transform .2s ease',
          transform: isDragOver ? 'scale(1.01)' : 'scale(1)'
        }}
      >
        <div style={{
          width: '56px', height: '56px',
          borderRadius: '14px',
          background: `${accentColor}1A`,
          border: `1px solid ${accentColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .2s ease',
          transform: isDragOver ? 'scale(1.1)' : 'scale(1)'
        }}>
          <Upload size={26} color={accentColor as string} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.01em', marginBottom: '4px', color: palette.text }}>
            {uploading ? 'Caricamento in corso…'
              : isDragOver ? 'Rilascia per caricare'
              : isInteractive ? 'Trascina qui le tue foto' : 'Galleria vuota'}
          </div>
          <div style={{ fontSize: '13px', color: palette.textSoft, lineHeight: 1.5 }}>
            {isInteractive
              ? <>oppure <span style={{ color: accentColor, fontWeight: 700, textDecoration: 'underline' }}>clicca per selezionarle</span> dal tuo computer.<br/>JPG, PNG o WebP — più foto alla volta.</>
              : 'Aggiungi delle foto dal pannello laterale per riempire questa sezione.'}
          </div>
        </div>
        {isInteractive && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => { handleFiles(e.target.files); if (e.target) e.target.value = ''; }}
            style={{ display: 'none' }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      padding: previewMobile ? '16px 12px' : '24px',
      boxSizing: 'border-box',
      color: palette.text
    }}>
      {/* [RIMOSSO] h3 titolo interno: il titolo è ora un layer testo libero
          creato alla creazione del blocco (vedi `PageSection.tsx → Sezione Galleria`).
          L'utente modifica font/colore/dimensione dal PropertyPanel come fa con
          qualsiasi altro testo, senza essere vincolato alla palette adattiva. */}

      {layout === 'masonry' ? (
        <div style={{
          columnCount: effectiveColumns,
          columnGap: gap + 'px',
        }}>
          {images.map((img, idx) => (
            <div
              key={img.id}
              onClick={readOnly ? undefined : () => setLightboxIndex(idx)}
              style={{
                breakInside: 'avoid',
                marginBottom: gap + 'px',
                borderRadius: '10px',
                overflow: 'hidden',
                cursor: readOnly ? 'default' : 'zoom-in',
                background: 'rgba(255,255,255,0.04)',
                transition: 'transform .25s ease, box-shadow .25s ease'
              }}
              onMouseEnter={(e) => {
                if (readOnly) return;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                if (readOnly) return;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={img.url}
                alt={img.caption || ''}
                loading="lazy"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover'
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
          gap: gap + 'px'
        }}>
          {images.map((img, idx) => (
            <div
              key={img.id}
              onClick={readOnly ? undefined : () => setLightboxIndex(idx)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '10px',
                overflow: 'hidden',
                cursor: readOnly ? 'default' : 'zoom-in',
                background: 'rgba(255,255,255,0.04)'
              }}
            >
              <img
                src={img.url}
                alt={img.caption || ''}
                loading="lazy"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {!readOnly && lightboxIndex !== null && images[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Anteprima foto"
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 60px',
            cursor: 'zoom-out',
            animation: 'galleryFadeIn .2s ease-out'
          }}
        >
          <style>{`
            @keyframes galleryFadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>

          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            aria-label="Chiudi"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            <X size={22} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Foto precedente"
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <ChevronLeft size={26} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Foto successiva"
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              cursor: 'default'
            }}
          >
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].caption || ''}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            />
            {images[lightboxIndex].caption && (
              <div style={{ color: '#fff', fontSize: '14px', opacity: 0.85, textAlign: 'center' }}>
                {images[lightboxIndex].caption}
              </div>
            )}
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em' }}>
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryWidget;
