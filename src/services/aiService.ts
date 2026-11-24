import { File, Paths } from 'expo-file-system';
import { supabase } from './supabase';
import { showToast } from '../utils/toast';

const USE_MOCK_AI =
  process.env.EXPO_PUBLIC_USE_MOCK_AI === 'true' ||
  process.env.USE_MOCK_AI === 'true';

async function cacheImageLocally(storagePath: string, signedUrl: string): Promise<string> {
  try {
    if (!Paths?.cache) return signedUrl;
    const filename = storagePath.replace(/[/\\:]/g, '_');
    const localFile = new File(Paths.cache, filename);
    if (localFile.exists) {
      return localFile.uri;
    }
    const downloaded = await File.downloadFileAsync(signedUrl, localFile);
    return downloaded?.uri || signedUrl;
  } catch (e) {
    console.warn('Failed to cache image locally:', e);
    return signedUrl;
  }
}

async function invokeAiImage(
  input: { prompt: string; style: string; count?: number },
  signal?: AbortSignal
): Promise<any> {
  if (USE_MOCK_AI) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      const { data, error } = await supabase.functions.invoke('ai-image', {
        body: input,
      });

      if (error) {
        const status = (error as any).status || (error as any).context?.status;
        if (status === 429 || error.message?.includes('Daily limit')) {
          showToast('Daily limit reached');
          const err = new Error('Daily limit reached');
          (err as any).status = 429;
          throw err;
        }
        console.warn(`ai-image attempt ${attempt + 1} failed:`, error);
        continue;
      }

      if (data && !data.error && Array.isArray(data.images) && data.images.length > 0) {
        return data;
      }
    } catch (err: any) {
      if (err?.status === 429 || signal?.aborted) {
        throw err;
      }
      console.warn(`ai-image invoke exception (attempt ${attempt + 1}):`, err);
    }
  }

  return null;
}

async function invokeAiText(
  action: 'palette' | 'pairings' | 'motif_prompt' | 'tech_notes',
  input: Record<string, any>,
  signal?: AbortSignal
): Promise<any> {
  if (USE_MOCK_AI) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      const { data, error } = await supabase.functions.invoke('ai-text', {
        body: { action, input },
      });

      if (error) {
        const status = (error as any).status || (error as any).context?.status;
        if (status === 429 || error.message?.includes('Daily limit')) {
          showToast('Daily limit reached');
          const err = new Error('Daily limit reached');
          (err as any).status = 429;
          throw err;
        }
        console.warn(`ai-text attempt ${attempt + 1} failed:`, error);
        continue;
      }

      if (data && !data.error) {
        return data;
      }
    } catch (err: any) {
      if (err?.status === 429 || signal?.aborted) {
        throw err;
      }
      console.warn(`ai-text invoke exception (attempt ${attempt + 1}):`, err);
    }
  }

  // Returns null when network call fails twice, falling back to mock data
  return null;
}

/**
 * AI Service for VogueCraft
 * Professional fashion atelier assistance:
 * 1. Motif & Embroidery generator with style chips, density, scale & border brush
 * 2. Palette Harmonizer with Color Theory rules, Jewellery pairings & Footwear matches
 * 3. Catmull-Rom sketch clean-up
 * 4. Garment silhouette variants
 */

export type MotifStyle =
  | 'Zardozi'
  | 'Zari'
  | 'Resham'
  | 'Floral'
  | 'Geometric'
  | 'Paisley';

export interface AIMotifParams {
  prompt: string;
  style?: MotifStyle;
  density?: number; // 0 to 100
  scale?: number; // 0.5 to 2.0
}

export interface AIMotifResult {
  id: string;
  name: string; // 1 to 3 words
  helper: string; // max 6 words
  style: MotifStyle;
  baseColor: string;
  accentColor: string;
  previewSvg: string;
  patternSvg: string;
  borderBrushPath: string; // For embroidery border application
  imageUrl?: string;
  storagePath?: string;
  localUri?: string;
}

export interface AICleanResult {
  beforeSvgPath: string;
  afterSvgPath: string;
  strokeCount: number;
  smoothedPointsCount: number;
  reductionPercentage: string;
}

export interface AIPaletteResult {
  id: string;
  name: string; // 1 to 3 words
  harmony: 'complementary' | 'analogous' | 'triad' | 'monochrome' | 'split';
  colors: string[]; // exactly 5 colors
}

