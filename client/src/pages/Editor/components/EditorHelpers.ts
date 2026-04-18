import type { Layer } from "../../../types/editor";

export const decodeHtml = (html: string): string => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

// Dynamic Google Font Loader
export const loadGoogleFont = (fontFamily: string | undefined): void => {
  if (!fontFamily) return;
  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(fontId)) return;
  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

export const AVAILABLE_FONTS: string[] = [
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

export const getFontPreviewText = (selectedLayer: Layer | null | undefined): string => {
  if (!selectedLayer || (selectedLayer.type !== 'text' && selectedLayer.type !== undefined)) return "AaBbCc";
  const raw = (selectedLayer.text || "");
  
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const clean = doc.body.textContent || "";
  
  if (!clean.trim()) return "AaBbCc";
  return clean.length > 20 ? clean.substring(0, 18) + "..." : clean;
};

export interface LinerOption {
  id: string;
  url: string;
  name: string;
}

export const AVAILABLE_LINERS: LinerOption[] = [
  { id: 'minimal_pink', url: '/minimal_pink_liner.png', name: 'Minimal Pink' },
  { id: 'wedding_floral', url: '/wedding_liner.png', name: 'Wedding Floral' },
  { id: 'silk', url: '/bg_texture_silk.jpg', name: 'Seta' }
];

export interface ScenarioBgOption {
  id: string;
  url: string;
  name: string;
}

export const AVAILABLE_SCENARIO_BGS: ScenarioBgOption[] = [
  { id: 'default', url: '/bg_scenario_default.jpg', name: 'Default' }
];

export const sortLayersForMobile = (layers: Layer[]): Layer[] => {
  // Allineato alla logica usata in `SectionCanvas` (vista mobile editor) e in
  // `EventPageBuilder`: un layer senza `mobileOrder` viene trattato come 0. In
  // questo modo il widget RSVP (che di default ha `mobileOrder=5`) finisce DOPO
  // i layer testuali (che partono a 0), replicando l'ordine WYSIWYG visto in
  // editor anche sulla pagina pubblica. In caso di pareggio cadiamo sulla
  // posizione Y/X del layer per mantenere un ordine naturale.
  return [...layers].sort((a, b) => {
    const ao = typeof a.mobileOrder === 'number' ? a.mobileOrder : 0;
    const bo = typeof b.mobileOrder === 'number' ? b.mobileOrder : 0;
    if (ao !== bo) return ao - bo;

    const ay = typeof a.y === 'number' ? a.y : 0;
    const by = typeof b.y === 'number' ? b.y : 0;
    const ax = typeof a.x === 'number' ? a.x : 200;
    const bx = typeof b.x === 'number' ? b.x : 200;

    if (Math.abs(ay - by) < 40) {
      return ax - bx;
    }
    return ay - by;
  });
};
