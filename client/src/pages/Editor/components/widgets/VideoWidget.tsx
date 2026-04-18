import React from 'react';
import { Video as VideoIcon, PlayCircle, Upload } from 'lucide-react';
import { getAdaptivePalette } from '../../../../utils/colorUtils';

export type VideoSource = 'youtube' | 'vimeo' | 'file' | 'unknown';

interface VideoWidgetProps {
  title?: string;
  /** URL "grezzo" che l'utente incolla o che ritorna dall'upload. Parsato a runtime. */
  videoUrl?: string;
  /** Autoplay (iframe/video) — su youtube/vimeo serve muted per far partire davvero. */
  autoplay?: boolean;
  /** Loop (fine → riparte). */
  loop?: boolean;
  /** Mostra controlli player. Default true. YouTube/Vimeo hanno i propri. */
  controls?: boolean;
  /** Mutato: necessario perché autoplay funzioni sui browser moderni. */
  muted?: boolean;
  accentColor?: string;
  /**
   * Sfondo effettivo della sezione — serve per calcolare l'adaptive palette.
   * Se non passato il widget assume sezione chiara (testo scuro).
   */
  sectionBg?: string | null;
  previewMobile?: boolean;
  readOnly?: boolean;
  /**
   * Callback opzionale per drag&drop upload file video direttamente sul widget
   * quando è in empty state. Simmetrica a `onUploadImages` della galleria.
   */
  onUploadFile?: (file: File) => void | Promise<void>;
  /** Indicatore upload in corso. */
  uploading?: boolean;
  /** Progress upload (0..100) se disponibile, altrimenti undefined = spinner */
  uploadProgress?: number | null;
}

/**
 * Detecta la sorgente e ritorna {source, id, embedUrl}. Per file diretti
 * (mp4/webm/mov/ogg) torna {source:'file', embedUrl: url}.
 */
export function parseVideoUrl(raw: string | undefined, opts?: { autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean }): {
  source: VideoSource;
  id?: string;
  embedUrl?: string;
} {
  if (!raw) return { source: 'unknown' };
  const url = raw.trim();
  if (!url) return { source: 'unknown' };

  const autoplay = opts?.autoplay ? 1 : 0;
  const loop = opts?.loop ? 1 : 0;
  const muted = opts?.muted ? 1 : 0;
  const controls = opts?.controls === false ? 0 : 1;

  // YouTube — vari formati (watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (muted) params.set('mute', '1');
    if (!controls) params.set('controls', '0');
    if (loop) { params.set('loop', '1'); params.set('playlist', id); }
    params.set('rel', '0');
    params.set('modestbranding', '1');
    return { source: 'youtube', id, embedUrl: `https://www.youtube.com/embed/${id}?${params.toString()}` };
  }

  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch && vmMatch[1]) {
    const id = vmMatch[1];
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (muted) params.set('muted', '1');
    if (loop) params.set('loop', '1');
    if (!controls) params.set('controls', '0');
    params.set('dnt', '1');
    return { source: 'vimeo', id, embedUrl: `https://player.vimeo.com/video/${id}?${params.toString()}` };
  }

  // File diretto (estensione nota o path assoluto)
  if (/\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(url)) {
    return { source: 'file', embedUrl: url };
  }

  return { source: 'unknown' };
}

