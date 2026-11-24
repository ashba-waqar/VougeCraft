import { ShapeItem } from '../../types/canvas';

export interface GarmentFlat {
  id: string;
  name: string; // 1 to 3 words
  category: 'Western' | 'Eastern';
  parts: ShapeItem[];
  defaultScale: number;
  fitTransform: { scale: number; x: number; y: number };
}

export const GARMENT_FLATS: GarmentFlat[] = [
  // 1. KURTA (Eastern) - parts can be filled independently!
  {
    id: 'flat_kurta',
    name: 'Straight kurta',
    category: 'Eastern',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'kurta_body',
        type: 'shape',
        name: 'Body',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 170 120 L 230 120 L 236 210 L 246 450 L 154 450 L 164 210 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'kurta_sleeve_left',
        type: 'shape',
        name: 'Left sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 170 120 L 130 200 L 142 210 L 165 155 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'kurta_sleeve_right',
        type: 'shape',
        name: 'Right sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 230 120 L 270 200 L 258 210 L 235 155 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'kurta_collar',
        type: 'shape',
        name: 'Mandarin collar',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 188 112 Q 200 120 212 112 L 210 122 Q 200 128 190 122 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'kurta_placket',
        type: 'shape',
        name: 'Center placket',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 197 122 L 203 122 L 203 210 L 197 210 Z',
        stroke: { color: '#0E0E10', width: 1.2, style: 'solid' },
      },
      {
        id: 'kurta_hem_slit',
        type: 'shape',
        name: 'Hem slit',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 154 442 L 246 442 L 246 450 L 154 450 Z',
        stroke: { color: '#0E0E10', width: 1.2, style: 'solid' },
      },
    ],
  },

  // 2. BLAZER (Western)
  {
    id: 'flat_blazer',
    name: 'Tailored blazer',
    category: 'Western',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'blazer_body',
        type: 'shape',
        name: 'Body',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 160 115 L 240 115 L 235 220 L 238 310 L 162 310 L 165 220 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'blazer_lapel_left',
        type: 'shape',
        name: 'Left lapel',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 185 115 L 168 150 L 196 215 L 196 115 Z',
        stroke: { color: '#0E0E10', width: 1.3, style: 'solid' },
      },
      {
        id: 'blazer_lapel_right',
        type: 'shape',
        name: 'Right lapel',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 215 115 L 232 150 L 204 215 L 204 115 Z',
        stroke: { color: '#0E0E10', width: 1.3, style: 'solid' },
      },
      {
        id: 'blazer_sleeve_left',
        type: 'shape',
        name: 'Left sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 160 115 L 122 230 L 138 238 L 165 170 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'blazer_sleeve_right',
        type: 'shape',
        name: 'Right sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 240 115 L 278 230 L 262 238 L 235 170 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'blazer_pocket',
        type: 'shape',
        name: 'Welt pocket',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 168 250 L 186 250 L 186 256 L 168 256 Z',
        stroke: { color: '#0E0E10', width: 1.2, style: 'solid' },
      },
    ],
  },

  // 3. TRENCH (Western)
  {
    id: 'flat_trench',
    name: 'Classic trench',
    category: 'Western',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'trench_body',
        type: 'shape',
        name: 'Body',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 162 118 L 238 118 L 236 215 L 255 490 L 145 490 L 164 215 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'trench_storm_flap',
        type: 'shape',
        name: 'Storm flap',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 200 120 L 235 120 L 235 170 L 200 185 Z',
        stroke: { color: '#0E0E10', width: 1.3, style: 'solid' },
      },
      {
        id: 'trench_belt',
        type: 'shape',
        name: 'Waist belt',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 158 210 L 242 210 L 242 222 L 158 222 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
      {
        id: 'trench_sleeve_left',
        type: 'shape',
        name: 'Left sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 162 118 L 120 250 L 135 255 L 164 175 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'trench_sleeve_right',
        type: 'shape',
        name: 'Right sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 238 118 L 280 250 L 265 255 L 236 175 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
    ],
  },

  // 4. SLIP DRESS (Western)
  {
    id: 'flat_slip_dress',
    name: 'Slip dress',
    category: 'Western',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'slip_bodice',
        type: 'shape',
        name: 'Bodice',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 175 140 Q 200 152 225 140 L 222 210 L 178 210 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'slip_skirt',
        type: 'shape',
        name: 'Skirt',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 178 210 L 222 210 L 245 470 Q 200 460 155 470 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'slip_straps',
        type: 'shape',
        name: 'Straps',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 178 115 L 182 115 L 180 142 L 176 142 Z M 218 115 L 222 115 L 224 142 L 220 142 Z',
        stroke: { color: '#0E0E10', width: 1.2, style: 'solid' },
      },
    ],
  },

  // 5. JEANS (Western)
  {
    id: 'flat_jeans',
    name: 'Denim jeans',
    category: 'Western',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'jeans_leg_left',
        type: 'shape',
        name: 'Left leg',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 166 220 L 198 220 L 196 295 L 190 550 L 165 550 L 164 290 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'jeans_leg_right',
        type: 'shape',
        name: 'Right leg',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 202 220 L 234 220 L 236 290 L 235 550 L 210 550 L 204 295 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'jeans_waistband',
        type: 'shape',
        name: 'Waistband',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 166 210 L 234 210 L 234 220 L 166 220 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
      {
        id: 'jeans_pocket_left',
        type: 'shape',
        name: 'Left scoop',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 168 222 Q 178 238 186 222 Z',
        stroke: { color: '#0E0E10', width: 1.2, style: 'solid' },
      },
    ],
  },

  // 6. POPLIN SHIRT (Western)
  {
    id: 'flat_shirt',
    name: 'Poplin shirt',
    category: 'Western',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'shirt_body',
        type: 'shape',
        name: 'Body',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 168 120 L 232 120 L 230 250 L 170 250 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'shirt_collar',
        type: 'shape',
        name: 'Collar',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 188 116 L 200 125 L 212 116 L 206 112 L 194 112 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
      {
        id: 'shirt_sleeve_left',
        type: 'shape',
        name: 'Left sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 168 120 L 132 210 L 146 216 L 167 155 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'shirt_sleeve_right',
        type: 'shape',
        name: 'Right sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 232 120 L 268 210 L 254 216 L 233 155 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'shirt_pocket',
        type: 'shape',
        name: 'Chest pocket',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 176 150 L 190 150 L 190 166 L 183 172 L 176 166 Z',
        stroke: { color: '#0E0E10', width: 1.2, style: 'solid' },
      },
    ],
  },

  // 7. PLEATED SKIRT (Western)
  {
    id: 'flat_skirt',
    name: 'Pleated skirt',
    category: 'Western',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'skirt_waist',
        type: 'shape',
        name: 'Waistband',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 175 210 L 225 210 L 225 218 L 175 218 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
      {
        id: 'skirt_pleats',
        type: 'shape',
        name: 'Knife pleats',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 175 218 L 225 218 L 250 420 L 150 420 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
    ],
  },

  // 8. SHERWANI (Eastern)
  {
    id: 'flat_sherwani',
    name: 'Royal sherwani',
    category: 'Eastern',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'sherwani_body',
        type: 'shape',
        name: 'Achkan coat',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 164 116 L 236 116 L 238 220 L 242 460 L 158 460 L 162 220 Z',
        stroke: { color: '#0E0E10', width: 1.6, style: 'solid' },
      },
      {
        id: 'sherwani_collar',
        type: 'shape',
        name: 'Nehru collar',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 188 110 Q 200 116 212 110 L 210 118 Q 200 124 190 118 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'sherwani_sleeve_left',
        type: 'shape',
        name: 'Left sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 164 116 L 126 230 L 140 236 L 166 160 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'sherwani_sleeve_right',
        type: 'shape',
        name: 'Right sleeve',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 236 116 L 274 230 L 260 236 L 234 160 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'sherwani_buttons',
        type: 'shape',
        name: 'Button row',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 198 124 L 202 124 L 202 460 L 198 460 Z',
        stroke: { color: '#0E0E10', width: 1.2, style: 'solid' },
      },
    ],
  },

  // 9. LEHENGA (Eastern)
  {
    id: 'flat_lehenga',
    name: 'Kalidar lehenga',
    category: 'Eastern',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'lehenga_choli',
        type: 'shape',
        name: 'Choli blouse',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 174 120 L 226 120 L 228 175 L 172 175 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'lehenga_skirt',
        type: 'shape',
        name: 'Flared skirt',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 175 205 L 225 205 L 285 530 Q 200 500 115 530 Z',
        stroke: { color: '#0E0E10', width: 1.6, style: 'solid' },
      },
      {
        id: 'lehenga_border',
        type: 'shape',
        name: 'Hem border',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 125 515 Q 200 488 275 515 L 285 530 Q 200 500 115 530 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
    ],
  },

  // 10. SHARARA (Eastern)
  {
    id: 'flat_sharara',
    name: 'Tiered sharara',
    category: 'Eastern',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'sharara_thigh_left',
        type: 'shape',
        name: 'Left thigh',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 172 210 L 198 210 L 195 320 L 165 320 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
      {
        id: 'sharara_thigh_right',
        type: 'shape',
        name: 'Right thigh',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 202 210 L 228 210 L 235 320 L 205 320 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
      {
        id: 'sharara_flare_left',
        type: 'shape',
        name: 'Left flare',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 165 320 L 195 320 L 200 540 L 120 540 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'sharara_flare_right',
        type: 'shape',
        name: 'Right flare',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 205 320 L 235 320 L 280 540 L 200 540 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
    ],
  },

  // 11. SAREE DRAPE (Eastern)
  {
    id: 'flat_saree',
    name: 'Draped saree',
    category: 'Eastern',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'saree_blouse',
        type: 'shape',
        name: 'Blouse',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 175 120 L 225 120 L 226 170 L 174 170 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
      {
        id: 'saree_fall',
        type: 'shape',
        name: 'Skirt fall',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 175 210 L 225 210 L 235 540 L 165 540 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'saree_pallu',
        type: 'shape',
        name: 'Pallu drape',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 174 120 L 225 170 L 190 280 L 130 520 L 115 480 L 160 120 Z',
        stroke: { color: '#0E0E10', width: 1.6, style: 'solid' },
      },
      {
        id: 'saree_border',
        type: 'shape',
        name: 'Zari border',
        shapeType: 'path',
        closed: true,
        svgPath: 'M 115 480 L 130 520 L 125 530 L 110 490 Z',
        stroke: { color: '#0E0E10', width: 1.4, style: 'solid' },
      },
    ],
  },

  // 12. DUPATTA (Eastern)
  {
    id: 'flat_dupatta',
    name: 'Fluid dupatta',
    category: 'Eastern',
    defaultScale: 1.0,
    fitTransform: { scale: 1.0, x: 0, y: 0 },
    parts: [
      {
        id: 'dupatta_body',
        type: 'shape',
        name: 'Drape body',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 140 120 Q 200 160 260 120 L 280 500 Q 200 460 120 500 Z',
        stroke: { color: '#0E0E10', width: 1.5, style: 'solid' },
      },
      {
        id: 'dupatta_border',
        type: 'shape',
        name: 'Border hem',
        shapeType: 'path',
        closed: true,
        svgPath:
          'M 120 488 Q 200 448 280 488 L 280 500 Q 200 460 120 500 Z',
        stroke: { color: '#0E0E10', width: 1.3, style: 'solid' },
      },
    ],
  },
];