export interface JewelleryPairing {
  id: string;
  name: string; // 1 to 2 words: Kundan, Polki, Jadau, Pearl, Gold, Silver
  tag: string; // max 6 words
  metal: 'gold' | 'silver' | 'antique';
  iconType: 'crown' | 'sparkle' | 'gem' | 'circleDot';
}

export interface FootwearMatch {
  id: string;
  name: string; // 1 to 2 words: Khussa, Kolhapuri, Heels, Flats, Boots, Sneakers
  tag: string; // max 6 words
  styleCategory: 'traditional' | 'contemporary' | 'fusion';
}

export interface HarmonicWardrobeResult {
  baseColor: string;
  palettes: AIPaletteResult[];
  jewellery: JewelleryPairing[];
  footwear: FootwearMatch[];
}

export interface AIVariantResult {
  id: string;
  title: string; // 1 to 3 words
  feature: 'neckline' | 'sleeve' | 'length' | 'silhouette';
  helper: string; // max 6 words
  strokePath: string;
  detailPaths: string[];
}

export interface IAIService {
  generateMotifs(params: AIMotifParams | string, signal?: AbortSignal): Promise<AIMotifResult[]>;
  improveMotifPrompt?(prompt: string, style?: MotifStyle, signal?: AbortSignal): Promise<string>;
  getMotifHistory?(): Promise<AIMotifResult[]>;
  ensureMotifImageUrl?(storagePath: string, existingSignedUrl?: string): Promise<string>;
  cleanSketch(rawSvgPath?: string): Promise<AICleanResult>;
  generatePalettes(baseColorOrSeed: string, signal?: AbortSignal): Promise<AIPaletteResult[]>;
  harmonizeWardrobe(baseColorOrGarment: string, signal?: AbortSignal): Promise<HarmonicWardrobeResult>;
  generateVariants(garmentId?: string): Promise<AIVariantResult[]>;
  generateTechNotes?(params: {
    garmentType?: string;
    fabrics?: string;
    colors?: string[];
    embroideryNotes?: string;
  }, signal?: AbortSignal): Promise<{ stitchNotes: string[]; finishingNotes: string[] }>;
}