const VideoWidget: React.FC<VideoWidgetProps> = ({
  title,
  videoUrl,
  autoplay = false,
  loop = false,
  controls = true,
  muted = true,
  accentColor = 'var(--accent)',
  sectionBg,
  previewMobile = false,
  readOnly = false,
  onUploadFile,
  uploading = false,
  uploadProgress = null
}) => {
  const parsed = parseVideoUrl(videoUrl, { autoplay, loop, muted, controls });
  const palette = getAdaptivePalette(sectionBg, accentColor);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // In modalità readOnly (editor preview) non eseguiamo davvero il video: evitiamo
  // che l'iframe catturi il pointer e rompa drag/drop della sezione.
  const pointerEventsStyle: React.CSSProperties['pointerEvents'] = readOnly ? 'none' : 'auto';

  // Aspect ratio FISSO 16:9. Scelta progettuale:
  //  - 16:9 è lo standard de-facto (YouTube, Vimeo, la maggior parte delle videocamere).
  //  - Per i file caricati usiamo `object-fit: contain` + sfondo nero: il video
  //    mantiene il suo aspect ratio originale e vengono aggiunte barre nere se
  //    necessario, **senza tagliare** alcun contenuto. Soluzione "cinematografica"
  //    che copre sia il caso 16:9 sia il caso verticale 9:16 senza chiedere
  //    all'utente di selezionare il formato.
  const aspectPad = '56.25%'; // 16:9

  const handleDrop = (files: FileList | File[]) => {
    if (!onUploadFile || uploading) return;
    const f = Array.from(files).find(x => x.type.startsWith('video/'));
    if (f) void onUploadFile(f);
  };

  return (
    <div style={{
      width: '100%',
      padding: previewMobile ? '16px 12px' : '24px',
      boxSizing: 'border-box',
      color: palette.text,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* [RIMOSSO] h3 titolo interno: il titolo è ora un layer testo libero
          creato alla creazione del blocco (vedi `PageSection.tsx → Sezione Video`).
          Questo dà all'utente controllo pieno su font/colore/posizione tramite
          gli stessi editor degli altri testi in pagina (invece di essere forzati
          sulla palette adattiva bianco/nero che cambiava in base al bg sezione). */}

      {/* Empty state — allineato con GalleryWidget:
          card tratteggiata con aspect 16:9, icona-pill accent, copy dinamica.
          Se presente `onUploadFile` diventa dropzone attiva (drag&drop + click). */}
      {parsed.source === 'unknown' ? (
        <div
          onDragOver={onUploadFile ? (e) => { e.preventDefault(); setIsDragOver(true); } : undefined}
          onDragEnter={onUploadFile ? (e) => { e.preventDefault(); setIsDragOver(true); } : undefined}
          onDragLeave={onUploadFile ? () => setIsDragOver(false) : undefined}
          onDrop={onUploadFile ? (e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleDrop(e.dataTransfer.files);
          } : undefined}
          onClick={onUploadFile && !uploading ? () => fileInputRef.current?.click() : undefined}
          style={{
            width: '100%',
            maxWidth: '900px',
            aspectRatio: previewMobile ? 'auto' : '16 / 9',
            minHeight: previewMobile ? '240px' : undefined,
            borderRadius: '16px',
            border: `2px dashed ${isDragOver ? accentColor : palette.border}`,
            background: isDragOver ? `${accentColor}18` : palette.surface,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            textAlign: 'center',
            padding: '32px',
            cursor: onUploadFile && !uploading ? 'pointer' : 'default',
            transition: 'border-color .2s ease, background .2s ease, transform .2s ease',
            transform: isDragOver ? 'scale(1.01)' : 'scale(1)'
          }}>
          <div style={{
            width: '56px', height: '56px',
            borderRadius: '14px',
            background: `${accentColor}1A`,
            border: `1px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .2s ease',
            transform: isDragOver ? 'scale(1.1)' : 'scale(1)'
          }}>
            {onUploadFile
              ? <Upload size={26} color={accentColor as string} />
              : <VideoIcon size={26} color={accentColor as string} />}
          </div>
          <div style={{ maxWidth: '420px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: palette.text }}>
              {uploading
                ? (uploadProgress !== null ? `Caricamento… ${uploadProgress}%` : 'Caricamento in corso…')
                : isDragOver ? 'Rilascia per caricare'
                : onUploadFile ? 'Trascina qui il tuo video' : 'Video non configurato'}
            </div>
            <div style={{ fontSize: '13px', color: palette.textSoft, lineHeight: 1.5 }}>
              {onUploadFile
                ? <>oppure <span style={{ color: accentColor, fontWeight: 700, textDecoration: 'underline' }}>clicca per sceglierlo</span>.<br/>MP4, WEBM o MOV — oppure incolla un link YouTube/Vimeo dal pannello laterale.</>
                : 'Carica un file o incolla un link YouTube/Vimeo dal pannello laterale.'}
            </div>
          </div>
          {onUploadFile && uploading && uploadProgress !== null && (
            <div style={{ width: '100%', maxWidth: '280px', marginTop: '4px' }}>
              <div style={{ height: '4px', borderRadius: '2px', background: palette.border, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: accentColor,
                  transition: 'width .15s ease'
                }} />
              </div>
            </div>
          )}
          {onUploadFile && (
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUploadFile(f); if (e.target) e.target.value = ''; }}
              style={{ display: 'none' }}
            />
          )}
        </div>
      ) : (
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '900px',
          paddingTop: aspectPad,
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#000',
          boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
          pointerEvents: pointerEventsStyle
        }}>
          {parsed.source === 'file' && parsed.embedUrl ? (
            <video
              src={parsed.embedUrl}
              controls={controls}
              autoPlay={autoplay}
              loop={loop}
              muted={muted}
              playsInline
              preload="metadata"
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                // `contain` invece di `cover`: mantiene l'aspect originale del video.
                // Se è 9:16 (vlog verticale), appaiono due bande nere laterali ma il
                // video NON viene tagliato. Scelta deliberata: l'utente carica un video
                // e si aspetta di vederlo intero, non ritagliato arbitrariamente.
                objectFit: 'contain',
                background: '#000'
              }}
            />
          ) : (parsed.source === 'youtube' || parsed.source === 'vimeo') && parsed.embedUrl ? (
            <iframe
              src={parsed.embedUrl}
              title={title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                border: 0
              }}
            />
          ) : null}

          {/* Readonly preview overlay — indica che nell'editor il video è pausato */}
          {readOnly && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              pointerEvents: 'none'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.55)',
                borderRadius: '100px',
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                backdropFilter: 'blur(6px)'
              }}>
                <PlayCircle size={18} />
                Anteprima
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoWidget;
