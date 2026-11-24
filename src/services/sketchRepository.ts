import AsyncStorage from '@react-native-async-storage/async-storage';
import { Skia } from '@shopify/react-native-skia';
import { supabase } from './supabase';
import {
  SketchRow,
  SketchInsert,
  SketchUpdate,
  SketchCategory,
} from '../types/database';
import {
  Sketch,
  StrokeItem,
  ShapeItem,
  Point,
  Layer,
} from '../types/canvas';
import { SketchItem } from '../data';
import { FIGURE_CROQUIS } from '../canvas/templates/figures';
import { GARMENT_FLATS } from '../canvas/templates/flats';
import { syncQueue } from './syncQueue';
import { showToast } from '../utils/toast';
import { useStudioStore } from '../store/useStudioStore';

export interface RepositoryResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export interface CreateSketchParams {
  title?: string;
  category?: 'western' | 'eastern';
  fabric_label?: string;
  templateId?: string;
  templateType?: 'figure' | 'garment' | 'blank';
  data?: any;
}

const LOCAL_SKETCHES_KEY = '@voguecraft_local_sketches_v1';
const SKETCH_STORAGE_PREFIX = 'voguecraft_sketch_';

/**
 * Strokes are stored compactly: round points to 1 decimal, drop points
 * closer than 1.5px, and store the data as jsonb. Warn in the console if a
 * sketch exceeds 1.5 MB.
 */
export function compactSketchData(sketch: any): any {
  if (!sketch) return {};
  try {
    const cloned = JSON.parse(JSON.stringify(sketch));

    if (Array.isArray(cloned.layers)) {
      for (const layer of cloned.layers) {
        if (Array.isArray(layer.items)) {
          for (const item of layer.items) {
            if (item.type === 'stroke' && Array.isArray(item.points)) {
              const compactedPoints: Point[] = [];
              let lastPoint: Point | null = null;

              for (const pt of item.points) {
                const roundedX = Math.round(pt.x * 10) / 10;
                const roundedY = Math.round(pt.y * 10) / 10;

                if (lastPoint) {
                  const dist = Math.hypot(roundedX - lastPoint.x, roundedY - lastPoint.y);
                  if (dist < 1.5) {
                    continue; // drop points closer than 1.5px
                  }
                }

                const newPt: Point = {
                  x: roundedX,
                  y: roundedY,
                };
                if (pt.pressure !== undefined) {
                  newPt.pressure = Math.round(pt.pressure * 100) / 100;
                }
                compactedPoints.push(newPt);
                lastPoint = newPt;
              }

              item.points = compactedPoints;
            }
          }
        }
      }
    }

    const jsonString = JSON.stringify(cloned);
    const byteLength = new Blob([jsonString]).size;

    if (byteLength > 1.5 * 1024 * 1024) {
      console.warn(
        `VogueCraft: Sketch payload exceeds 1.5 MB (${(
          byteLength /
          (1024 * 1024)
        ).toFixed(2)} MB)`
      );
    }

    return cloned;
  } catch {
    return sketch;
  }
}

/**
 * Helper to decode base64 string to Uint8Array for binary upload
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Render a small PNG (~400px wide) of the canvas using Skia Surface makeImageSnapshot
 */
export async function exportSkiaThumbnail(sketch: Sketch): Promise<string | null> {
  try {
    const surface = Skia.Surface.Make(400, 720);
    if (!surface) return null;

    const canvas = surface.getCanvas();

    // 1. Draw Paper background
    const bgPaint = Skia.Paint();
    bgPaint.setColor(Skia.Color('#F7F4EE'));
    canvas.drawRect({ x: 0, y: 0, width: 400, height: 720 }, bgPaint);

    // 2. Draw committed layers
    if (sketch.layers) {
      for (const layer of sketch.layers) {
        if (!layer.visible) continue;

        for (const item of layer.items) {
          if (item.type === 'stroke') {
            const s = item as StrokeItem;
            const path = Skia.Path.MakeFromSVGString(s.svgPath);
            if (path) {
              const paint = Skia.Paint();
              paint.setStyle(1); // stroke
              paint.setColor(Skia.Color(s.color || '#0E0E10'));
              paint.setStrokeWidth(s.width || 2);
              paint.setAlphaf((s.opacity || 1.0) * layer.opacity);
              paint.setStrokeCap(1); // round
              paint.setStrokeJoin(1); // round
              canvas.drawPath(path, paint);
            }
          } else if (item.type === 'shape') {
            const sh = item as ShapeItem;
            const path = Skia.Path.MakeFromSVGString(sh.svgPath);
            if (path) {
              if (sh.fill) {
                const fillPaint = Skia.Paint();
                fillPaint.setStyle(0); // fill
                const fillColor =
                  sh.fill.type === 'color' ? sh.fill.value : '#F3E6E8';
                fillPaint.setColor(Skia.Color(fillColor));
                fillPaint.setAlphaf(layer.opacity);
                canvas.drawPath(path, fillPaint);
              }
              const strokePaint = Skia.Paint();
              strokePaint.setStyle(1); // stroke
              strokePaint.setColor(Skia.Color(sh.stroke?.color || '#0E0E10'));
              strokePaint.setStrokeWidth(sh.stroke?.width || 1.5);
              strokePaint.setAlphaf(layer.opacity);
              canvas.drawPath(path, strokePaint);
            }
          }
        }
      }
    }

    surface.flush();
    const image = surface.makeImageSnapshot();
    if (!image) return null;
    const base64 = image.encodeToBase64();
    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.warn('VogueCraft: Error creating Skia thumbnail snapshot:', err);
    return null;
  }
}