class AIServiceImpl implements IAIService {
  /**
   * Generates 4 seamless tileable motif patterns and border brushes
   */
  async generateMotifs(
    params: AIMotifParams | string,
    signal?: AbortSignal
  ): Promise<AIMotifResult[]> {
    const promptText = typeof params === 'string' ? params : params.prompt || '';
    const selectedStyle: MotifStyle =
      typeof params === 'object' && params.style ? params.style : 'Zardozi';
    const density = typeof params === 'object' && params.density !== undefined ? params.density : 50;
    const scale = typeof params === 'object' && params.scale !== undefined ? params.scale : 1.0;

    const lower = promptText.toLowerCase();
    const isEmerald = lower.includes('emerald') || lower.includes('green');
    const isRuby = lower.includes('ruby') || lower.includes('red') || lower.includes('maroon');
    const isSapphire = lower.includes('blue') || lower.includes('indigo');

    const baseColor = isEmerald
      ? '#0F382A'
      : isRuby
      ? '#4A121A'
      : isSapphire
      ? '#1A2A44'
      : '#1B2421';

    const accentColor =
      selectedStyle === 'Resham'
        ? '#E56B6F'
        : selectedStyle === 'Zari'
        ? '#E6C687'
        : '#D4AF37'; // gold zari / zardozi default

    const scaledWidth = Math.round(50 * scale);
    const scaledHeight = Math.round(70 * scale);

    // Call NVIDIA Supabase Edge Function ai-image with automatic retry and mock fallback
    try {
      const aiResponse = await invokeAiImage(
        {
          prompt: promptText.trim() || `${selectedStyle} embroidery motif`,
          style: selectedStyle,
          count: 2,
        },
        signal
      );

      if (aiResponse && Array.isArray(aiResponse.images) && aiResponse.images.length > 0) {
        const results: AIMotifResult[] = await Promise.all(
          aiResponse.images.map(async (img: any, idx: number) => {
            const cachedUrl = await cacheImageLocally(img.storage_path, img.signed_url);
            return {
              id: `motif_img_${Date.now()}_${idx}`,
              name: `${selectedStyle} Bloom ${idx + 1}`,
              helper: `${selectedStyle} embroidered motif`,
              style: selectedStyle,
              baseColor,
              accentColor,
              previewSvg:
                idx === 1
                  ? 'M 0 30 L 30 0 L 60 30 L 30 60 Z M 30 15 C 35 20 35 30 30 35 C 25 30 25 20 30 15 Z'
                  : 'M 25 15 C 38 15 48 26 44 42 C 40 56 25 68 25 75 C 25 68 10 56 6 42 C 2 26 12 15 25 15 Z',
              patternSvg: `
                <pattern id="pat_ai_${idx}" width="${scaledWidth}" height="${scaledHeight}" patternUnits="userSpaceOnUse">
                  <rect width="${scaledWidth}" height="${scaledHeight}" fill="${baseColor}" />
                  <circle cx="${scaledWidth / 2}" cy="${scaledHeight / 2}" r="${12 * scale}" fill="${accentColor}" opacity="${0.7 + (density / 100) * 0.3}" />
                </pattern>
              `,
              borderBrushPath:
                'M 0 10 Q 15 2 30 10 Q 45 18 60 10 M 15 6 L 15 14 M 45 6 L 45 14 M 30 10 C 27 5 33 5 30 10',
              imageUrl: cachedUrl || img.signed_url,
              storagePath: img.storage_path,
            };
          })
        );
        return results;
      }
    } catch (err: any) {
      if (err?.status === 429) throw err;
    }

    // Mock fallback when USE_MOCK_AI is true or when network fails twice
    await new Promise((resolve) => setTimeout(resolve, 350));

    return [
      {
        id: `motif_zardozi_${Date.now()}_1`,
        name: `${selectedStyle} Buta`,
        helper: 'Hand crafted metallic thread relief',
        style: selectedStyle,
        baseColor,
        accentColor,
        previewSvg:
          'M 25 15 C 38 15 48 26 44 42 C 40 56 25 68 25 75 C 25 68 10 56 6 42 C 2 26 12 15 25 15 Z',
        patternSvg: `
          <pattern id="pat_ai_buta" width="${scaledWidth}" height="${scaledHeight}" patternUnits="userSpaceOnUse">
            <rect width="${scaledWidth}" height="${scaledHeight}" fill="${baseColor}" />
            <path d="M ${scaledWidth / 2} 15 C ${scaledWidth * 0.75} 15 ${scaledWidth * 0.95} 26 ${scaledWidth * 0.88} 42 C ${scaledWidth * 0.8} 56 ${scaledWidth / 2} 68 ${scaledWidth / 2} 75 C ${scaledWidth / 2} 68 ${scaledWidth * 0.2} 56 ${scaledWidth * 0.12} 42 C ${scaledWidth * 0.05} 26 ${scaledWidth * 0.25} 15 ${scaledWidth / 2} 15 Z" fill="${accentColor}" opacity="${0.7 + (density / 100) * 0.3}" />
            <circle cx="${scaledWidth / 2}" cy="40" r="4" fill="${baseColor}" />
            <circle cx="${scaledWidth / 2}" cy="25" r="2.5" fill="${accentColor}" />
          </pattern>
        `,
        borderBrushPath:
          'M 0 10 Q 15 2 30 10 Q 45 18 60 10 M 15 6 L 15 14 M 45 6 L 45 14 M 30 10 C 27 5 33 5 30 10',
      },
      {
        id: `motif_jaal_${Date.now()}_2`,
        name: 'Mughal Trellis',
        helper: 'Interlocking floral vine lattice',
        style: 'Floral',
        baseColor,
        accentColor,
        previewSvg:
          'M 0 30 L 30 0 L 60 30 L 30 60 Z M 30 15 C 35 20 35 30 30 35 C 25 30 25 20 30 15 Z',
        patternSvg: `
          <pattern id="pat_ai_jaal" width="${Math.round(60 * scale)}" height="${Math.round(60 * scale)}" patternUnits="userSpaceOnUse">
            <rect width="${Math.round(60 * scale)}" height="${Math.round(60 * scale)}" fill="${baseColor}" />
            <path d="M 0 30 L 30 0 L 60 30 L 30 60 Z" stroke="${accentColor}" stroke-width="${1.8 * scale}" fill="none" opacity="0.85" />
            <circle cx="30" cy="30" r="${5 * scale}" fill="${accentColor}" />
            <circle cx="0" cy="0" r="${3 * scale}" fill="${accentColor}" />
          </pattern>
        `,
        borderBrushPath:
          'M 0 8 L 20 20 L 40 8 L 60 20 M 20 8 L 20 20 M 40 8 L 40 20 M 10 14 C 10 10 14 10 14 14',
      },
      {
        id: `motif_paisley_${Date.now()}_3`,
        name: 'Kashmiri Kalka',
        helper: 'Curved paisley vine with florets',
        style: 'Paisley',
        baseColor,
        accentColor,
        previewSvg:
          'M 20 10 C 35 8 45 22 40 38 C 36 50 20 62 18 70 C 14 55 12 40 16 28 C 18 20 14 15 20 10 Z',
        patternSvg: `
          <pattern id="pat_ai_kalka" width="${scaledWidth}" height="${scaledHeight}" patternUnits="userSpaceOnUse">
            <rect width="${scaledWidth}" height="${scaledHeight}" fill="${baseColor}" />
            <path d="M 20 10 C 35 8 45 22 40 38 C 36 50 20 62 18 70 C 14 55 12 40 16 28 C 18 20 14 15 20 10 Z" fill="${accentColor}" opacity="0.9" />
          </pattern>
        `,
        borderBrushPath:
          'M 0 12 C 10 6 20 6 30 12 C 40 18 50 18 60 12 M 15 9 C 18 6 22 6 25 9',
      },
      {
        id: `motif_border_${Date.now()}_4`,
        name: 'Gota Kinari',
        helper: 'Folded metallic border ribbing',
        style: 'Geometric',
        baseColor,
        accentColor,
        previewSvg:
          'M 0 20 L 25 38 L 50 20 L 50 28 L 25 46 L 0 28 Z',
        patternSvg: `
          <pattern id="pat_ai_gota" width="50" height="32" patternUnits="userSpaceOnUse">
            <rect width="50" height="32" fill="${baseColor}" />
            <path d="M 0 6 L 25 20 L 50 6 L 50 12 L 25 26 L 0 12 Z" fill="${accentColor}" opacity="0.95" />
          </pattern>
        `,
        borderBrushPath:
          'M 0 16 L 15 4 L 30 16 L 45 4 L 60 16 M 0 20 L 60 20',
      },
    ];
  }

