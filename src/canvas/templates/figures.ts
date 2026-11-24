export interface FigureCroquis {
  id: string;
  name: string; // 1 to 3 words
  view: 'front' | 'side' | 'back';
  gender: 'female' | 'male' | 'neutral';
  strokePath: string;
  centerLinePath: string;
  proportionGuidePaths: { label: string; y: number; path: string }[];
  viewBox: string;
}

export const FIGURE_CROQUIS: FigureCroquis[] = [
  // 1. FEMALE FRONT (9-head proportion)
  {
    id: 'croquis_female_front',
    name: 'Female front',
    view: 'front',
    gender: 'female',
    strokePath:
      'M 200 45 C 210 45 218 56 218 70 C 218 84 210 95 200 95 C 190 95 182 84 182 70 C 182 56 190 45 200 45 Z ' +
      'M 194 95 L 194 110 L 160 120 L 135 200 L 125 290 ' + // Left arm
      'M 206 95 L 206 110 L 240 120 L 265 200 L 275 290 ' + // Right arm
      'M 160 120 C 170 160 178 185 182 210 C 182 230 170 255 165 285 C 160 315 168 450 174 540 L 176 680 ' + // Left torso/leg
      'M 240 120 C 230 160 222 185 218 210 C 218 230 230 255 235 285 C 240 315 232 450 226 540 L 224 680 ' + // Right torso/leg
      'M 190 300 L 186 520 L 190 680 ' + // Inseam left
      'M 210 300 L 214 520 L 210 680', // Inseam right
    centerLinePath: 'M 200 30 L 200 700',
    proportionGuidePaths: [
      { label: 'Head', y: 95, path: 'M 140 95 L 260 95' },
      { label: 'Bust', y: 160, path: 'M 140 160 L 260 160' },
      { label: 'Waist', y: 210, path: 'M 150 210 L 250 210' },
      { label: 'Hip', y: 285, path: 'M 140 285 L 260 285' },
      { label: 'Knee', y: 470, path: 'M 150 470 L 250 470' },
      { label: 'Ankle', y: 650, path: 'M 160 650 L 240 650' },
    ],
    viewBox: '0 0 400 720',
  },

  // 2. FEMALE SIDE
  {
    id: 'croquis_female_side',
    name: 'Female side',
    view: 'side',
    gender: 'female',
    strokePath:
      'M 195 45 C 205 45 212 56 212 70 C 212 84 205 95 195 95 C 185 95 180 84 180 70 C 180 56 185 45 195 45 Z ' +
      'M 190 95 C 186 115 180 145 178 175 C 176 210 185 240 182 280 C 178 330 184 480 188 560 L 190 680 ' + // Back curve
      'M 198 95 C 205 120 216 155 210 185 C 204 210 198 235 204 270 C 210 320 202 480 198 560 L 196 680 ' + // Front curve
      'M 195 120 L 190 200 L 186 290', // Arm silhouette
    centerLinePath: 'M 195 30 L 195 700',
    proportionGuidePaths: [
      { label: 'Head', y: 95, path: 'M 150 95 L 240 95' },
      { label: 'Bust', y: 160, path: 'M 150 160 L 240 160' },
      { label: 'Waist', y: 210, path: 'M 150 210 L 240 210' },
      { label: 'Hip', y: 285, path: 'M 150 285 L 240 285' },
      { label: 'Knee', y: 470, path: 'M 150 470 L 240 470' },
      { label: 'Ankle', y: 650, path: 'M 150 650 L 240 650' },
    ],
    viewBox: '0 0 400 720',
  },

  // 3. FEMALE BACK
  {
    id: 'croquis_female_back',
    name: 'Female back',
    view: 'back',
    gender: 'female',
    strokePath:
      'M 200 45 C 210 45 218 56 218 70 C 218 84 210 95 200 95 C 190 95 182 84 182 70 C 182 56 190 45 200 45 Z ' +
      'M 194 95 L 160 120 L 135 200 L 125 290 ' +
      'M 206 95 L 240 120 L 265 200 L 275 290 ' +
      'M 160 120 C 170 160 178 185 182 210 C 182 230 170 255 165 285 C 160 315 168 450 174 540 L 176 680 ' +
      'M 240 120 C 230 160 222 185 218 210 C 218 230 230 255 235 285 C 240 315 232 450 226 540 L 224 680 ' +
      'M 200 120 L 200 285 ' + // Spine line
      'M 190 300 L 186 520 L 190 680 M 210 300 L 214 520 L 210 680',
    centerLinePath: 'M 200 30 L 200 700',
    proportionGuidePaths: [
      { label: 'Head', y: 95, path: 'M 140 95 L 260 95' },
      { label: 'Waist', y: 210, path: 'M 150 210 L 250 210' },
      { label: 'Hip', y: 285, path: 'M 140 285 L 260 285' },
      { label: 'Knee', y: 470, path: 'M 150 470 L 250 470' },
    ],
    viewBox: '0 0 400 720',
  },

  // 4. MALE FRONT
  {
    id: 'croquis_male_front',
    name: 'Male front',
    view: 'front',
    gender: 'male',
    strokePath:
      'M 200 45 C 210 45 218 56 218 70 C 218 84 210 95 200 95 C 190 95 182 84 182 70 C 182 56 190 45 200 45 Z ' +
      'M 194 95 L 145 115 L 120 200 L 110 290 ' +
      'M 206 95 L 255 115 L 280 200 L 290 290 ' +
      'M 145 115 L 165 220 L 160 290 L 166 540 L 168 680 ' +
      'M 255 115 L 235 220 L 240 290 L 234 540 L 232 680 ' +
      'M 192 300 L 188 530 L 188 680 M 208 300 L 212 530 L 212 680',
    centerLinePath: 'M 200 30 L 200 700',
    proportionGuidePaths: [
      { label: 'Head', y: 95, path: 'M 130 95 L 270 95' },
      { label: 'Chest', y: 155, path: 'M 130 155 L 270 155' },
      { label: 'Waist', y: 220, path: 'M 140 220 L 260 220' },
      { label: 'Hip', y: 290, path: 'M 140 290 L 260 290' },
      { label: 'Knee', y: 475, path: 'M 140 475 L 260 475' },
    ],
    viewBox: '0 0 400 720',
  },

  // 5. NEUTRAL CROQUIS
  {
    id: 'croquis_neutral',
    name: 'Neutral figure',
    view: 'front',
    gender: 'neutral',
    strokePath:
      'M 200 45 C 209 45 216 56 216 70 C 216 84 209 95 200 95 C 191 95 184 84 184 70 C 184 56 191 45 200 45 Z ' +
      'M 194 95 L 152 118 L 128 200 L 118 290 ' +
      'M 206 95 L 248 118 L 272 200 L 282 290 ' +
      'M 152 118 C 162 170 172 215 168 288 L 170 540 L 172 680 ' +
      'M 248 118 C 238 170 228 215 232 288 L 230 540 L 228 680 ' +
      'M 191 300 L 187 530 L 189 680 M 209 300 L 213 530 L 211 680',
    centerLinePath: 'M 200 30 L 200 700',
    proportionGuidePaths: [
      { label: 'Head', y: 95, path: 'M 135 95 L 265 95' },
      { label: 'Waist', y: 215, path: 'M 145 215 L 255 215' },
      { label: 'Hip', y: 288, path: 'M 140 288 L 260 288' },
      { label: 'Knee', y: 472, path: 'M 145 472 L 255 472' },
    ],
    viewBox: '0 0 400 720',
  },
];
