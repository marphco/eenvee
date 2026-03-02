import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { resolveImageUrl } from "../config/api";
import { apiFetch } from "../utils/apiFetch";
import { BLOCK_LIBRARY, THEME_PRESETS, PREBUILT_TEMPLATES } from "../utils/layoutSchema";
import { Surface, Button, Badge } from "../ui";
import { CopyPlus, GripVertical, Trash2, Type, Move, MapPin, Undo2, AlignLeft, AlignCenter, AlignRight, Plus, Minus, PaintBucket, Bold, Italic, Underline, Pipette, ChevronDown, ChevronUp, Home, LayoutDashboard, Save, Check, X, Settings2, Baseline, Image as ImageIcon, Sparkles, Shapes, Heart, Star, Camera, Gift, Music, Bell, Cake, PartyPopper, Wine, GlassWater, Anchor, Crown, Gem, Cloud, Sun, Moon, Smile, Coffee, TreePine, Flame } from "lucide-react";

import { HexColorPicker } from "react-colorful";
import "./EventEditor.css";

// Header button for mobile icon + subtext
const MobileIconBtn = ({ icon: Icon, label, onClick, disabled, variant = "ghost", style = {} }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`mobile-icon-btn variant-${variant}`}
    style={{...style}}
  >
    <Icon size={20} className="mib-icon"/>
    <span className="mib-label">{label}</span>
  </button>
);

// Componente Custom per il Color Picker (Stile Canva/Native Chrome)
const CustomColorPicker = ({ color, onChange }) => {
  const [hexInput, setHexInput] = useState(color);
  
  useEffect(() => {
    setHexInput(color);
  }, [color]);

  const handleHexChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (val && !val.startsWith('#')) val = '#' + val;
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChange(val);
    }
  };

  const handleEyeDropper = async () => {
    if (!window.EyeDropper) return alert("Il tuo browser non supporta EyeDropper API.");
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch (e) {
      // User canceled
    }
  };

  return (
    <div className="custom-color-picker-container" style={{
      position: 'relative',
      zIndex: 105,
      background: '#fff',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      width: '100%',
      minWidth: '240px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: '1px solid #ddd'
    }} onClick={(e) => e.stopPropagation()}>
      <div className="custom-colorful-override">
        <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', padding: '0 8px', height: '34px', boxSizing: 'border-box', gap: '8px', background: '#fff' }}>
           <div style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', flexShrink: 0, borderRadius: '50%', background: color, border: '1px solid rgba(0,0,0,0.1)' }}></div>
           <input 
             type="text" 
             value={hexInput} 
             onChange={handleHexChange}
             style={{ border: 'none', background: 'transparent', width: '100%', height: '100%', outline: 'none', fontSize: '14px', color: '#333', fontWeight: 500, fontFamily: 'monospace' }}
           />
        </div>
        {window.EyeDropper && (
          <button onClick={handleEyeDropper} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '6px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333' }}>
            <Pipette size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// Dynamic Google Font Loader
const loadGoogleFont = (fontFamily) => {
  if (!fontFamily) return;
  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(fontId)) return;
  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};


const AVAILABLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Playfair Display",
  "Cormorant Garamond", "Fraunces", "DM Serif Display", "Space Grotesk",
  "Alex Brush", "Great Vibes", "Dancing Script", "Pacifico", "Amatic SC",
  "Bebas Neue", "Anton", "Lobster", "Righteous", "Cinzel", "Oswald",
  "Raleway", "Poppins", "Nunito", "Quicksand", "Crimson Text", "Libre Baskerville",
  "Merriweather", "PT Sans", "Work Sans", "Rubik", "Lora", "Fira Sans",
  "Ubuntu", "Mukta", "Noto Sans", "PT Serif", "Nanum Gothic", "Titillium Web",
  "Heebo", "Karla", "Josefin Sans", "Libre Franklin", "Inconsolata", "Bitter",
  "Dosis", "Hind", "Cabin", "Fjalla One", "Source Sans Pro", "Source Serif Pro",
  "Abril Fatface", "Varela Round", "Comfortaa", "Exo 2", "Kanit", "Teko",
  "Shadows Into Light", "Caveat", "Permanent Marker", "Satisfy", "Courgette",
  "Kaushan Script", "Cookie", "Chewy", "Handlee", "Neucha", "Marck Script",
  "Sacramento", "Yellowtail", "Parisienne", "Tangerine", "Allura", "Pinyon Script",
  "Berkshire Swash", "Leckerli One", "Rochester", "Arizonia", "Mr De Haviland",
  "Niconne", "Bad Script", "Yeseva One", "Forum", "Prata", "Rokkitt", "Cormorant",
  "Alegreya", "EB Garamond", "Cardo", "Gilda Display", "Philosopher", "Cinzel Decorative"
].sort();

