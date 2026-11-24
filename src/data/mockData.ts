export interface GarmentTemplate {
  id: string;
  name: string; // 1 to 3 words
  category: 'Western' | 'Eastern';
  tag: string;
  helper: string; // max 6 words
  strokePath: string; // SVG path data
  detailPaths?: string[]; // inner seam/pleat lines
  viewBox: string;
}

export interface FigureTemplate {
  id: string;
  name: string; // 1 to 3 words
  helper: string; // max 6 words
  strokePath: string;
  viewBox: string;
}

export interface SketchItem {
  id: string;
  title: string; // 1 to 3 words
  date: string; // e.g. "Nov 16"
  category: 'Western' | 'Eastern';
  fabricTag: string; // 1 to 2 words
  colorHex: string;
  templateId?: string;
  strokePath: string;
  detailPaths?: string[];
  notes?: string; // max 6 words
  thumbnail_path?: string | null;
  thumbnailUrl?: string | null;
}

export interface FabricSwatch {
  id: string;
  name: string; // 1 to 2 words
  fiber: string; // max 3 words
  texture: 'matte' | 'sheer' | 'lustrous' | 'woven';
  color: string;
}

export interface ColorSwatch {
  id: string;
  name: string; // 1 to 2 words
  hex: string;
}

export interface MoodboardItem {
  id: string;
  title: string; // 1 to 3 words
  date: string;
  swatchesCount: number;
  fabrics: string[];
  accentColor: string;
}