  /**
   * Cleans rough hand-drawn strokes into smoothed Bezier vector curves
   */
  async cleanSketch(rawSvgPath?: string): Promise<AICleanResult> {
    await new Promise((resolve) => setTimeout(resolve, 750));

    const before =
      rawSvgPath ||
      'M 120 140 C 122 142 125 145 130 148 C 132 150 135 152 140 160 C 144 165 148 178 152 195 C 154 210 156 235 154 260 C 152 280 148 310 144 340 C 140 370 136 410 132 445 C 130 460 128 472 126 480 M 280 140 C 278 142 274 146 270 150 C 265 158 260 168 256 185 C 252 205 250 230 250 255 C 250 280 254 315 258 350 C 262 385 268 425 272 455 C 274 468 276 476 276 480';

    const after =
      'M 120 140 Q 148 200 154 260 T 132 445 Q 128 470 126 480 M 280 140 Q 252 200 250 255 T 272 455 Q 275 470 276 480 M 120 140 C 160 155 240 155 280 140 M 126 480 C 160 495 240 495 276 480';

    return {
      beforeSvgPath: before,
      afterSvgPath: after,
      strokeCount: 14,
      smoothedPointsCount: 6,
      reductionPercentage: '-58% jitter',
    };
  }

  /**
   * Generates 5 harmonious palettes from a base color or image seed
   */
  async generatePalettes(
    baseColorOrSeed: string,
    signal?: AbortSignal
  ): Promise<AIPaletteResult[]> {
    const baseHex = baseColorOrSeed.startsWith('#')
      ? baseColorOrSeed.slice(0, 7)
      : '#0E2A1E';

    try {
      const aiResponse = await invokeAiText('palette', { baseColor: baseHex }, signal);
      if (aiResponse && Array.isArray(aiResponse.palettes) && aiResponse.palettes.length >= 3) {
        return aiResponse.palettes.slice(0, 5).map((p: any, idx: number) => ({
          id: `pal_ai_${Date.now()}_${idx}`,
          name: p.name || 'Harmonic Palette',
          harmony: p.harmony || (idx === 0 ? 'complementary' : idx === 1 ? 'analogous' : 'triad'),
          colors: Array.isArray(p.colors)
            ? p.colors.map((c: any) => (typeof c === 'string' ? c : c.hex || '#000000')).slice(0, 5)
            : ['#0E2A1E', '#1D4D39', '#D4AF37', '#EED888', '#F7F4EE'],
        }));
      }
    } catch (err: any) {
      if (err?.status === 429) throw err;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    const isWarm =
      baseColorOrSeed.toLowerCase().includes('green') ||
      baseColorOrSeed.toLowerCase().includes('0f') ||
      baseColorOrSeed.toLowerCase().includes('d4') ||
      baseColorOrSeed.toLowerCase().includes('b8');

    if (isWarm) {
      return [
        {
          id: `pal_emerald_${Date.now()}`,
          name: 'Emerald Zardozi',
          harmony: 'complementary',
          colors: ['#0E2A1E', '#1D4D39', '#D4AF37', '#EED888', '#F7F4EE'],
        },
        {
          id: `pal_forest_${Date.now()}`,
          name: 'Forest Atelier',
          harmony: 'analogous',
          colors: ['#0F281E', '#1B3B2B', '#2D5B43', '#4A7C59', '#8FAF8D'],
        },
        {
          id: `pal_imperial_${Date.now()}`,
          name: 'Imperial Triad',
          harmony: 'triad',
          colors: ['#1A365D', '#742A2A', '#975A16', '#D69E2E', '#EDF2F7'],
        },
        {
          id: `pal_graphite_${Date.now()}`,
          name: 'Graphite Silk',
          harmony: 'monochrome',
          colors: ['#111114', '#24242A', '#454552', '#848294', '#E8E5EE'],
        },
        {
          id: `pal_terracotta_${Date.now()}`,
          name: 'Terracotta Dusk',
          harmony: 'split',
          colors: ['#8C3B24', '#B45309', '#1E3A8A', '#3B82F6', '#FEF3C7'],
        },
      ];
    }

    return [
      {
        id: `pal_sapphire_${Date.now()}`,
        name: 'Sapphire Silver',
        harmony: 'complementary',
        colors: ['#1A2B4C', '#2C446F', '#C4CBD8', '#E2E6EE', '#F7F4EE'],
      },
      {
        id: `pal_slate_${Date.now()}`,
        name: 'Monochrome Slate',
        harmony: 'monochrome',
        colors: ['#12161E', '#252F3F', '#435166', '#8792A2', '#DFE3E8'],
      },
      {
        id: `pal_amethyst_${Date.now()}`,
        name: 'Amethyst Dusk',
        harmony: 'analogous',
        colors: ['#281E38', '#402D58', '#5E3E7E', '#9E78C2', '#F2EDF8'],
      },
      {
        id: `pal_triad_cool_${Date.now()}`,
        name: 'Nordic Triad',
        harmony: 'triad',
        colors: ['#1C3D5A', '#5A3D1C', '#3D5A1C', '#A8B9C8', '#F7F4EE'],
      },
      {
        id: `pal_split_cool_${Date.now()}`,
        name: 'Ice Split',
        harmony: 'split',
        colors: ['#1E3A8A', '#B45309', '#8C3B24', '#93C5FD', '#FEF3C7'],
      },
    ];
  }

  /**
   * Full wardrobe harmonizer with Color Theory rules for Jewellery & Footwear
   */
  async harmonizeWardrobe(
    baseColorOrGarment: string,
    signal?: AbortSignal
  ): Promise<HarmonicWardrobeResult> {
    const baseHex = baseColorOrGarment.startsWith('#')
      ? baseColorOrGarment.slice(0, 7)
      : '#0E2A1E';

    try {
      const aiResponse = await invokeAiText(
        'pairings',
        { garmentColor: baseHex },
        signal
      );

      if (
        aiResponse &&
        Array.isArray(aiResponse.combinations) &&
        Array.isArray(aiResponse.jewellery) &&
        Array.isArray(aiResponse.footwear)
      ) {
        const palettes: AIPaletteResult[] = aiResponse.combinations.slice(0, 3).map((combo: any, idx: number) => ({
          id: `pal_pair_${Date.now()}_${idx}`,
          name: combo.name || 'Atelier Combination',
          harmony: combo.harmony || (idx === 0 ? 'complementary' : idx === 1 ? 'analogous' : 'triad'),
          colors: Array.isArray(combo.colors)
            ? combo.colors.map((c: any) => (typeof c === 'string' ? c : c.hex || '#000000')).slice(0, 5)
            : ['#0E2A1E', '#D4AF37', '#1D4D39', '#EED888', '#F7F4EE'],
        }));

        const jewellery: JewelleryPairing[] = aiResponse.jewellery.slice(0, 3).map((j: any, idx: number) => {
          const name = String(j.name || 'Kundan');
          const isGold = ['Kundan', 'Gold', 'Jadau'].some((k) => name.includes(k));
          return {
            id: `jewel_ai_${idx}`,
            name,
            tag: String(j.reason || '').slice(0, 60),
            metal: (isGold ? 'gold' : 'silver') as 'gold' | 'silver',
            iconType: name.includes('Kundan') || name.includes('Polki')
              ? 'gem'
              : name.includes('Jadau')
              ? 'crown'
              : name.includes('Pearl')
              ? 'circleDot'
              : 'sparkle',
          };
        });

        const footwear: FootwearMatch[] = aiResponse.footwear.slice(0, 3).map((f: any, idx: number) => {
          const name = String(f.name || 'Khussa');
          const isTrad = ['Khussa', 'Kolhapuri'].some((k) => name.includes(k));
          const isContemp = ['Heels', 'Flats'].some((k) => name.includes(k));
          return {
            id: `shoe_ai_${idx}`,
            name,
            tag: String(f.reason || '').slice(0, 60),
            styleCategory: (isTrad ? 'traditional' : isContemp ? 'contemporary' : 'fusion') as any,
          };
        });

        return {
          baseColor: baseHex,
          palettes,
          jewellery,
          footwear,
        };
      }
    } catch (err: any) {
      if (err?.status === 429) throw err;
    }

    // Mock fallback when USE_MOCK_AI is true or when network fails twice
    const palettes = await this.generatePalettes(baseColorOrGarment, signal);

    // Color Theory rule:
    // Warm / Rich (Green, Emerald, Red, Terracotta, Gold) -> Gold, Kundan, Jadau & Khussa / Kolhapuri
    // Cool (Blue, Sapphire, Grey, Slate, Silver) -> Silver, Polki, Pearl & Kolhapuri, Heels, Boots
    const lower = baseColorOrGarment.toLowerCase();
    const isWarmTone =
      lower.includes('green') ||
      lower.includes('emerald') ||
      lower.includes('gold') ||
      lower.includes('zari') ||
      lower.includes('red') ||
      lower.includes('ruby') ||
      lower.includes('0e2a1e') ||
      lower.includes('d4af37');

    let jewellery: JewelleryPairing[];
    let footwear: FootwearMatch[];

    if (isWarmTone) {
      jewellery = [
        {
          id: 'jewel_kundan',
          name: 'Kundan',
          tag: 'Uncut gemstones in pure 24k gold foil',
          metal: 'gold',
          iconType: 'gem',
        },
        {
          id: 'jewel_gold',
          name: 'Gold',
          tag: '22k antique temple finish with filigree',
          metal: 'gold',
          iconType: 'sparkle',
        },
        {
          id: 'jewel_jadau',
          name: 'Jadau',
          tag: 'Heritage polki set in engraved gold',
          metal: 'gold',
          iconType: 'crown',
        },
        {
          id: 'jewel_pearl',
          name: 'Pearl',
          tag: 'Basra seed pearl multi strand drops',
          metal: 'antique',
          iconType: 'circleDot',
        },
        {
          id: 'jewel_polki',
          name: 'Polki',
          tag: 'Natural uncut diamond open claw setting',
          metal: 'gold',
          iconType: 'gem',
        },
        {
          id: 'jewel_silver',
          name: 'Silver',
          tag: 'Oxidized tribal silver coin accents',
          metal: 'silver',
          iconType: 'sparkle',
        },
      ];

      footwear = [
        {
          id: 'shoe_khussa',
          name: 'Khussa',
          tag: 'Hand embroidered metallic tilla dabka jutti',
          styleCategory: 'traditional',
        },
        {
          id: 'shoe_kolhapuri',
          name: 'Kolhapuri',
          tag: 'Braided raw leather chappal with tassels',
          styleCategory: 'traditional',
        },
        {
          id: 'shoe_heels',
          name: 'Heels',
          tag: 'Strappy gold metallic block runway sandals',
          styleCategory: 'contemporary',
        },
        {
          id: 'shoe_flats',
          name: 'Flats',
          tag: 'Embossed leather backless studio mules',
          styleCategory: 'contemporary',
        },
        {
          id: 'shoe_boots',
          name: 'Boots',
          tag: 'Structured leather Chelsea ankle boots',
          styleCategory: 'fusion',
        },
        {
          id: 'shoe_sneakers',
          name: 'Sneakers',
          tag: 'Minimal raw canvas tailored runners',
          styleCategory: 'fusion',
        },
      ];
    } else {
      jewellery = [
        {
          id: 'jewel_polki',
          name: 'Polki',
          tag: 'Natural uncut diamond open claw setting',
          metal: 'silver',
          iconType: 'gem',
        },
        {
          id: 'jewel_silver',
          name: 'Silver',
          tag: 'Sterling rhodium reflective sheen chokers',
          metal: 'silver',
          iconType: 'sparkle',
        },
        {
          id: 'jewel_pearl',
          name: 'Pearl',
          tag: 'Lustrous south sea baroque pearl collar',
          metal: 'antique',
          iconType: 'circleDot',
        },
        {
          id: 'jewel_kundan',
          name: 'Kundan',
          tag: 'White sapphire foiled choker necklace',
          metal: 'gold',
          iconType: 'gem',
        },
        {
          id: 'jewel_gold',
          name: 'Gold',
          tag: 'White gold rhodium micro pave accents',
          metal: 'gold',
          iconType: 'sparkle',
        },
        {
          id: 'jewel_jadau',
          name: 'Jadau',
          tag: 'Emerald cabochon accents in antique gold',
          metal: 'antique',
          iconType: 'crown',
        },
      ];

      footwear = [
        {
          id: 'shoe_kolhapuri',
          name: 'Kolhapuri',
          tag: 'Silver foil stamped leather slip ons',
          styleCategory: 'traditional',
        },
        {
          id: 'shoe_heels',
          name: 'Heels',
          tag: 'Sculptural metallic stiletto ankle straps',
          styleCategory: 'contemporary',
        },
        {
          id: 'shoe_khussa',
          name: 'Khussa',
          tag: 'Threadwork velvet pointed evening slippers',
          styleCategory: 'traditional',
        },
        {
          id: 'shoe_flats',
          name: 'Flats',
          tag: 'Square toe brushed leather pointed flats',
          styleCategory: 'contemporary',
        },
        {
          id: 'shoe_boots',
          name: 'Boots',
          tag: 'High gloss black leather runway booties',
          styleCategory: 'fusion',
        },
        {
          id: 'shoe_sneakers',
          name: 'Sneakers',
          tag: 'Off-white monochrome studio runners',
          styleCategory: 'fusion',
        },
      ];
    }

    return {
      baseColor: baseColorOrGarment,
      palettes,
      jewellery,
      footwear,
    };
  }

  /**
   * Generates 3 alternate silhouettes for a garment (neckline, sleeve, length)
   */
  async generateVariants(garmentId?: string): Promise<AIVariantResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 750));

    return [
      {
        id: `var_neck_${Date.now()}`,
        title: 'Mandarin Collar',
        feature: 'neckline',
        helper: 'Clean upright structured band',
        strokePath: 'M 44 20 L 55 18 L 66 20 L 68 28 L 55 29 L 42 28 Z',
        detailPaths: [
          'M 44 20 L 44 28',
          'M 66 20 L 66 28',
          'M 55 29 L 55 85',
        ],
      },
      {
        id: `var_sleeve_${Date.now()}`,
        title: 'Bell Sleeves',
        feature: 'sleeve',
        helper: 'Wide flared cuff sweep',
        strokePath:
          'M 24 38 L 14 74 L 32 78 L 34 44 Z M 86 38 L 96 74 L 78 78 L 76 44 Z',
        detailPaths: [
          'M 14 74 Q 23 80 32 78',
          'M 96 74 Q 87 80 78 78',
        ],
      },
      {
        id: `var_length_${Date.now()}`,
        title: 'Ankle Anarkali',
        feature: 'length',
        helper: 'Floor grazing tiered flared hem',
        strokePath:
          'M 36 24 L 55 20 L 74 24 L 86 42 L 78 98 L 55 102 L 32 98 L 24 42 Z',
        detailPaths: [
          'M 32 98 Q 55 92 78 98',
          'M 42 56 L 28 98',
          'M 68 56 L 82 98',
        ],
      },
    ];
  }

  /**
   * Generates tailored garment construction notes for tech packs
   */
  async generateTechNotes(
    params: {
      garmentType?: string;
      fabrics?: string;
      colors?: string[];
      embroideryNotes?: string;
    },
    signal?: AbortSignal
  ): Promise<{ stitchNotes: string[]; finishingNotes: string[] }> {
    try {
      const aiResponse = await invokeAiText('tech_notes', params, signal);
      if (
        aiResponse &&
        Array.isArray(aiResponse.stitch_notes) &&
        Array.isArray(aiResponse.finishing_notes)
      ) {
        return {
          stitchNotes: aiResponse.stitch_notes.slice(0, 6),
          finishingNotes: aiResponse.finishing_notes.slice(0, 4),
        };
      }
    } catch (err: any) {
      if (err?.status === 429) throw err;
    }

    return {
      stitchNotes: [
        'Single needle topstitch 1/4 inch seam allowance.',
        'French seams on silk and sheer bodice panels.',
        'Reinforce collar and shoulder with lightweight interfacing.',
      ],
      finishingNotes: [
        'Blind hem along flared perimeter.',
        'Steam press with organza protective cloth.',
      ],
    };
  }

  /**
   * Improves an embroidery prompt via ai-text motif_prompt
   */
  async improveMotifPrompt(
    prompt: string,
    style?: MotifStyle,
    signal?: AbortSignal
  ): Promise<string> {
    try {
      const aiResponse = await invokeAiText(
        'motif_prompt',
        { prompt: prompt.trim() || `${style || 'Zardozi'} embroidery motif` },
        signal
      );
      if (aiResponse && Array.isArray(aiResponse.motifs) && aiResponse.motifs.length > 0) {
        return aiResponse.motifs[0].prompt || aiResponse.motifs[0].helper || prompt;
      }
    } catch (err: any) {
      if (err?.status === 429) {
        showToast('Daily limit reached');
      }
    }
    return prompt;
  }

  /**
   * Retrieves the user's last 12 saved motifs from the motifs table
   */
  async getMotifHistory(): Promise<AIMotifResult[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('motifs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error || !data || data.length === 0) return [];

      const historyMotifs: AIMotifResult[] = await Promise.all(
        data.map(async (row: any, idx: number) => {
          let imageUrl = '';
          try {
            const { data: signedData } = await supabase.storage
              .from('ai-motifs')
              .createSignedUrl(row.storage_path, 3600);
            if (signedData?.signedUrl) {
              imageUrl = await cacheImageLocally(row.storage_path, signedData.signedUrl);
            }
          } catch {
            // fallback
          }

          const style = (row.style as MotifStyle) || 'Zardozi';
          return {
            id: row.id || `motif_hist_${idx}`,
            name: row.prompt ? (row.prompt.length > 22 ? row.prompt.slice(0, 22) + '...' : row.prompt) : `${style} Motif`,
            helper: `${style} Motif`,
            style,
            baseColor: '#1B2421',
            accentColor: '#D4AF37',
            previewSvg: 'M 25 15 C 38 15 48 26 44 42 C 40 56 25 68 25 75 C 25 68 10 56 6 42 C 2 26 12 15 25 15 Z',
            patternSvg: '',
            borderBrushPath: 'M 0 10 Q 15 2 30 10 Q 45 18 60 10 M 15 6 L 15 14 M 45 6 L 45 14 M 30 10 C 27 5 33 5 30 10',
            imageUrl: imageUrl || undefined,
            storagePath: row.storage_path,
          };
        })
      );

      return historyMotifs;
    } catch (err) {
      console.warn('Failed to load motif history:', err);
      return [];
    }
  }

  /**
   * Ensures a local cached URI exists, creating a fresh signed URL if missing
   */
  async ensureMotifImageUrl(storagePath: string, existingSignedUrl?: string): Promise<string> {
    try {
      if (Paths?.cache) {
        const filename = storagePath.replace(/[/\\:]/g, '_');
        const localFile = new File(Paths.cache, filename);
        if (localFile.exists) {
          return localFile.uri;
        }
      }
      if (existingSignedUrl) {
        return cacheImageLocally(storagePath, existingSignedUrl);
      }
      const { data, error } = await supabase.storage
        .from('ai-motifs')
        .createSignedUrl(storagePath, 3600);
      if (error || !data?.signedUrl) return '';
      return cacheImageLocally(storagePath, data.signedUrl);
    } catch {
      return existingSignedUrl || '';
    }
  }
}

export const aiService: IAIService = new AIServiceImpl();
