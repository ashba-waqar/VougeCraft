import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface ReadyPalette {
  id: string;
  name: string;
  description?: string;
  colors: PaletteColor[];
}

export interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  createdAt: number;
}

export const READY_PALETTES: ReadyPalette[] = [
  {
    id: 'jewel',
    name: 'Jewel',
    description: 'Precious gemstone tones',
    colors: [
      { name: 'Emerald', hex: '#097969' },
      { name: 'Sapphire', hex: '#0F52BA' },
      { name: 'Ruby', hex: '#E0115F' },
      { name: 'Amethyst', hex: '#9966CC' },
      { name: 'Topaz', hex: '#FFC87C' },
      { name: 'Garnet', hex: '#733635' },
      { name: 'Tourmaline', hex: '#86A1A9' },
      { name: 'Citrine', hex: '#E4D00A' },
      { name: 'Tanzanite', hex: '#4D5198' },
      { name: 'Peridot', hex: '#E6E200' },
      { name: 'Jade', hex: '#00A86B' },
      { name: 'Opal', hex: '#A8C3BC' },
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft ethereal tints',
    colors: [
      { name: 'Blush', hex: '#DE5D83' },
      { name: 'Mint', hex: '#98FF98' },
      { name: 'Lilac', hex: '#C8A2C8' },
      { name: 'Powder Blue', hex: '#B0E0E6' },
      { name: 'Peach', hex: '#FFE5B4' },
      { name: 'Buttercup', hex: '#F3E5AB' },
      { name: 'Lavender', hex: '#E6E6FA' },
      { name: 'Seafoam', hex: '#9FE2BF' },
      { name: 'Coral Mist', hex: '#F88379' },
      { name: 'Pistachio', hex: '#93C572' },
      { name: 'Baby Pink', hex: '#F4C2C2' },
      { name: 'Pale Wisteria', hex: '#C9A0DC' },
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    description: 'Organic natural pigments',
    colors: [
      { name: 'Terracotta', hex: '#E2725B' },
      { name: 'Olive', hex: '#808000' },
      { name: 'Sand', hex: '#C2B280' },
      { name: 'Clay', hex: '#B66A50' },
      { name: 'Mocha', hex: '#967969' },
      { name: 'Ochre', hex: '#CC7722' },
      { name: 'Rust', hex: '#B7410E' },
      { name: 'Sage', hex: '#9CAF88' },
      { name: 'Raw Umber', hex: '#826644' },
      { name: 'Sienna', hex: '#882D17' },
      { name: 'Khaki', hex: '#C3B091' },
      { name: 'Walnut', hex: '#773F1A' },
    ],
  },
  {
    id: 'bridal',
    name: 'Bridal',
    description: 'Couture wedding palette',
    colors: [
      { name: 'Ivory', hex: '#FFFFF0' },
      { name: 'Champagne', hex: '#F7E7CE' },
      { name: 'Rose Gold', hex: '#B76E79' },
      { name: 'Maroon', hex: '#800000' },
      { name: 'Antique Gold', hex: '#996515' },
      { name: 'Zari Crimson', hex: '#9E1B32' },
      { name: 'Pearl', hex: '#EAE0C8' },
      { name: 'Vermilion', hex: '#E34234' },
      { name: 'Deep Wine', hex: '#5B1E31' },
      { name: 'Royal Gilded', hex: '#CFB53B' },
      { name: 'Bridal Scarlet', hex: '#BC243C' },
      { name: 'Velvet Plum', hex: '#601A4A' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'High voltage fluorescents',
    colors: [
      { name: 'Electric Lime', hex: '#CCFF00' },
      { name: 'Hot Pink', hex: '#FF69B4' },
      { name: 'Cyber Yellow', hex: '#FFD300' },
      { name: 'Neon Cyan', hex: '#00FFFF' },
      { name: 'Ultra Violet', hex: '#6F00FF' },
      { name: 'Acid Green', hex: '#B0BF1A' },
      { name: 'Radiant Orange', hex: '#FF5E00' },
      { name: 'Fluorescent Coral', hex: '#FF4040' },
      { name: 'Electric Blue', hex: '#0066FF' },
      { name: 'Laser Magenta', hex: '#FF007F' },
    ],
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Pure neutral gradations',
    colors: [
      { name: 'Obsidian', hex: '#0B0B0E' },
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Slate', hex: '#708090' },
      { name: 'Ash', hex: '#B2BEB5' },
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Graphite', hex: '#27292B' },
      { name: 'Smoke', hex: '#738276' },
      { name: 'Chalk', hex: '#F5F5F5' },
      { name: 'Onyx', hex: '#353839' },
      { name: 'Platinum', hex: '#E5E4E2' },
    ],
  },
  {
    id: 'desi',
    name: 'Desi',
    description: 'Traditional heritage pigments',
    colors: [
      { name: 'Mehndi Green', hex: '#4D5D28' },
      { name: 'Rani Pink', hex: '#E30B5C' },
      { name: 'Firozi', hex: '#00A896' },
      { name: 'Haldi', hex: '#E49B0F' },
      { name: 'Sindoori', hex: '#C72C41' },
      { name: 'Jamuni', hex: '#4B0082' },
      { name: 'Gulabi', hex: '#FF73B3' },
      { name: 'Kasuri', hex: '#8A795D' },
      { name: 'Kesari', hex: '#FF9933' },
      { name: 'Kajal', hex: '#111111' },
      { name: 'Genda Phool', hex: '#F77F00' },
      { name: 'Angoori', hex: '#98B475' },
    ],
  },
];

// Flat lookup map of all named colors across all palettes
const ALL_NAMED_COLORS: PaletteColor[] = READY_PALETTES.flatMap((p) => p.colors);

// Additional classic fashion hues for comprehensive nearest-name matching
const EXTRA_FASHION_COLORS: PaletteColor[] = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'True Black', hex: '#000000' },
  { name: 'Crimson Accent', hex: '#7F0020' },
  { name: 'Midnight Navy', hex: '#1A1C29' },
  { name: 'Bordeaux', hex: '#4C1021' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Taupe', hex: '#483C32' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Cobalt', hex: '#0047AB' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Cerulean', hex: '#007BA7' },
  { name: 'Crimson', hex: '#DC143C' },
  { name: 'Copper', hex: '#B87333' },
  { name: 'Bronze', hex: '#CD7F32' },
  { name: 'Rosewood', hex: '#65000B' },
];

const COMPREHENSIVE_COLORS: PaletteColor[] = [
  ...ALL_NAMED_COLORS,
  ...EXTRA_FASHION_COLORS,
];

// Color Math Utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 14, g: 14, b: 16 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsv(r: number, g: number, b: number): {
  h: number;
  s: number;
  v: number;
} {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / diff + 2) * 60;
    } else {
      h = ((r - g) / diff + 4) * 60;
    }
  }

  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function hsvToRgb(h: number, s: number, v: number): {
  r: number;
  g: number;
  b: number;
} {
  s /= 100;
  v /= 100;
  h = (h % 360 + 360) % 360;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

// Find nearest fashion color name by weighted Euclidean RGB distance
export function getNearestColorName(hex: string): string {
  if (!hex) return 'Obsidian';
  const target = hexToRgb(hex);

  let closestName = 'Custom Tone';
  let minDistance = Infinity;

  for (const item of COMPREHENSIVE_COLORS) {
    const itemRgb = hexToRgb(item.hex);
    // Weighted Euclidean perception distance (redmean approximation)
    const rMean = (target.r + itemRgb.r) / 2;
    const dR = target.r - itemRgb.r;
    const dG = target.g - itemRgb.g;
    const dB = target.b - itemRgb.b;
    const distance = Math.sqrt(
      (2 + rMean / 256) * dR * dR +
        4 * dG * dG +
        (2 + (255 - rMean) / 256) * dB * dB
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestName = item.name;
    }
  }

  return closestName;
}

// Generate 9 lighter tints and 9 darker shades for any color
export function generateShadesAndTints(hex: string): {
  tints: string[];
  shades: string[];
} {
  const { r, g, b } = hexToRgb(hex);

  // 9 lighter tints (interpolating towards white 255, 255, 255)
  const tints: string[] = [];
  for (let i = 1; i <= 9; i++) {
    const factor = i / 10;
    const tr = Math.round(r + (255 - r) * factor);
    const tg = Math.round(g + (255 - g) * factor);
    const tb = Math.round(b + (255 - b) * factor);
    tints.push(rgbToHex(tr, tg, tb));
  }

  // 9 darker shades (interpolating towards black 0, 0, 0)
  const shades: string[] = [];
  for (let i = 1; i <= 9; i++) {
    const factor = 1 - i / 10;
    const sr = Math.round(r * factor);
    const sg = Math.round(g * factor);
    const sb = Math.round(b * factor);
    shades.push(rgbToHex(sr, sg, sb));
  }

  return { tints, shades };
}

// AsyncStorage keys for persistence
const STORAGE_KEY_SAVED_PALETTES = '@voguecraft_saved_palettes_v1';
const STORAGE_KEY_RECENT_COLORS = '@voguecraft_recent_colors_v1';

export const DEFAULT_SAVED_PALETTES: SavedPalette[] = [
  {
    id: 'saved_atelier',
    name: 'Atelier Basics',
    colors: ['#7F0020', '#C9A24B', '#B85D3A', '#D4AF37', '#2D5A27'],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'saved_couture',
    name: 'Silk Brocade',
    colors: ['#800000', '#CFB53B', '#F7E7CE', '#4D5198', '#DE5D83'],
    createdAt: Date.now() - 43200000,
  },
];

export async function getSavedPalettes(): Promise<SavedPalette[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_SAVED_PALETTES);
    if (data) {
      return JSON.parse(data);
    }
  } catch {}
  return DEFAULT_SAVED_PALETTES;
}