/**
 * Extracts preview stroke info from a sketch's data for list card previews
 */
function extractCardPreview(data: any): {
  strokePath: string;
  detailPaths: string[];
  colorHex: string;
} {
  try {
    if (!data || !Array.isArray(data.layers)) {
      return { strokePath: '', detailPaths: [], colorHex: '#7F0020' };
    }

    let strokePath = '';
    const detailPaths: string[] = [];
    let colorHex = '#7F0020';

    for (const layer of data.layers) {
      for (const item of layer.items || []) {
        if (item.type === 'shape' && item.svgPath) {
          if (!strokePath) strokePath = item.svgPath;
          else if (detailPaths.length < 3) detailPaths.push(item.svgPath);
        } else if (item.type === 'stroke' && item.svgPath) {
          if (!strokePath) {
            strokePath = item.svgPath;
            if (item.color) colorHex = item.color;
          } else if (detailPaths.length < 3) {
            detailPaths.push(item.svgPath);
          }
        }
      }
    }

    return { strokePath, detailPaths, colorHex };
  } catch {
    return { strokePath: '', detailPaths: [], colorHex: '#7F0020' };
  }
}

/**
 * Helper to build initial sketch structure based on template or blank choice
 */
function buildInitialSketchLayers(params: CreateSketchParams): {
  layers: Layer[];
  title: string;
  category: SketchCategory;
  fabric_label: string;
} {
  const category: SketchCategory = (
    params.category ? params.category.toLowerCase() : 'western'
  ) as SketchCategory;
  const fabric_label = params.fabric_label || 'Silk blend';

  if (params.templateType === 'blank') {
    return {
      title: params.title || 'Blank canvas',
      category,
      fabric_label,
      layers: [
        {
          id: 'layer_garment',
          name: 'Garment',
          type: 'garment',
          visible: true,
          locked: false,
          opacity: 1.0,
          items: [],
        },
      ],
    };
  }

  if (params.templateId) {
    // Check if figure croquis
    const croquis = FIGURE_CROQUIS.find((f) => f.id === params.templateId);
    if (croquis) {
      return {
        title: params.title || croquis.name,
        category,
        fabric_label,
        layers: [
          {
            id: 'layer_figure',
            name: 'Figure',
            type: 'figure',
            visible: true,
            locked: true,
            opacity: 0.6,
            items: [
              {
                id: `croquis_${croquis.id}`,
                type: 'shape',
                shapeType: 'path',
                closed: false,
                svgPath: croquis.strokePath,
                stroke: { color: '#8A8794', width: 1.2, style: 'solid' },
              },
            ],
          },
          {
            id: 'layer_garment',
            name: 'Garment',
            type: 'garment',
            visible: true,
            locked: false,
            opacity: 1.0,
            items: [],
          },
        ],
      };
    }

    // Check if garment flat
    const flat = GARMENT_FLATS.find((g) => g.id === params.templateId);
    if (flat) {
      return {
        title: params.title || flat.name,
        category: flat.category === 'Eastern' ? 'eastern' : 'western',
        fabric_label: params.fabric_label || 'Silk blend',
        layers: [
          {
            id: 'layer_garment',
            name: 'Garment',
            type: 'garment',
            visible: true,
            locked: false,
            opacity: 1.0,
            items: JSON.parse(JSON.stringify(flat.parts)),
          },
        ],
      };
    }
  }

  return {
    title: params.title || 'New sketch',
    category,
    fabric_label,
    layers: [
      {
        id: 'layer_garment',
        name: 'Garment',
        type: 'garment',
        visible: true,
        locked: false,
        opacity: 1.0,
        items: [],
      },
    ],
  };
}

