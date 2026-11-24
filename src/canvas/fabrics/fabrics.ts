import { FabricId, PatternId } from '../../types/canvas';

export interface FabricDefinition {
  id: FabricId;
  name: string; // 1 to 2 words
  description: string; // max 6 words
  baseColor: string;
  sheenColor?: string;
  hasShine?: boolean;
  opacity: number;
  patternSvg: string; // SVG pattern element string
}

export interface PatternDefinition {
  id: PatternId;
  name: string; // 1 to 2 words
  description: string; // max 6 words
  patternSvg: string;
  defaultScale: number;
}

export const FABRICS: Record<FabricId, FabricDefinition> = {
  silk: {
    id: 'silk',
    name: 'Raw silk',
    description: 'Lustrous sheen gradient surface',
    baseColor: '#E6C687',
    sheenColor: '#FFF8E7',
    hasShine: true,
    opacity: 0.95,
    patternSvg: `
      <pattern id="pat_silk" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#E6C687" />
        <path d="M 0 10 Q 20 15 40 10 M 0 25 Q 20 30 40 25" stroke="#F7E2B5" stroke-width="0.8" opacity="0.6" fill="none" />
      </pattern>
    `,
  },
  denim: {
    id: 'denim',
    name: 'Denim twill',
    description: 'Indigo diagonal twill ribbing',
    baseColor: '#2D3E50',
    sheenColor: '#4A627A',
    opacity: 1.0,
    patternSvg: `
      <pattern id="pat_denim" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="12" height="12" fill="#2D3E50" />
        <line x1="0" y1="0" x2="12" y2="0" stroke="#4A627A" stroke-width="2.5" />
        <line x1="0" y1="6" x2="12" y2="6" stroke="#212F3D" stroke-width="1.5" />
      </pattern>
    `,
  },
  lace: {
    id: 'lace',
    name: 'Chantilly lace',
    description: 'Intricate floral cutout motif',
    baseColor: '#F2EDE4',
    opacity: 0.85,
    patternSvg: `
      <pattern id="pat_lace" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#FBF9F5" />
        <circle cx="12" cy="12" r="6" stroke="#D3C9B8" stroke-width="1" fill="none" />
        <circle cx="12" cy="12" r="2" fill="#D3C9B8" />
        <path d="M 12 0 L 12 6 M 12 18 L 12 24 M 0 12 L 6 12 M 18 12 L 24 12" stroke="#E5DEC9" stroke-width="0.8" />
      </pattern>
    `,
  },
  wool: {
    id: 'wool',
    name: 'Felt wool',
    description: 'Brushed heathered fiber texture',
    baseColor: '#4A484D',
    opacity: 1.0,
    patternSvg: `
      <pattern id="pat_wool" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#4A484D" />
        <circle cx="4" cy="4" r="1.5" fill="#5F5C64" />
        <circle cx="12" cy="12" r="1.2" fill="#38363A" />
        <circle cx="12" cy="4" r="1" fill="#5F5C64" />
        <circle cx="4" cy="12" r="1.4" fill="#38363A" />
      </pattern>
    `,
  },
  chiffon: {
    id: 'chiffon',
    name: 'Silk chiffon',
    description: 'Semi transparent fluid weave',
    baseColor: '#E8D5D8',
    opacity: 0.45,
    patternSvg: `
      <pattern id="pat_chiffon" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#E8D5D8" opacity="0.45" />
        <path d="M 0 10 Q 10 8 20 10" stroke="#FFF" stroke-width="0.5" opacity="0.5" fill="none" />
      </pattern>
    `,
  },
  velvet: {
    id: 'velvet',
    name: 'Silk velvet',
    description: 'Deep directional plush pile',
    baseColor: '#361527',
    sheenColor: '#6B2C4E',
    hasShine: true,
    opacity: 1.0,
    patternSvg: `
      <pattern id="pat_velvet" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="#361527" />
        <rect x="0" y="0" width="15" height="30" fill="#4A1D35" opacity="0.4" />
      </pattern>
    `,
  },
  brocade: {
    id: 'brocade',
    name: 'Gold brocade',
    description: 'Metallic jacquard floral weave',
    baseColor: '#78182E',
    sheenColor: '#D4AF37',
    hasShine: true,
    opacity: 1.0,
    patternSvg: `
      <pattern id="pat_brocade" width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="28" height="28" fill="#78182E" />
        <path d="M 14 4 L 24 14 L 14 24 L 4 14 Z" stroke="#D4AF37" stroke-width="1.2" fill="none" />
        <circle cx="14" cy="14" r="3" fill="#D4AF37" />
      </pattern>
    `,
  },
  linen: {
    id: 'linen',
    name: 'Pure linen',
    description: 'Natural flax slub texture',
    baseColor: '#DDD5C7',
    opacity: 0.95,
    patternSvg: `
      <pattern id="pat_linen" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#DDD5C7" />
        <line x1="0" y1="5" x2="20" y2="5" stroke="#C4B9A7" stroke-width="1" />
        <line x1="0" y1="15" x2="20" y2="15" stroke="#C4B9A7" stroke-width="0.8" />
        <line x1="8" y1="0" x2="8" y2="20" stroke="#C4B9A7" stroke-width="1" />
        <line x1="18" y1="0" x2="18" y2="20" stroke="#C4B9A7" stroke-width="0.8" />
      </pattern>
    `,
  },
};