// 6 Western garments + 6 Eastern garments with accurate fashion silhouette paths
export const GARMENT_TEMPLATES: GarmentTemplate[] = [
  // WESTERN
  {
    id: 'blazer',
    name: 'Tailored blazer',
    category: 'Western',
    tag: 'Western',
    helper: 'Structured shoulder silhouette',
    strokePath:
      'M35 25 L45 20 L55 25 L65 20 L75 25 L88 38 L80 82 L68 84 L55 85 L42 84 L30 82 L22 38 Z',
    detailPaths: [
      'M45 20 L55 52 L65 20', // Lapel V
      'M55 52 L55 85', // Front closure
      'M35 25 L45 46', // Left lapel notch
      'M75 25 L65 46', // Right lapel notch
      'M32 64 L42 64', // Left pocket welt
      'M68 64 L78 64', // Right pocket welt
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'trench',
    name: 'Classic trench',
    category: 'Western',
    tag: 'Western',
    helper: 'Storm flap belted silhouette',
    strokePath:
      'M36 24 L55 20 L74 24 L86 38 L80 94 L55 96 L30 94 L24 38 Z',
    detailPaths: [
      'M46 22 L55 48 L64 22',
      'M55 48 L55 96',
      'M34 56 L76 56', // Belt
      'M51 54 L59 54 L59 58 L51 58 Z', // Buckle
      'M55 24 L72 36', // Storm flap
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'slip_dress',
    name: 'Slip dress',
    category: 'Western',
    tag: 'Western',
    helper: 'Bias cut fluid drape',
    strokePath:
      'M44 26 L55 30 L66 26 L70 54 L76 96 L55 98 L34 96 L40 54 Z',
    detailPaths: [
      'M44 18 L44 26', // Left strap
      'M66 18 L66 26', // Right strap
      'M44 26 Q55 33 66 26', // Neckline scoop
      'M40 54 Q55 58 70 54', // Waist curve
      'M34 96 Q55 92 76 96', // Hem drape
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'shirt',
    name: 'Poplin shirt',
    category: 'Western',
    tag: 'Western',
    helper: 'Crisp collar button front',
    strokePath:
      'M38 24 L55 22 L72 24 L86 36 L78 78 L55 80 L32 78 L24 36 Z',
    detailPaths: [
      'M47 22 L55 28 L63 22 L55 24 Z', // Collar
      'M55 28 L55 80', // Placket
      'M38 42 L46 42 L46 50 L38 50 Z', // Chest pocket
      'M24 36 L34 38', // Cuff
      'M86 36 L76 38',
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'jeans',
    name: 'Denim jeans',
    category: 'Western',
    tag: 'Western',
    helper: 'High rise straight cut',
    strokePath:
      'M38 26 L72 26 L74 50 L68 96 L57 96 L55 52 L53 52 L51 96 L40 96 L36 50 Z',
    detailPaths: [
      'M38 31 L72 31', // Waistband
      'M55 31 L55 48', // Fly
      'M42 36 Q46 42 50 36', // Left scoop pocket
      'M60 36 Q64 42 68 36', // Right scoop pocket
      'M46 70 L46 96', // Inseam
      'M64 70 L64 96',
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'skirt',
    name: 'Pleated skirt',
    category: 'Western',
    tag: 'Western',
    helper: 'A line knife pleats',
    strokePath:
      'M42 26 L68 26 L78 88 L32 88 Z',
    detailPaths: [
      'M42 30 L68 30', // Waistband
      'M42 30 L38 88', // Pleat 1
      'M48 30 L46 88', // Pleat 2
      'M55 30 L55 88', // Pleat 3
      'M62 30 L64 88', // Pleat 4
      'M68 30 L72 88', // Pleat 5
    ],
    viewBox: '0 0 110 110',
  },

  // EASTERN
  {
    id: 'kurta',
    name: 'Straight kurta',
    category: 'Eastern',
    tag: 'Eastern',
    helper: 'Mandarin placket side slits',
    strokePath:
      'M38 24 L55 22 L72 24 L84 38 L76 96 L55 96 L34 96 L26 38 Z',
    detailPaths: [
      'M50 22 Q55 26 60 22', // Mandarin band
      'M55 26 L55 52', // Front placket
      'M34 68 L34 96', // Left side slit
      'M76 68 L76 96', // Right side slit
      'M26 38 L34 40', // Sleeve cuff
      'M84 38 L76 40',
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'sherwani',
    name: 'Royal sherwani',
    category: 'Eastern',
    tag: 'Eastern',
    helper: 'Structured achkan coat line',
    strokePath:
      'M36 24 L55 20 L74 24 L85 38 L78 98 L55 99 L32 98 L25 38 Z',
    detailPaths: [
      'M50 20 Q55 24 60 20', // Nehru collar
      'M55 24 L55 98', // Button front line
      'M55 30 L55 32', // Button 1
      'M55 36 L55 38', // Button 2
      'M55 42 L55 44', // Button 3
      'M55 48 L55 50', // Button 4
      'M34 32 L44 32', // Pocket welt
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'lehenga',
    name: 'Kalidar lehenga',
    category: 'Eastern',
    tag: 'Eastern',
    helper: 'Flared tiered skirt choli',
    strokePath:
      'M40 22 L70 22 L72 36 L38 36 Z M44 42 L66 42 L84 96 L26 96 Z',
    detailPaths: [
      'M48 22 Q55 28 62 22', // Choli neckline
      'M44 42 L34 96', // Kali seam 1
      'M50 42 L46 96', // Kali seam 2
      'M55 42 L55 96', // Kali seam center
      'M60 42 L64 96', // Kali seam 4
      'M66 42 L76 96', // Kali seam 5
      'M26 92 Q55 88 84 92', // Border embroidery
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'sharara',
    name: 'Tiered sharara',
    category: 'Eastern',
    tag: 'Eastern',
    helper: 'Knee fitted flared ruffles',
    strokePath:
      'M42 24 L68 24 L70 48 L84 96 L58 96 L55 58 L52 58 L26 96 L40 48 Z',
    detailPaths: [
      'M42 28 L68 28', // Waistband
      'M40 48 L70 48', // Knee gather band
      'M34 72 L76 72', // Mid tier ruffle
      'M26 96 Q55 90 84 96', // Bottom sweep
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'saree',
    name: 'Draped saree',
    category: 'Eastern',
    tag: 'Eastern',
    helper: 'Pleated fall shoulder pallu',
    strokePath:
      'M42 24 L68 24 L76 96 L34 96 Z M38 24 L24 64 L20 88',
    detailPaths: [
      'M44 24 L66 24', // Blouse/waist
      'M48 24 L44 96', // Front pleat 1
      'M52 24 L50 96', // Front pleat 2
      'M56 24 L56 96', // Front pleat 3
      'M60 24 L62 96', // Front pleat 4
      'M64 24 L38 58 L24 96', // Pallu diagonal drape
      'M24 96 L20 88', // Pallu border
    ],
    viewBox: '0 0 110 110',
  },
  {
    id: 'dupatta',
    name: 'Fluid dupatta',
    category: 'Eastern',
    tag: 'Eastern',
    helper: 'Sheer graceful shoulder drape',
    strokePath:
      'M30 20 Q55 32 80 20 L86 94 Q55 86 24 94 Z',
    detailPaths: [
      'M32 24 Q55 35 78 24', // Cowl fold 1
      'M34 38 Q55 48 76 38', // Cowl fold 2
      'M32 54 Q55 62 78 54', // Cowl fold 3
      'M24 90 Q55 82 86 90', // Zari hem border
    ],
    viewBox: '0 0 110 110',
  },
];

export const FIGURE_TEMPLATES: FigureTemplate[] = [
  {
    id: 'female_croquis',
    name: 'Female croquis',
    helper: 'Runway nine head proportion',
    strokePath:
      'M55 12 C58 12 60 15 60 19 C60 23 58 26 55 26 C52 26 50 23 50 19 C50 15 52 12 55 12 Z M53 26 L53 30 L44 32 L38 52 M57 26 L57 30 L66 32 L72 52 M44 32 L47 48 L51 56 L47 78 L45 98 M66 32 L63 48 L59 56 L63 78 L65 98',
    viewBox: '0 0 110 110',
  },
  {
    id: 'male_croquis',
    name: 'Male croquis',
    helper: 'Broad athletic runway stance',
    strokePath:
      'M55 12 C58 12 61 15 61 19 C61 23 58 26 55 26 C52 26 49 23 49 19 C49 15 52 12 55 12 Z M53 26 L53 30 L40 32 L34 54 M57 26 L57 30 L70 32 L76 54 M40 32 L45 50 L49 58 L46 80 L44 98 M70 32 L65 50 L61 58 L64 80 L66 98',
    viewBox: '0 0 110 110',
  },
  {
    id: 'neutral_figure',
    name: 'Neutral figure',
    helper: 'Clean balanced studio silhouette',
    strokePath:
      'M55 14 C58 14 60 17 60 21 C60 25 58 27 55 27 C52 27 50 25 50 21 C50 17 52 14 55 14 Z M53 27 L53 31 L43 33 L37 54 M57 27 L57 31 L67 33 L73 54 M43 33 L46 50 L50 57 L47 79 L46 98 M67 33 L64 50 L60 57 L63 79 L64 98',
    viewBox: '0 0 110 110',
  },
];

export const INITIAL_SKETCHES: SketchItem[] = [
  {
    id: 'sketch-1',
    title: 'Blazer study',
    date: 'Oct 24',
    category: 'Western',
    fabricTag: 'Wool twill',
    colorHex: '#1A1A1F',
    templateId: 'blazer',
    strokePath: GARMENT_TEMPLATES[0].strokePath,
    detailPaths: GARMENT_TEMPLATES[0].detailPaths,
    notes: 'Structured shoulder line with wool',
  },
  {
    id: 'sketch-2',
    title: 'Silk slip dress',
    date: 'Nov 02',
    category: 'Western',
    fabricTag: 'Mulberry silk',
    colorHex: '#7F0020',
    templateId: 'slip_dress',
    strokePath: GARMENT_TEMPLATES[2].strokePath,
    detailPaths: GARMENT_TEMPLATES[2].detailPaths,
    notes: 'Bias cut drape for evening',
  },
  {
    id: 'sketch-3',
    title: 'Embroidered lehenga',
    date: 'Nov 08',
    category: 'Eastern',
    fabricTag: 'Raw silk',
    colorHex: '#B85D3A',
    templateId: 'lehenga',
    strokePath: GARMENT_TEMPLATES[8].strokePath,
    detailPaths: GARMENT_TEMPLATES[8].detailPaths,
    notes: 'Twelve kali flare with zardozi',
  },
  {
    id: 'sketch-4',
    title: 'Linen kurta',
    date: 'Nov 12',
    category: 'Eastern',
    fabricTag: 'Pure linen',
    colorHex: '#4E6E5D',
    templateId: 'kurta',
    strokePath: GARMENT_TEMPLATES[6].strokePath,
    detailPaths: GARMENT_TEMPLATES[6].detailPaths,
    notes: 'Band collar minimal daily wear',
  },
  {
    id: 'sketch-5',
    title: 'Minimal trench',
    date: 'Nov 15',
    category: 'Western',
    fabricTag: 'Cotton gabardine',
    colorHex: '#8C7A6B',
    templateId: 'trench',
    strokePath: GARMENT_TEMPLATES[1].strokePath,
    detailPaths: GARMENT_TEMPLATES[1].detailPaths,
    notes: 'Storm flap with horn buttons',
  },
  {
    id: 'sketch-6',
    title: 'Banarasi drape',
    date: 'Nov 16',
    category: 'Eastern',
    fabricTag: 'Brocade weave',
    colorHex: '#4834D4',
    templateId: 'saree',
    strokePath: GARMENT_TEMPLATES[10].strokePath,
    detailPaths: GARMENT_TEMPLATES[10].detailPaths,
    notes: 'Gold thread pallu handloom finish',
  },
];

export const FABRIC_SWATCHES: FabricSwatch[] = [
  { id: 'raw_silk', name: 'Raw silk', fiber: 'Slub texture', texture: 'lustrous', color: '#D4AF37' },
  { id: 'pure_linen', name: 'Pure linen', fiber: 'Open flax weave', texture: 'matte', color: '#C8BAA8' },
  { id: 'cotton_twill', name: 'Cotton twill', fiber: 'Diagonal ribbing', texture: 'matte', color: '#5C636E' },
  { id: 'chiffon', name: 'Silk chiffon', fiber: 'Lightweight sheer', texture: 'sheer', color: '#E8D7D8' },
  { id: 'brocade', name: 'Banarasi brocade', fiber: 'Metallic jacquard', texture: 'lustrous', color: '#9E3248' },
  { id: 'cashmere', name: 'Double cashmere', fiber: 'Brushed wool fleece', texture: 'matte', color: '#3A393E' },
  { id: 'georgette', name: 'Crepe georgette', fiber: 'Granular pebble weave', texture: 'sheer', color: '#4B6584' },
  { id: 'velvet', name: 'Silk velvet', fiber: 'Dense short pile', texture: 'lustrous', color: '#2C1B2E' },
];

export const COLOR_SWATCHES: ColorSwatch[] = [
  { id: 'ink_black', name: 'Ink black', hex: '#0E0E10' },
  { id: 'graphite', name: 'Graphite', hex: '#2C2C34' },
  { id: 'terracotta', name: 'Terracotta', hex: '#B85D3A' },
  { id: 'indigo', name: 'Indigo dye', hex: '#2E3A59' },
  { id: 'sage', name: 'Sage leaf', hex: '#587065' },
  { id: 'raw_umber', name: 'Raw umber', hex: '#7C6757' },
  { id: 'plum', name: 'Studio plum', hex: '#5B3256' },
  { id: 'accent_crimson', name: 'Atelier crimson', hex: '#7F0020' },
];

export const MOODBOARDS: MoodboardItem[] = [
  {
    id: 'board-1',
    title: 'Spring atelier',
    date: 'Nov 14',
    swatchesCount: 8,
    fabrics: ['Pure linen', 'Silk chiffon', 'Raw silk'],
    accentColor: '#587065',
  },
  {
    id: 'board-2',
    title: 'Bridal heritage',
    date: 'Nov 10',
    swatchesCount: 12,
    fabrics: ['Banarasi brocade', 'Silk velvet', 'Mulberry silk'],
    accentColor: '#B85D3A',
  },
  {
    id: 'board-3',
    title: 'Tailored forms',
    date: 'Oct 28',
    swatchesCount: 6,
    fabrics: ['Wool twill', 'Double cashmere', 'Cotton gabardine'],
    accentColor: '#2E3A59',
  },
];