const CustomFontSelect = ({ value, onChange, fonts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
     const clickOut = (e) => {
       if(containerRef.current && !containerRef.current.contains(e.target) && !e.target.closest('#custom-font-portal')) {
         setIsOpen(false);
       }
     };
     document.addEventListener('mousedown', clickOut);
     return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  return (
    <div ref={containerRef} style={{position: 'relative', width: '100%', marginBottom: '4px'}}>
       <div 
         onClick={() => setIsOpen(!isOpen)}
         style={{
           padding: '8px 12px', 
           border: '1px solid var(--border)', 
           borderRadius: 'var(--radius-sm)',
           background: 'var(--surface-light)',
           cursor: 'pointer',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center',
           fontFamily: value,
           fontSize: '15px'
         }}
       >
         <span>{value}</span>
         <ChevronDown size={14} style={{ color: "var(--text-soft)", transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
       </div>
       
       {isOpen && (
         <div id="custom-font-portal" style={{
           marginTop: '4px',
           width: '100%',
           height: '250px',
           overflowY: 'auto',
           background: '#181820',
           border: '1px solid var(--border)',
           borderRadius: 'var(--radius-md)',
           boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)'
         }}>
            {fonts.map(f => (
               <div 
                 key={f}
                 onClick={() => {
                   onChange(f);
                   setIsOpen(false);
                 }}
                 style={{
                   padding: '10px 14px',
                   cursor: 'pointer',
                   fontFamily: f,
                   fontSize: '18px',
                   borderBottom: '1px solid var(--border)',
                   backgroundColor: value === f ? 'var(--accent)' : 'transparent',
                   color: value === f ? '#000' : 'var(--text-main)',
                   transition: 'background-color 0.1s'
                 }}
                 onMouseEnter={e => {
                   if(value !== f) {
                     e.currentTarget.style.backgroundColor = 'var(--surface-light)';
                     e.currentTarget.style.color = 'var(--text-main)';
                   }
                 }}
                 onMouseLeave={e => {
                   if(value !== f) {
                     e.currentTarget.style.backgroundColor = 'transparent';
                     e.currentTarget.style.color = 'var(--text-main)';
                   }
                 }}
               >
                 {f}
               </div>
            ))}
         </div>
       )}
    </div>
  );
};

export default function EventEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [event, setEvent] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [layers, setLayers] = useState([]);
  const [canvasProps, setCanvasProps] = useState({ bgImage: null, width: 800, height: 1000 });
  const [loading, setLoading] = useState(true);
  
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState(null);
  const [isFontExpanded, setIsFontExpanded] = useState(false);
  
  const [history, setHistory] = useState([]); 
  const [draftRestored, setDraftRestored] = useState(false);
  
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null); // Box di selezione {startX, startY, currentX, currentY}
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [snapGuides, setSnapGuides] = useState([]); // Array of { axis: 'x'|'y', position: number }
  
  const canvasRef = useRef(null);

  const DRAFT_KEY = `ynvio:draft:${slug}`;

  const defaultTheme = {
    accent: "#f4c46b",
    background: "#050506",
    fonts: { heading: "Playfair Display", body: "Space Grotesk" },
    preset: "noir",
  };

  const withTheme = (evt = {}) => ({
    ...evt,
    theme: { ...defaultTheme, ...(evt.theme || {}) },
  });

  const fileInputRef = useRef(null);

  // --- HISTORY & DRAFT ---
  const pushToHistory = () => {
    setHistory(prev => [...prev.slice(-15), { layers: JSON.parse(JSON.stringify(layers)), blocks: JSON.parse(JSON.stringify(blocks)), canvas: JSON.parse(JSON.stringify(canvasProps)) }]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setLayers(last.layers);
    setBlocks(last.blocks);
    setCanvasProps(last.canvas);
    setHistory(prev => prev.slice(0, -1));
    setIsDirty(true);
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ blocks, layers, canvas: canvasProps, event, savedAt: Date.now() }));
    } catch {}
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  useEffect(() => {
    if (!draftRestored || !isDirty) return;
    saveDraft();
  }, [blocks, layers, canvasProps, event, draftRestored, isDirty]);

  // --- FETCH INITIAL ---
  useEffect(() => {
    let cancelled = false;
    async function fetchEvent() {
      if (slug === 'demo') {
        const templateId = searchParams.get('templateId');
        const template = PREBUILT_TEMPLATES.find(t => t.id === templateId) || PREBUILT_TEMPLATES[0];
        if (!cancelled) {
          setEvent(withTheme({ title: "Prova Design - " + template.name, status: "draft", theme: template.theme }));
          setLayers(template.layers || []);
          setBlocks(template.blocks || []);
          setCanvasProps(template.canvas || { bgImage: null, width: 800, height: 1000 });
          setDraftRestored(true);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiFetch(`/api/events/${slug}/private`);
        if (!res.ok) throw new Error("Evento non trovato");
        const data = await res.json();

        if (!cancelled) {
          setEvent(withTheme(data));
          const draft = loadDraft();
          if (draft && draft.layers) {
             setLayers(draft.layers || []);
             setBlocks(draft.blocks || []);
             setCanvasProps(draft.canvas || { bgImage: null, width: 800, height: 1000 });
             if (draft.event) setEvent(withTheme(draft.event));
             setIsDirty(true);
          } else {
             setLayers(data.layers || []);
             setBlocks(data.blocks || []);
             setCanvasProps(data.canvas || { bgImage: null, width: 800, height: 1000 });
          }
          setDraftRestored(true);
        }
      } catch (err) {
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEvent();
    return () => { cancelled = true; };
  }, [slug]);

  // --- AUTOSAVE ---
  useEffect(() => {
    if (!draftRestored || !isDirty || autoSaving) return;
    const t = setTimeout(() => {
      saveToServer();
    }, 1500);
    return () => clearTimeout(t);
  }, [blocks, layers, canvasProps, event, isDirty, autoSaving, draftRestored]);

  const saveToServer = async () => {
    if (!event || slug === 'demo') {
      if (slug === 'demo') {
        setIsDirty(false);
        setLastSavedAt(Date.now());
      }
      return;
    }
    setAutoSaving(true);

    try {
      const res = await apiFetch(`/api/events/${slug}`, {
        method: "PUT",
        body: JSON.stringify({
          title: event.title, status: event.status, theme: event.theme,
          blocks, layers, canvas: canvasProps
        }),
      });
      if (!res.ok) throw new Error("Errore salvataggio evento");
      setIsDirty(false);
      setLastSavedAt(Date.now());
      clearDraft();
    } catch (err) {
      console.error(err);
    } finally {
      setAutoSaving(false);
    }
  };

  // --- LAYER MANAGEMENT ---
  const addLayer = (type, customProps = {}) => {
    pushToHistory();
    const newLayer = {
      id: crypto.randomUUID(),
      type: type || "text",
      x: 'center',
      y: canvasProps.height / 2,
      ...customProps
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
    setIsDirty(true);
  };

  const addTextLayer = () => {
    addLayer("text", {
      text: "Nuovo Testo",
      fontSize: 32,
      fontFamily: event.theme?.fonts?.heading || "Playfair Display",
      color: event.theme?.accent || "#000000",
      textAlign: "center",
      width: "max-content",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      letterSpacing: 0,
      lineHeight: 1.2
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 300;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w *= ratio;
            h *= ratio;
          }
          addLayer("image", { src: ev.target.result, w: Math.round(w), h: Math.round(h), lockRatio: true });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null; // reset
  };

  const updateSelectedLayer = (updates) => {
    if (selectedLayerIds.length === 0) return;
    setLayers(prev => prev.map(l => selectedLayerIds.includes(l.id) ? { ...l, ...updates } : l));
    setIsDirty(true);
  };

  const deleteSelectedLayers = () => {
    if (selectedLayerIds.length === 0) return;
    pushToHistory();
    setLayers(prev => prev.filter(l => !selectedLayerIds.includes(l.id)));
    setSelectedLayerIds([]);
    setIsDirty(true);
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingLayerId || e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea' || e.target.isContentEditable) {
        return; // Non interferire se stiamo digitando un testo o l'evento è un div editabile
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedLayerIds.length > 0) {
        e.preventDefault();
        deleteSelectedLayers();
        return;
      }

      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (keys.includes(e.key) && selectedLayerIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setLayers(prev => {
          let hasChanges = false;
          const newLayers = prev.map(l => {
            if (selectedLayerIds.includes(l.id)) {
              hasChanges = true;
              let nx = l.x === 'center' || isNaN(l.x) ? canvasProps.width/2 : l.x;
              let ny = l.y === 'center' || isNaN(l.y) ? canvasProps.height/2 : l.y;
              if (e.key === 'ArrowUp') ny -= step;
              if (e.key === 'ArrowDown') ny += step;
              if (e.key === 'ArrowLeft') nx -= step;
              if (e.key === 'ArrowRight') nx += step;
              return { ...l, x: nx, y: ny };
            }
            return l;
          });
          if (hasChanges) setIsDirty(true);
          return newLayers;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerIds, editingLayerId, canvasProps]);

  // --- DRAG E RESIZE LOGIC NATIVA ---
  const draggingLayerId = useRef(null);
  const dragOffset = useRef({}); // { layerId: { offsetX, offsetY, startX, startY } }
  const selectionBoxRef = useRef(null);
  const dragGeometries = useRef(null);
  const resizingLayerId = useRef(null);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, startSize: 0, startX: 0 });
  

  const handlePointerDown = (e, layer) => {
    e.stopPropagation();
    
    let newSelected = [...selectedLayerIds];
    if (e.shiftKey) {
        if (newSelected.includes(layer.id)) {
            newSelected = newSelected.filter(id => id !== layer.id);
        } else {
            newSelected.push(layer.id);
        }
    } else {
        if (!newSelected.includes(layer.id)) {
            newSelected = [layer.id];
        }
    }
    setSelectedLayerIds(newSelected);
    
    // If we're already editing this layer, let the pointer event fall through to text selection
    if (editingLayerId === layer.id && newSelected.length === 1) {
      return; 
    }
    
    setEditingLayerId(null);
    draggingLayerId.current = layer.id;
    
    // Calculate offset from mouse to layer's top-left corner
    if(canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const scale = canvasRect.width / canvasProps.width;
        // Mouse position inside canvas
        const mouseX = (e.clientX - canvasRect.left) / scale;
        const mouseY = (e.clientY - canvasRect.top) / scale;
        
        let positionResolved = false;
        let updatedLayers = [...layers];

        newSelected.forEach(id => {
            let l = updatedLayers.find(ll => ll.id === id);
            if (l) {
                let cx = l.x; let cy = l.y;
                let changed = false;
                if (cx === 'center' || isNaN(cx)) { cx = canvasProps.width / 2; changed = true; }
                if (cy === 'center' || isNaN(cy)) { cy = canvasProps.height / 2; changed = true; }
                if (changed) {
                    updatedLayers = updatedLayers.map(ul => ul.id === id ? { ...ul, x: cx, y: cy } : ul);
                    positionResolved = true;
                }
            }
        });
        
        if (positionResolved) {
            setLayers(updatedLayers);
        }

        const offsets = {};
        newSelected.forEach(id => {
            const l = positionResolved ? updatedLayers.find(ll => ll.id === id) : layers.find(ll => ll.id === id);
            if(l) {
               offsets[id] = {
                   startX: l.x,
                   startY: l.y,
                   offsetX: mouseX - l.x,
                   offsetY: mouseY - l.y
               };
            }
        });
        dragOffset.current = offsets;

        // Cache geometries for smooth, high-performance snapping using TRUE un-scaled offset sizes
        const activeNode = document.getElementById(`layer-${layer.id}`);
        let activeW = layer.w || 100;
        let activeH = layer.h || 100;
        
        if (activeNode) {
            activeW = activeNode.offsetWidth;
            activeH = activeNode.offsetHeight;
        }
        
        const others = [];
        layers.forEach(l => {
            if (!newSelected.includes(l.id)) { // snap against non-selected ONLY
                const n = document.getElementById(`layer-${l.id}`);
                let oW = l.w || 100;
                let oH = l.h || 100;
                if (n) {
                    oW = n.offsetWidth;
                    oH = n.offsetHeight;
                }
                const oX = typeof l.x === 'number' && !isNaN(l.x) ? l.x : canvasProps.width/2;
                const oY = typeof l.y === 'number' && !isNaN(l.y) ? l.y : canvasProps.height/2;
                others.push({
                    id: l.id,
                    centerX: oX,
                    centerY: oY,
                    left: oX - oW / 2,
                    right: oX + oW / 2,
                    top: oY - oH / 2,
                    bottom: oY + oH / 2
                });
            }
        });

        dragGeometries.current = {
            active: { w: activeW, h: activeH },
            others: others,
            primaryId: layer.id
        };
    }
  };

  const handleResizePointerDown = (e, layer, handlePostion) => {
    e.stopPropagation();
    setSelectedLayerIds([layer.id]);
    resizingLayerId.current = layer.id;
    
    if(canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const scale = canvasRect.width / canvasProps.width;
        
        let currentX = layer.x;
        let currentY = layer.y;
        let positionResolved = false;
        
        if (currentX === 'center' || currentY === 'center') {
            if (currentX === 'center') {
                currentX = canvasProps.width / 2;
            }
            if (currentY === 'center') {
                currentY = canvasProps.height / 2;
            }
            positionResolved = true;
            setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, x: currentX, y: currentY } : l));
        }

        resizeStart.current = {
            mouseX: (e.clientX - canvasRect.left) / scale,
            mouseY: (e.clientY - canvasRect.top) / scale,
            startSize: layer.fontSize,
            startW: typeof layer.w === 'number' ? layer.w : (document.getElementById(`layer-${layer.id}`)?.offsetWidth || 100),
            startH: typeof layer.h === 'number' ? layer.h : (document.getElementById(`layer-${layer.id}`)?.offsetHeight || 100),
            position: handlePostion
        };
    }
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!draggingLayerId.current && !resizingLayerId.current) return;
      if (!canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const scale = canvasRect.width / canvasProps.width;
      
      const mouseX = (e.clientX - canvasRect.left) / scale;
      const mouseY = (e.clientY - canvasRect.top) / scale;

      if (selectionBoxRef.current) {
          selectionBoxRef.current.currentX = Math.max(0, Math.min(mouseX, canvasProps.width));
          selectionBoxRef.current.currentY = Math.max(0, Math.min(mouseY, canvasProps.height));
          setSelectionBox({ ...selectionBoxRef.current });
          return;
      }

      if (resizingLayerId.current) {
         setLayers(prev => prev.map(l => {
           if (l.id === resizingLayerId.current) {
               // Calcola la distanza diagonale percorsa dal mouse
               const deltaX = resizeStart.current.position.includes('W') ? (resizeStart.current.mouseX - mouseX) : (mouseX - resizeStart.current.mouseX);
               
               if (!l.type || l.type === 'text') {
                 let newSize = resizeStart.current.startSize + deltaX * 0.5;
                 newSize = Math.max(12, Math.min(newSize, 300));
                 return { ...l, fontSize: Math.round(newSize) };
               } else if (l.type === 'image') {
                 let newW = resizeStart.current.startW + deltaX * 2;
                 newW = Math.max(20, Math.min(newW, canvasProps.width));
                 if (resizeStart.current.startW > 0) {
                   const ratio = resizeStart.current.startH / resizeStart.current.startW;
                   let newH = newW * ratio;
                   if (newH > canvasProps.height) {
                     newH = canvasProps.height;
                     newW = newH / ratio;
                   }
                   return { ...l, w: Math.round(newW), h: Math.round(newH) };
                 }
                 return { ...l, w: Math.round(newW), h: Math.round(newW) };
               }
           }
           return l;
         }));
         setIsDirty(true);
         return;
      }

      if (draggingLayerId.current && dragGeometries.current) {
         setLayers(prev => {
            let draftLayers = [...prev];
            const primaryId = dragGeometries.current.primaryId;
            const primaryLayer = draftLayers.find(l => l.id === primaryId);
            if (!primaryLayer) return draftLayers;
            
            const primaryOffset = dragOffset.current[primaryId];
            if (!primaryOffset) return draftLayers;
            
            let nx = mouseX - primaryOffset.offsetX;
            let ny = mouseY - primaryOffset.offsetY;
            
            const elW = dragGeometries.current.active.w;
            const elH = dragGeometries.current.active.h;

            // 1. BOUNDS
            nx = Math.max(elW / 2, Math.min(nx, canvasProps.width - elW / 2));
            ny = Math.max(elH / 2, Math.min(ny, canvasProps.height - elH / 2));

            // 2. MAGNETIC SNAP
            const SNAP_THRESHOLD = 5;
            let newGuides = [];
            let snappedX = false;
            let snappedY = false;

            const activeLeft = nx - elW / 2;
            const activeRight = nx + elW / 2;
            const activeTop = ny - elH / 2;
            const activeBottom = ny + elH / 2;
            const activeCenterX = nx;
            const activeCenterY = ny;

            const canvasCenterX = canvasProps.width / 2;
            const canvasCenterY = canvasProps.height / 2;

            if (Math.abs(activeCenterX - canvasCenterX) < SNAP_THRESHOLD) {
                nx = canvasCenterX;
                newGuides.push({ axis: 'x', position: canvasCenterX });
                snappedX = true;
            }
            if (Math.abs(activeCenterY - canvasCenterY) < SNAP_THRESHOLD) {
                ny = canvasCenterY;
                newGuides.push({ axis: 'y', position: canvasCenterY });
                snappedY = true;
            }

            dragGeometries.current.others.forEach(other => {
                if (!snappedX) {
                    if (Math.abs(activeCenterX - other.centerX) < SNAP_THRESHOLD) {
                        nx = other.centerX; newGuides.push({ axis: 'x', position: other.centerX }); snappedX = true;
                    } else if (Math.abs(activeLeft - other.left) < SNAP_THRESHOLD) {
                        nx = other.left + elW / 2; newGuides.push({ axis: 'x', position: other.left }); snappedX = true;
                    } else if (Math.abs(activeRight - other.right) < SNAP_THRESHOLD) {
                        nx = other.right - elW / 2; newGuides.push({ axis: 'x', position: other.right }); snappedX = true;
                    }
                }
                if (!snappedY) {
                    if (Math.abs(activeCenterY - other.centerY) < SNAP_THRESHOLD) {
                        ny = other.centerY; newGuides.push({ axis: 'y', position: other.centerY }); snappedY = true;
                    } else if (Math.abs(activeTop - other.top) < SNAP_THRESHOLD) {
                        ny = other.top + elH / 2; newGuides.push({ axis: 'y', position: other.top }); snappedY = true;
                    } else if (Math.abs(activeBottom - other.bottom) < SNAP_THRESHOLD) {
                        ny = other.bottom - elH / 2; newGuides.push({ axis: 'y', position: other.bottom }); snappedY = true;
                    }
                }
            });

            setSnapGuides(newGuides);
            
            // 3. ABSOLUTE FINAL BOUNDS
            nx = Math.max(elW / 2, Math.min(nx, canvasProps.width - elW / 2));
            ny = Math.max(elH / 2, Math.min(ny, canvasProps.height - elH / 2));

            const deltaX = nx - primaryOffset.startX;
            const deltaY = ny - primaryOffset.startY;
            
            return draftLayers.map(l => {
                const off = dragOffset.current[l.id];
                if (off) {
                    let finalX = off.startX + deltaX;
                    let finalY = off.startY + deltaY;
                    const node = document.getElementById(`layer-${l.id}`);
                    if (node) {
                        const localW = node.offsetWidth;
                        const localH = node.offsetHeight;
                        finalX = Math.max(localW / 2, Math.min(finalX, canvasProps.width - localW / 2));
                        finalY = Math.max(localH / 2, Math.min(finalY, canvasProps.height - localH / 2));
                    }
                    return { ...l, x: finalX, y: finalY };
                }
                return l;
            });
         });
         setIsDirty(true);
      }
    };

    const handlePointerUp = () => {
      if (draggingLayerId.current || resizingLayerId.current || selectionBoxRef.current) {
         pushToHistory(); 
      }
      
      if (selectionBoxRef.current) {
          const minX = Math.min(selectionBoxRef.current.startX, selectionBoxRef.current.currentX);
          const maxX = Math.max(selectionBoxRef.current.startX, selectionBoxRef.current.currentX);
          const minY = Math.min(selectionBoxRef.current.startY, selectionBoxRef.current.currentY);
          const maxY = Math.max(selectionBoxRef.current.startY, selectionBoxRef.current.currentY);
          
          if (maxX - minX > 5 || maxY - minY > 5) {
             setLayers(prev => {
                const selectedIds = prev.filter(l => {
                    const node = document.getElementById(`layer-${l.id}`);
                    if (!node) return false;
                    const w = node.offsetWidth;
                    const h = node.offsetHeight;
                    const lx = typeof l.x === 'number' && !isNaN(l.x) ? l.x : canvasProps.width/2;
                    const ly = typeof l.y === 'number' && !isNaN(l.y) ? l.y : canvasProps.height/2;
                    const left = lx - w/2;
                    const right = lx + w/2;
                    const top = ly - h/2;
                    const bottom = ly + h/2;
                    
                    return !(right < minX || left > maxX || bottom < minY || top > maxY);
                }).map(l => l.id);
                setTimeout(() => setSelectedLayerIds(selectedIds), 0);
                return prev;
             });
          }
          selectionBoxRef.current = null;
          setSelectionBox(null);
      }

      draggingLayerId.current = null;
      resizingLayerId.current = null;
      setSnapGuides([]); // Nascondi le guide rilasciando il click
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [canvasProps.width, canvasProps.height]); // MUST include canvasProps.height otherwise closure gets stale 1000px height causing bottom boundary fails!

  // FONTS E RESIZE
  useEffect(() => {
    // 1. Carica i font già in uso dai layer
    layers.forEach(l => {
       if(l.fontFamily) loadGoogleFont(l.fontFamily);
    });
    // 2. Pre-carica i font della lista globale per permettere il rendering dell'anteprima nel selettore a tendina
    AVAILABLE_FONTS.forEach(font => loadGoogleFont(font));
  }, [layers]);

  const stageRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
         const paddingX = window.innerWidth <= 768 ? 32 : 96; 
         const paddingY = window.innerWidth <= 768 ? 32 : 96; // Offset rimosso grazie a flexbox
         const availableWidth = stageRef.current.clientWidth - paddingX;
         const availableHeight = stageRef.current.clientHeight - paddingY;
         const scaleX = availableWidth / canvasProps.width;
         const scaleY = availableHeight / canvasProps.height;
         const newScale = Math.min(scaleX, scaleY, 1);
         setStageScale(newScale);
      }
    };
    // initial check after short delay to let flex layout settle
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    handleResize();

    // Re-trigger scale calc when mobile panels open/close
    const timeout = setTimeout(handleResize, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [canvasProps.width, canvasProps.height, activeMobileTab, isFontExpanded]);


  if (loading) return <div className="editor-page">Caricamento editor...</div>;
  if (!event) return <div className="editor-page">Evento non trovato.</div>;

  const selectedLayer = selectedLayerIds.length > 0 ? layers.find(l => selectedLayerIds.includes(l.id)) : null;

  return (
    <div className="editor-page canvas-mode">
      <div className="editor-topbar">
        <div style={{ display: "flex", gap: "0.5rem" }}>
            <MobileIconBtn icon={Home} label="Home" onClick={() => navigate("/")} />
            <MobileIconBtn icon={LayoutDashboard} label="Eventi" onClick={() => navigate("/dashboard")} />
          <h1 className="desktop-only-title" style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-soft)', lineHeight: '40px', margin: 0 }}>{event.title}</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <MobileIconBtn icon={Undo2} label="Annulla" onClick={undo} disabled={history.length === 0} />
          
          {autoSaving ? (
            <MobileIconBtn icon={Save} label="Salvataggio" disabled style={{ color: "#f4c46b" }} />
          ) : isDirty ? (
            <MobileIconBtn icon={Save} label="Bozza" disabled style={{ color: "salmon" }} />
          ) : (
            <MobileIconBtn icon={Check} label="Salvato" disabled style={{ color: "#3ae6b3" }} />
          )}

          <MobileIconBtn 
            icon={Check} 
            label="Finito!" 
            variant="primary"
            onClick={() => {
              setEvent((prev) => ({ ...prev, status: prev.status === "published" ? "draft" : "published" }));
              setIsDirty(true);
              setTimeout(() => navigate('/dashboard'), 500);
            }} 
          />
        </div>
      </div>

      <div className="editor-workspace">
        
        {/* LATO SINISTRO: TOOLBAR TESTI & BLOCCHI EXTRAS */}
        <div className="editor-sidebar left-sidebar">
           <Surface variant="soft" className="panel-section">
             <h3>Inserisci</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
               <Button variant="primary" style={{width: '100%', justifyContent: 'center'}} onClick={addTextLayer}>
                 <Type size={16} style={{marginRight: 8}}/> Testo
               </Button>
               <Button variant="secondary" style={{width: '100%', justifyContent: 'center'}} onClick={() => fileInputRef.current?.click()}>
                 <ImageIcon size={16} style={{marginRight: 8}}/> Immagine
               </Button>
               <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{display: 'none'}} />
             </div>
           </Surface>

           {selectedLayer && (
           <Surface variant="soft" className="panel-section property-panel">
             <label>Font</label>
             <CustomFontSelect 
               value={selectedLayer.fontFamily} 
               fonts={AVAILABLE_FONTS}
               onChange={font => {
                 updateSelectedLayer({ fontFamily: font });
                 loadGoogleFont(font);
               }}
             />

              <div className="prop-row" style={{alignItems: 'center', marginTop: '0.2rem'}}>
                <div style={{display: 'flex', alignItems: 'center', background: 'var(--surface-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden'}}>
                  <Button variant="ghost" style={{padding: '0.4rem', borderRadius: 0}} onClick={() => updateSelectedLayer({fontSize: Math.max(8, selectedLayer.fontSize - 1)})}>
                    <Minus size={14}/>
                  </Button>
                  <div style={{width: '30px', textAlign: 'center', fontSize: '0.9rem'}}>{selectedLayer.fontSize}</div>
                  <Button variant="ghost" style={{padding: '0.4rem', borderRadius: 0}} onClick={() => updateSelectedLayer({fontSize: selectedLayer.fontSize + 1})}>
                    <Plus size={14}/>
                  </Button>
                </div>

                <div style={{display: 'flex', gap: '0.25rem', marginLeft: 'auto'}}>
                  <Button variant="ghost" onClick={() => updateSelectedLayer({fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold'})} style={{padding: '0.4rem', borderRadius: 'var(--radius-sm)', justifyContent: 'center', background: selectedLayer.fontWeight === 'bold' ? 'var(--accent)' : 'var(--surface-light)', color: selectedLayer.fontWeight === 'bold' ? '#000' : 'var(--text-soft)', border: 'none'}}>
                    <Bold size={16}/>
                  </Button>
                  <Button variant="ghost" onClick={() => updateSelectedLayer({fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic'})} style={{padding: '0.4rem', borderRadius: 'var(--radius-sm)', justifyContent: 'center', background: selectedLayer.fontStyle === 'italic' ? 'var(--accent)' : 'var(--surface-light)', color: selectedLayer.fontStyle === 'italic' ? '#000' : 'var(--text-soft)', border: 'none'}}>
                    <Italic size={16}/>
                  </Button>
                  <Button variant="ghost" onClick={() => updateSelectedLayer({textDecoration: selectedLayer.textDecoration === 'underline' ? 'none' : 'underline'})} style={{padding: '0.4rem', borderRadius: 'var(--radius-sm)', justifyContent: 'center', background: selectedLayer.textDecoration === 'underline' ? 'var(--accent)' : 'var(--surface-light)', color: selectedLayer.textDecoration === 'underline' ? '#000' : 'var(--text-soft)', border: 'none'}}>
                    <Underline size={16}/>
                  </Button>
                </div>
              </div>

              <div className="prop-row" style={{alignItems: 'center', marginTop: '0.5rem', marginBottom: displayColorPicker ? '0.5rem' : '0.5rem'}}>
                 <PaintBucket size={16} color="var(--text-soft)"/>
                 <label style={{margin: 0, flex: 1}}>Colore</label>
                 <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                    <div 
                      onClick={() => setDisplayColorPicker(!displayColorPicker)}
                      style={{
                        padding: 0, 
                        border: '2px solid var(--border)', 
                        background: selectedLayer.color, 
                        width: '28px', 
                        height: '28px', 
                        cursor: 'pointer', 
                        borderRadius: '6px', 
                        overflow: 'hidden'
                      }}
                    />
                 </div>
              </div>
              {displayColorPicker && (
                 <div style={{ marginBottom: '1rem', width: '100%' }}>
                   <CustomColorPicker 
                      color={selectedLayer.color} 
                      onChange={(color) => updateSelectedLayer({ color })}
                   />
                 </div>
              )}

              <label style={{marginTop: '0.5rem'}}>Spaziatura Lettere</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                <input type="range" min="-10" max="50" step="1" value={selectedLayer.letterSpacing || 0} onChange={e => updateSelectedLayer({letterSpacing: parseFloat(e.target.value)})} style={{flex: 1, cursor: 'pointer', accentColor: 'var(--accent)'}}/>
                <span style={{fontSize: '0.8rem', width: '30px', textAlign: 'right'}}>{selectedLayer.letterSpacing || 0}</span>
              </div>

              <label>Spaziatura Righe</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <input type="range" min="0.5" max="3" step="0.1" value={selectedLayer.lineHeight || 1.2} onChange={e => updateSelectedLayer({lineHeight: parseFloat(e.target.value)})} style={{flex: 1, cursor: 'pointer', accentColor: 'var(--accent)'}}/>
                <span style={{fontSize: '0.8rem', width: '30px', textAlign: 'right'}}>{selectedLayer.lineHeight || 1.2}</span>
              </div>

             <div className="prop-row" style={{marginTop: '1rem'}}>
                <Button variant="ghost" onClick={deleteSelectedLayers} style={{color: 'salmon', width: '100%', justifyContent: 'center'}}>
                  <Trash2 size={16} style={{marginRight: 6}}/> Elimina Livello
                </Button>
             </div>
           </Surface>
           )}
        </div>

        {/* ===================== MOBILE BOTTOM BAR ===================== */}
        <div className="mobile-toolbar-container">
           {activeMobileTab && (
             <div className="mobile-tab-panel">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {activeMobileTab === 'insert' ? 'Inserisci' : activeMobileTab === 'font' ? 'Font' : activeMobileTab === 'size' ? 'Dimensioni' : activeMobileTab === 'format' ? 'Formato' : 'Colore'}
                  </span>
                  <button className="mobile-tab-close" onClick={() => { setActiveMobileTab(null); setIsFontExpanded(false); }} style={{background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex'}}><X size={20}/></button>
               </div>
               <div className="mobile-tab-content" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '1rem', boxSizing: 'border-box' }}>
                  {activeMobileTab === 'font' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
                      {!isFontExpanded ? (
                        <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
                          <div className="font-list-wrapper">
                            <div className="font-scroll-container">
                              {AVAILABLE_FONTS.slice(0, 15).map(f => (
                                 <button 
                                   key={f} 
                                   onClick={() => { updateSelectedLayer({ fontFamily: f }); loadGoogleFont(f); }} 
                                   style={{fontFamily: f, whiteSpace: 'nowrap', padding: '0.4rem 0.8rem', background: selectedLayer.fontFamily === f ? 'var(--accent)' : 'var(--surface-light)', color: selectedLayer.fontFamily === f ? '#000' : 'var(--text-primary)', borderRadius: '8px', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
                                 >
                                   {f}
                                 </button>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => setIsFontExpanded(true)} style={{background: 'var(--surface-light)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '50%', marginLeft: '0.5rem', cursor: 'pointer', flexShrink: 0}}><ChevronUp size={16}/></button>
                        </div>
                      ) : (
                        <div style={{width: '100%', height: '40vh', display: 'flex', flexDirection: 'column'}}>
                          <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column'}}>
                             {AVAILABLE_FONTS.map(f => (
                               <button 
                                 key={f} 
                                 onClick={() => { updateSelectedLayer({ fontFamily: f }); loadGoogleFont(f); setIsFontExpanded(false); }} 
                                 style={{fontFamily: f, padding: '0.8rem', textAlign: 'left', background: selectedLayer.fontFamily === f ? 'var(--accent)' : 'transparent', color: selectedLayer.fontFamily === f ? '#000' : 'var(--text-primary)', border: 'none', borderBottom: '1px solid var(--border)', fontSize: '1.2rem', whiteSpace: 'nowrap' }}
                               >
                                 {f}
                               </button>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {activeMobileTab === 'size' && (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flex: 1}}>
                      <Button variant="ghost" onClick={() => updateSelectedLayer({fontSize: Math.max(8, selectedLayer.fontSize - 1)})}><Minus size={28}/></Button>
                      <span style={{fontSize: '1.4rem', minWidth: '40px', textAlign: 'center'}}>{selectedLayer.fontSize}</span>
                      <Button variant="ghost" onClick={() => updateSelectedLayer({fontSize: selectedLayer.fontSize + 1})}><Plus size={28}/></Button>
                    </div>
                  )}
                  {activeMobileTab === 'format' && (
                    <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flex: 1}}>
                       <Button variant="ghost" onClick={() => updateSelectedLayer({fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold'})} style={{background: selectedLayer.fontWeight === 'bold' ? 'var(--accent)' : 'var(--surface-light)', color: selectedLayer.fontWeight === 'bold' ? '#000' : 'var(--text-soft)', padding: '0.8rem'}}>
                         <Bold size={24}/>
                       </Button>
                       <Button variant="ghost" onClick={() => updateSelectedLayer({fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic'})} style={{background: selectedLayer.fontStyle === 'italic' ? 'var(--accent)' : 'var(--surface-light)', color: selectedLayer.fontStyle === 'italic' ? '#000' : 'var(--text-soft)', padding: '0.8rem'}}>
                         <Italic size={24}/>
                       </Button>
                       <Button variant="ghost" onClick={() => updateSelectedLayer({textDecoration: selectedLayer.textDecoration === 'underline' ? 'none' : 'underline'})} style={{background: selectedLayer.textDecoration === 'underline' ? 'var(--accent)' : 'var(--surface-light)', color: selectedLayer.textDecoration === 'underline' ? '#000' : 'var(--text-soft)', padding: '0.8rem'}}>
                         <Underline size={24}/>
                       </Button>
                    </div>
                  )}
                  {activeMobileTab === 'color' && selectedLayer && (
                    <div style={{flex: 1, width: '100%'}}>
                      <CustomColorPicker color={selectedLayer.color} onChange={(color) => updateSelectedLayer({ color })} />
                    </div>
                  )}
               </div>
             </div>
           )}

           <div className="mobile-toolbar">
              {selectedLayer ? (
                 <>
                   <MobileIconBtn icon={Type} label="Modifica" onClick={() => setEditingLayerId(selectedLayer.id)} />
                   <MobileIconBtn icon={Baseline} label="Font" onClick={() => setActiveMobileTab(activeMobileTab === 'font' ? null : 'font')} />
                   <MobileIconBtn icon={Settings2} label="Dimensioni" onClick={() => setActiveMobileTab(activeMobileTab === 'size' ? null : 'size')} />
                   <MobileIconBtn icon={Bold} label="Formato" onClick={() => setActiveMobileTab(activeMobileTab === 'format' ? null : 'format')} />
                   <MobileIconBtn icon={PaintBucket} label="Colore" onClick={() => setActiveMobileTab(activeMobileTab === 'color' ? null : 'color')} />
                   <MobileIconBtn icon={Trash2} label="Elimina" onClick={deleteSelectedLayers} style={{ color: 'salmon' }} />
                 </>
              ) : (
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 10px'}}>
                   <div style={{fontWeight: 600, color: 'var(--text-main)', fontSize: '14px'}}>
                     Aggiungi elemento
                   </div>
                   <div style={{display: 'flex', gap: '16px'}}>
                     <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}} onClick={addTextLayer}>
                       <MobileIconBtn icon={Type} variant="primary" style={{margin:0}} />
                       <span style={{fontSize: '10px', fontWeight: 600, color: 'var(--text-main)'}}>Testo</span>
                     </div>
                     <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}} onClick={() => fileInputRef.current?.click()}>
                       <MobileIconBtn icon={ImageIcon} style={{margin:0}} />
                       <span style={{fontSize: '10px', fontWeight: 600, color: 'var(--text-main)'}}>Foto</span>
                     </div>
                   </div>
                 </div>
              )}
           </div>
        </div>
        {/* ========================================================== */}

        {/* CENTRO: CANVAS */}
        <div className="editor-canvas-stage" ref={stageRef}>
          <div style={{ width: canvasProps.width * stageScale, height: canvasProps.height * stageScale, position: 'relative', margin: 'auto' }}>
            <div className="canvas-scaler" style={{ transform: `scale(${stageScale})`, transformOrigin: 'top left', transition: 'transform 0.2s ease-out', position: 'absolute', top: 0, left: 0 }}>
              <div 
               ref={canvasRef}
               className="artboard" 
               style={{ 
                 width: canvasProps.width, 
                 height: canvasProps.height,
                 backgroundImage: canvasProps.bgImage ? `url(${canvasProps.bgImage})` : 'none',
                 backgroundColor: canvasProps.bgImage ? 'transparent' : '#fff'
               }}
               onPointerDown={(e) => {
                 if (e.target.closest('.canvas-layer')) return;
                 setSelectedLayerIds([]);
                 setEditingLayerId(null);
                 if(canvasRef.current) {
                     const canvasRect = canvasRef.current.getBoundingClientRect();
                     const scale = canvasRect.width / canvasProps.width;
                     const mx = (e.clientX - canvasRect.left) / scale;
                     const my = (e.clientY - canvasRect.top) / scale;
                     const box = { startX: mx, startY: my, currentX: mx, currentY: my };
                     selectionBoxRef.current = box;
                     setSelectionBox(box);
                 }
               }}
            >
               {layers.map((layer) => {
                 const isSelected = selectedLayerIds.includes(layer.id);
                 const isEditing = editingLayerId === layer.id;
                 return (
                   <div 
                     key={layer.id} 
                     id={`layer-${layer.id}`}
                     className={`canvas-layer ${isSelected ? 'selected' : ''}`}
                     style={{
                       left: layer.x === 'center' || isNaN(layer.x) ? '50%' : layer.x,
                       top: layer.y === 'center' || isNaN(layer.y) ? '50%' : layer.y,
                       transform: 'translate(-50%, -50%)',
                       width: 'max-content',
                       fontSize: layer.fontSize,
                       fontFamily: layer.fontFamily,
                       fontWeight: layer.fontWeight || "normal",
                       fontStyle: layer.fontStyle || "normal",
                       textDecoration: layer.textDecoration || "none",
                       letterSpacing: (layer.letterSpacing || 0) + 'px',
                       lineHeight: layer.lineHeight || 1.2,
                       color: layer.color,
                       textAlign: layer.textAlign,
                       zIndex: isSelected ? 10 : 1,
                       padding: '2px 4px' // bounding box "appena leggermente piu grande"
                     }}
                     onPointerDown={(e) => handlePointerDown(e, layer)}
                     onClick={(e) => e.stopPropagation()}
                   >
                     {/* Bounding Box Selector & Handles */}
                     {isSelected && (
                        <>
                          <div className="layer-outline" style={{ border: '1px solid var(--accent)', position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
                          {/* Resize Handles Corners */}
                          {['NW', 'NE', 'SW', 'SE'].map(pos => (
                             <div 
                               key={pos}
                               onPointerDown={(e) => handleResizePointerDown(e, layer, pos)}
                               style={{
                                 position: 'absolute',
                                 width: '10px', height: '10px',
                                 background: '#fff', border: '1px solid var(--accent)',
                                 borderRadius: '50%',
                                 top: pos.includes('N') ? '-5px' : 'auto',
                                 bottom: pos.includes('S') ? '-5px' : 'auto',
                                 left: pos.includes('W') ? '-5px' : 'auto',
                                 right: pos.includes('E') ? '-5px' : 'auto',
                                 cursor: pos === 'NW' || pos === 'SE' ? 'nwse-resize' : 'nesw-resize',
                                 zIndex: 10
                               }}
                             />
                          ))}
                        </>
                     )}
                     {(!layer.type || layer.type === 'text') && (
                       <div 
                         className="layer-content"
                         contentEditable={isEditing}
                         suppressContentEditableWarning={true}
                         onBlur={(e) => {
                           let updatedText = e.currentTarget.innerHTML;
                           if (!updatedText || updatedText === '<br>') updatedText = "Testo Vuoto";
                           updateSelectedLayer({ text: updatedText });
                           setEditingLayerId(null);
                         }}
                         onDoubleClick={(e) => {
                           e.stopPropagation();
                           setEditingLayerId(layer.id);
                         }}
                         onPointerDown={(e) => {
                           if (isEditing) e.stopPropagation(); 
                         }}
                         style={{
                           outline: 'none',
                           minWidth: '20px',
                           minHeight: '1em',
                           cursor: isEditing ? 'text' : (isSelected ? 'grab' : 'pointer'),
                           pointerEvents: 'auto',
                           userSelect: isEditing ? 'auto' : 'none',
                           whiteSpace: 'nowrap',
                           paddingBottom: '0.15em' /* Padding vitale per impedire il clip dei tratti inferiori nelle lettere */
                         }}
                         dangerouslySetInnerHTML={{__html: layer.text}}
                       />
                     )}
                     {layer.type === 'image' && (
                       <img 
                         src={layer.src} 
                         style={{ width: layer.w || '100%', height: layer.h || '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} 
                         alt="" 
                       />
                     )}
                   </div>
                 )
               })}

               {/* SMART GUIDES OVERLAY (RED LINES) */}
               {snapGuides.map((guide, i) => {
                 if (guide.axis === 'x') {
                   return <div key={`gx_${i}`} style={{position: 'absolute', top: 0, bottom: 0, left: guide.position, width: '1px', background: '#FF007F', zIndex: 99, pointerEvents: 'none'}} />;
                 }
                 if (guide.axis === 'y') {
                   return <div key={`gy_${i}`} style={{position: 'absolute', left: 0, right: 0, top: guide.position, height: '1px', background: '#FF007F', zIndex: 99, pointerEvents: 'none'}} />;
                 }
                 return null;
               })}
               
               {/* SELECTION BOX OVERLAY */}
               {selectionBox && (
                 <div style={{
                    position: 'absolute',
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY),
                    backgroundColor: 'rgba(0, 150, 255, 0.2)',
                    border: '1px solid rgba(0, 150, 255, 0.8)',
                    zIndex: 9999,
                    pointerEvents: 'none'
                 }} />
               )}

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