export const PATTERNS: Record<PatternId, PatternDefinition> = {
  stripes: {
    id: 'stripes',
    name: 'Pinstripe',
    description: 'Classic vertical tailored lines',
    defaultScale: 1.0,
    patternSvg: `
      <pattern id="pat_stripes" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#F7F4EE" />
        <line x1="8" y1="0" x2="8" y2="16" stroke="#0E0E10" stroke-width="1.5" />
      </pattern>
    `,
  },
  florals: {
    id: 'florals',
    name: 'Atelier floral',
    description: 'Delicate line drawn botanical',
    defaultScale: 1.0,
    patternSvg: `
      <pattern id="pat_florals" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill="#F7F4EE" />
        <circle cx="16" cy="16" r="4" fill="#7F0020" opacity="0.3" />
        <path d="M 16 8 Q 16 16 8 16 Q 16 16 16 24 Q 16 16 24 16 Q 16 16 16 8 Z" stroke="#7F0020" stroke-width="1" fill="none" />
      </pattern>
    `,
  },
  paisley: {
    id: 'paisley',
    name: 'Kashmiri paisley',
    description: 'Eastern ornamental teardrop motif',
    defaultScale: 1.0,
    patternSvg: `
      <pattern id="pat_paisley" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#F7F4EE" />
        <path d="M 18 10 C 26 10 30 18 24 26 C 20 30 14 26 14 20 C 14 14 18 10 18 10 Z" stroke="#B85D3A" stroke-width="1.2" fill="none" />
        <circle cx="18" cy="20" r="2" fill="#B85D3A" />
      </pattern>
    `,
  },
  houndstooth: {
    id: 'houndstooth',
    name: 'Houndstooth',
    description: 'Geometric broken check weave',
    defaultScale: 1.0,
    patternSvg: `
      <pattern id="pat_houndstooth" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#F7F4EE" />
        <polygon points="0,0 10,0 20,10 10,10" fill="#0E0E10" />
        <polygon points="10,10 20,10 20,20 10,20" fill="#0E0E10" />
      </pattern>
    `,
  },
  polka: {
    id: 'polka',
    name: 'Polka dot',
    description: 'Calm balanced micro dots',
    defaultScale: 1.0,
    patternSvg: `
      <pattern id="pat_polka" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#F7F4EE" />
        <circle cx="10" cy="10" r="3" fill="#0E0E10" />
      </pattern>
    `,
  },
  checks: {
    id: 'checks',
    name: 'Madras check',
    description: 'Crisp intersecting grid lines',
    defaultScale: 1.0,
    patternSvg: `
      <pattern id="pat_checks" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#F7F4EE" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="#587065" stroke-width="2" opacity="0.6" />
        <line x1="12" y1="0" x2="12" y2="24" stroke="#587065" stroke-width="2" opacity="0.6" />
      </pattern>
    `,
  },
};