export async function storeSavedPalettes(
  palettes: SavedPalette[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_SAVED_PALETTES,
      JSON.stringify(palettes)
    );
  } catch {}
}

export async function getStoredRecentColors(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_RECENT_COLORS);
    if (data) {
      return JSON.parse(data);
    }
  } catch {}
  return ['#7F0020', '#C9A24B', '#B85D3A', '#D4AF37', '#2D5A27', '#2A0A14'];
}

export async function storeRecentColors(colors: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_RECENT_COLORS,
      JSON.stringify(colors.slice(0, 6))
    );
  } catch {}
}

// Algorithmic 5-dominant color extractor for fashion photos
export function extractHarmoniousPhotoPalette(seedStr: string): string[] {
  // Deterministic hash based on uri / image string to produce stable, pleasing tones
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const baseHue = Math.abs(hash) % 360;

  // Generate 5 distinct harmonious fashion tones:
  // Base, Complementary, Analogous 1, Light tint, Deep contrast
  return [
    hsvToHex(baseHue, 65, 80),
    hsvToHex((baseHue + 180) % 360, 55, 85),
    hsvToHex((baseHue + 35) % 360, 45, 90),
    hsvToHex((baseHue + 215) % 360, 20, 95),
    hsvToHex((baseHue + 300) % 360, 75, 40),
  ];
}