export const sketchRepository = {
  /**
   * List sketches for the authenticated user, newest first.
   */
  async listSketches(): Promise<RepositoryResponse<SketchItem[]>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Fallback to local offline sketches
        const localRaw = await AsyncStorage.getItem(LOCAL_SKETCHES_KEY);
        const localList: SketchItem[] = localRaw ? JSON.parse(localRaw) : [];
        return { data: localList, error: null };
      }

      const { data, error } = await supabase
        .from('sketches')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Could not load sketches from server');
        const localRaw = await AsyncStorage.getItem(LOCAL_SKETCHES_KEY);
        const localList: SketchItem[] = localRaw ? JSON.parse(localRaw) : [];
        return {
          data: localList,
          error: { message: 'Loaded local sketches' },
        };
      }

      // Format rows for card display
      const formattedItems: SketchItem[] = (data || []).map((row: SketchRow) => {
        const preview = extractCardPreview(row.data);
        const dateObj = new Date(row.updated_at || row.created_at);
        const dateStr = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        let thumbnailUrl: string | null = null;
        if (row.thumbnail_path) {
          const { data: pubData } = supabase.storage
            .from('sketch-thumbnails')
            .getPublicUrl(row.thumbnail_path);
          thumbnailUrl = pubData?.publicUrl || null;
        }

        return {
          id: row.id,
          title: row.title,
          date: dateStr,
          category: row.category === 'eastern' ? 'Eastern' : 'Western',
          fabricTag: row.fabric_label || 'Silk blend',
          colorHex: preview.colorHex,
          strokePath: preview.strokePath,
          detailPaths: preview.detailPaths,
          thumbnail_path: row.thumbnail_path,
          thumbnailUrl,
        };
      });

      // Update local cache
      await AsyncStorage.setItem(LOCAL_SKETCHES_KEY, JSON.stringify(formattedItems));

      return { data: formattedItems, error: null };
    } catch (err: any) {
      console.warn('VogueCraft: listSketches error:', err);
      showToast('Could not sync sketches');
      const localRaw = await AsyncStorage.getItem(LOCAL_SKETCHES_KEY);
      const localList: SketchItem[] = localRaw ? JSON.parse(localRaw) : [];
      return {
        data: localList,
        error: { message: 'Unable to connect to atelier server' },
      };
    }
  },

  /**
   * Get a sketch by id, checking local copy and remote copy with last-write-wins.
   */
  async getSketch(id: string): Promise<
    RepositoryResponse<{
      sketch: any;
      serverNewer?: boolean;
      serverUpdatedAt?: string;
    }>
  > {
    try {
      // 1. Check local storage
      const localRaw = await AsyncStorage.getItem(`${SKETCH_STORAGE_PREFIX}${id}`);
      const localSketch = localRaw ? JSON.parse(localRaw) : null;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: localSketch ? { sketch: localSketch } : null,
          error: null,
        };
      }

      // 2. Query Supabase
      const { data: serverRow, error } = await supabase
        .from('sketches')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (error || !serverRow) {
        if (localSketch) {
          return { data: { sketch: localSketch }, error: null };
        }
        return {
          data: null,
          error: { message: 'Sketch not found' },
        };
      }

      const serverData = (serverRow.data as any) || {};
      const serverUpdatedAt = serverRow.updated_at;
      const localUpdatedAt = localSketch?.updatedAt;

      // Conflict detection: if server copy is newer than local copy
      if (
        localSketch &&
        localUpdatedAt &&
        serverUpdatedAt &&
        new Date(serverUpdatedAt).getTime() > new Date(localUpdatedAt).getTime() + 1000
      ) {
        return {
          data: {
            sketch: localSketch,
            serverNewer: true,
            serverUpdatedAt,
          },
          error: null,
        };
      }

      // Normal flow: server copy or local
      const resolved = localSketch || {
        ...serverData,
        id: serverRow.id,
        title: serverRow.title,
        updatedAt: serverRow.updated_at,
        createdAt: serverRow.created_at,
      };

      // Ensure local cache is up to date
      await AsyncStorage.setItem(
        `${SKETCH_STORAGE_PREFIX}${id}`,
        JSON.stringify(resolved)
      );

      return { data: { sketch: resolved }, error: null };
    } catch (err: any) {
      console.warn('VogueCraft: getSketch error:', err);
      const localRaw = await AsyncStorage.getItem(`${SKETCH_STORAGE_PREFIX}${id}`);
      return {
        data: localRaw ? { sketch: JSON.parse(localRaw) } : null,
        error: { message: 'Could not fetch remote sketch' },
      };
    }
  },

  /**
   * Create a new sketch row in Supabase and locally.
   */
  async createSketch(
    params: CreateSketchParams
  ): Promise<RepositoryResponse<SketchRow>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (__DEV__) {
          console.error('[VogueCraft createSketch] No authenticated user session:', authError);
        }
        showToast('No active session. Redirected to Welcome.');
        useStudioStore.getState().setOnboardingCompleted(false);
        await supabase.auth.signOut();
        return {
          data: null,
          error: { message: 'No active session. Please sign in.' },
        };
      }

      const initial = buildInitialSketchLayers(params);

      const sketchPayload: Sketch = {
        id: '',
        title: initial.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvasSize: { width: 400, height: 720 },
        layers: initial.layers,
        viewport: { scale: 1.0, translateX: 0, translateY: 0, rotation: 0 },
        guides: {
          dotGrid: true,
          centerLine: true,
          snapToGrid: false,
          proportionGuides: false,
        },
      };

      const insertData: SketchInsert = {
        user_id: user.id,
        title: initial.title,
        category: initial.category,
        fabric_label: initial.fabric_label,
        data: compactSketchData(sketchPayload),
      };

      const { data, error } = await supabase
        .from('sketches')
        .insert(insertData)
        .select()
        .single();

      if (error || !data) {
        const errObj = error || {
          message: 'Failed to create sketch row',
          code: 'NO_DATA',
          details: '',
          hint: '',
        };

        if (__DEV__) {
          console.error('[VogueCraft createSketch] Full Supabase insert error:', {
            message: errObj.message,
            code: (errObj as any).code,
            details: (errObj as any).details,
            hint: (errObj as any).hint,
            userId: user.id,
          });
        }

        if (
          (errObj as any).code === '42501' ||
          errObj.message?.toLowerCase().includes('row-level security') ||
          (errObj as any).details?.toLowerCase().includes('policy')
        ) {
          console.error(
            `[VogueCraft RLS ERROR on public.sketches insert] ` +
            `Insert permission denied for user ${user.id}. ` +
            `Missing or failing policy: "create policy \\"Users can insert own sketches\\" on public.sketches for insert with check (auth.uid() = user_id);" ` +
            `Column: user_id must equal auth.uid(). Details: ${(errObj as any).details || (errObj as any).hint || errObj.message}`
          );
        }

        showToast(`Create sketch failed: ${errObj.message}`);

        return {
          data: null,
          error: {
            message: errObj.message,
            code: (errObj as any).code,
          },
        };
      }

      // Sync local storage with new row id
      sketchPayload.id = data.id;
      await AsyncStorage.setItem(
        `${SKETCH_STORAGE_PREFIX}${data.id}`,
        JSON.stringify(sketchPayload)
      );

      return { data, error: null };
    } catch (err: any) {
      if (__DEV__) {
        console.error('[VogueCraft createSketch] Unexpected error:', err);
      }
      showToast(err?.message || 'Error creating new sketch');
      return {
        data: null,
        error: { message: err?.message || 'Failed to create sketch' },
      };
    }
  },

  /**
   * Update an existing sketch with compact data & sync queue fallback.
   */
  async updateSketch(
    id: string,
    updates: Partial<SketchUpdate>
  ): Promise<RepositoryResponse<SketchRow>> {
    try {
      // 1. Always write locally first to protect strokes
      if (updates.data) {
        const compacted = compactSketchData(updates.data);
        updates.data = compacted;
        await AsyncStorage.setItem(
          `${SKETCH_STORAGE_PREFIX}${id}`,
          JSON.stringify(compacted)
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: { message: 'Saved locally in studio' },
        };
      }

      const payload: SketchUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sketches')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        if (__DEV__) {
          console.error('[VogueCraft updateSketch] Full Supabase update error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            sketchId: id,
            userId: user.id,
          });
        }

        if (
          error.code === '42501' ||
          error.message?.toLowerCase().includes('row-level security') ||
          (error as any).details?.toLowerCase().includes('policy')
        ) {
          console.error(
            `[VogueCraft RLS ERROR on public.sketches update] ` +
            `Update permission denied for user ${user.id} on sketch ${id}. ` +
            `Required policy: "create policy \\"Users can update own sketches\\" on public.sketches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);" ` +
            `Details: ${error.details || error.hint || error.message}`
          );
        }

        showToast(`Save failed: ${error.message}`);
        await syncQueue.enqueue(id, updates);
        return {
          data: null,
          error: { message: error.message, code: error.code },
        };
      }

      return { data, error: null };
    } catch (err: any) {
      if (__DEV__) {
        console.error('[VogueCraft updateSketch] Unexpected error:', err);
      }
      showToast(`Save failed: ${err?.message || 'Offline'}`);
      await syncQueue.enqueue(id, updates);
      return {
        data: null,
        error: { message: err?.message || 'Saved locally (offline)' },
      };
    }
  },

  /**
   * Rename sketch
   */
  async renameSketch(id: string, newTitle: string): Promise<RepositoryResponse<boolean>> {
    try {
      const res = await this.updateSketch(id, { title: newTitle.trim() });
      return { data: !res.error, error: res.error };
    } catch {
      return {
        data: false,
        error: { message: 'Could not rename sketch' },
      };
    }
  },

  /**
   * Soft delete a sketch by setting deleted_at
   */
  async deleteSketch(id: string): Promise<RepositoryResponse<boolean>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('sketches')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          showToast('Could not delete from cloud');
        }
      }

      // Remove from local cache
      await AsyncStorage.removeItem(`${SKETCH_STORAGE_PREFIX}${id}`);

      // Update cached list
      const localRaw = await AsyncStorage.getItem(LOCAL_SKETCHES_KEY);
      if (localRaw) {
        const list: SketchItem[] = JSON.parse(localRaw);
        const filtered = list.filter((s) => s.id !== id);
        await AsyncStorage.setItem(LOCAL_SKETCHES_KEY, JSON.stringify(filtered));
      }

      return { data: true, error: null };
    } catch (err: any) {
      console.warn('VogueCraft: deleteSketch error:', err);
      showToast('Error removing sketch');
      return {
        data: false,
        error: { message: err?.message || 'Failed to delete sketch' },
      };
    }
  },

  /**
   * Upload thumbnail PNG to bucket sketch-thumbnails at {user_id}/{sketch_id}.png
   */
  async uploadThumbnail(
    userId: string,
    sketchId: string,
    imageBase64: string
  ): Promise<RepositoryResponse<string>> {
    try {
      const bytes = base64ToUint8Array(imageBase64);
      const filePath = `${userId}/${sketchId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('sketch-thumbnails')
        .upload(filePath, bytes, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        if (__DEV__) {
          console.error('[VogueCraft uploadThumbnail] Full Supabase storage upload error:', {
            message: uploadError.message,
            code: (uploadError as any).code || (uploadError as any).statusCode,
            details: (uploadError as any).details,
            hint: (uploadError as any).hint,
            filePath,
            userId,
          });
        }

        if (
          uploadError.message?.toLowerCase().includes('row-level security') ||
          uploadError.message?.toLowerCase().includes('policy') ||
          (uploadError as any).statusCode === 403
        ) {
          console.error(
            `[VogueCraft STORAGE RLS ERROR on sketch-thumbnails] ` +
            `Storage policy denied upload to "${filePath}". ` +
            `Required policy: allow insert/update where (storage.foldername(name))[1] = auth.uid()::text. ` +
            `Details: ${uploadError.message}`
          );
        }

        showToast(`Thumbnail upload failed: ${uploadError.message}`);
        return {
          data: null,
          error: { message: uploadError.message },
        };
      }

      // Update thumbnail_path on the sketch row
      await supabase
        .from('sketches')
        .update({ thumbnail_path: filePath, updated_at: new Date().toISOString() })
        .eq('id', sketchId);

      const { data: pubData } = supabase.storage
        .from('sketch-thumbnails')
        .getPublicUrl(filePath);

      return { data: pubData.publicUrl || filePath, error: null };
    } catch (err: any) {
      console.warn('VogueCraft: uploadThumbnail error:', err);
      return {
        data: null,
        error: { message: 'Could not upload thumbnail' },
      };
    }
  },
};
