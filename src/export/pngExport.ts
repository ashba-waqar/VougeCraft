import { Platform } from 'react-native';
import { Skia, ImageFormat } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { Sketch, StrokeItem, ShapeItem } from '../types/canvas';
import { supabase } from '../services/supabase';
import { showToast } from '../utils/toast';

export interface PngExportOptions {
  transparent?: boolean;
  excludeFigure?: boolean;
  scale?: number;
}

export interface PngExportResult {
  uri: string;
  base64: string;
}

/**
 * Renders an SVG fallback string when Skia surface is unavailable (e.g. web)
 */
export function renderSketchSvg(sketch: Sketch, transparent: boolean, excludeFigure: boolean): string {
  const width = sketch.canvasSize?.width || 375;
  const height = sketch.canvasSize?.height || 667;
  const bg = transparent ? 'none' : '#F7F4EE';

  let elements = '';
  for (const layer of sketch.layers) {
    if (!layer.visible) continue;
    if (excludeFigure && layer.type === 'figure') continue;

    let layerContent = '';
    for (const item of layer.items) {
      if (item.type === 'stroke') {
        const s = item as StrokeItem;
        const dash = s.isDashed ? 'stroke-dasharray="4,4"' : '';
        layerContent += `<path d="${s.svgPath}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-opacity="${s.opacity || 1}" stroke-linecap="round" stroke-linejoin="round" ${dash} />\n`;
      } else if (item.type === 'shape') {
        const sh = item as ShapeItem;
        const fill = sh.fill?.type === 'color' ? sh.fill.value : 'none';
        const strokeColor = sh.stroke?.color || '#0E0E10';
        const strokeWidth = sh.stroke?.width || 1.5;
        layerContent += `<path d="${sh.svgPath}" fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n`;
      }
    }
    elements += `<g id="${layer.id}" opacity="${layer.opacity || 1}">\n${layerContent}</g>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${elements}
  </svg>`;
}

/**
 * Snapshot of the sketch at 2x resolution with paper background or transparent contour
 */
export async function exportSketchPng(
  sketch: Sketch,
  options: PngExportOptions = {}
): Promise<PngExportResult> {
  const scale = options.scale || 2;
  const baseWidth = sketch.canvasSize?.width || 375;
  const baseHeight = sketch.canvasSize?.height || 667;
  const targetWidth = Math.round(baseWidth * scale);
  const targetHeight = Math.round(baseHeight * scale);
  const transparent = !!options.transparent;
  const excludeFigure = !!options.excludeFigure;

  let base64 = '';

  // Try Skia native makeImageSnapshot at 2x resolution
  try {
    if (Skia?.Surface?.Make) {
      const surface = Skia.Surface.Make(targetWidth, targetHeight);
      if (surface) {
        const canvas = surface.getCanvas();
        canvas.scale(scale, scale);

        if (!transparent) {
          const bgPaint = Skia.Paint();
          bgPaint.setColor(Skia.Color('#F7F4EE'));
          canvas.drawRect(
            { x: 0, y: 0, width: baseWidth, height: baseHeight },
            bgPaint
          );
        }

        for (const layer of sketch.layers) {
          if (!layer.visible) continue;
          if (excludeFigure && layer.type === 'figure') continue;

          for (const item of layer.items) {
            if (item.type === 'stroke') {
              const s = item as StrokeItem;
              const path = Skia.Path.MakeFromSVGString(s.svgPath);
              if (path) {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(s.color || '#0E0E10'));
                paint.setStrokeWidth(s.width || 2);
                paint.setStyle(1); // Stroke
                paint.setStrokeCap(1); // Round
                paint.setStrokeJoin(1); // Round
                paint.setAlphaf((s.opacity ?? 1) * (layer.opacity ?? 1));
                canvas.drawPath(path, paint);
              }
            } else if (item.type === 'shape') {
              const sh = item as ShapeItem;
              const path = Skia.Path.MakeFromSVGString(sh.svgPath);
              if (path) {
                if (sh.fill && sh.fill.type === 'color') {
                  const fillPaint = Skia.Paint();
                  fillPaint.setColor(Skia.Color(sh.fill.value));
                  fillPaint.setStyle(0); // Fill
                  fillPaint.setAlphaf(layer.opacity ?? 1);
                  canvas.drawPath(path, fillPaint);
                }
                const strokePaint = Skia.Paint();
                strokePaint.setColor(Skia.Color(sh.stroke?.color || '#0E0E10'));
                strokePaint.setStrokeWidth(sh.stroke?.width || 1.5);
                strokePaint.setStyle(1); // Stroke
                strokePaint.setStrokeCap(1);
                strokePaint.setStrokeJoin(1);
                strokePaint.setAlphaf(layer.opacity ?? 1);
                canvas.drawPath(path, strokePaint);
              }
            }
          }
        }

        const snapshot = surface.makeImageSnapshot();
        base64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);
      }
    }
  } catch (err) {
    console.warn('Skia surface snapshot failed, using fallback:', err);
  }

  // Fallback: If Skia is not available, convert SVG to base64
  if (!base64) {
    const svgString = renderSketchSvg(sketch, transparent, excludeFigure);
    base64 = btoa(unescape(encodeURIComponent(svgString)));
  }

  const filename = `voguecraft_${Date.now()}_${transparent ? 'trans' : 'flat'}.png`;
  const fileUri = `${FileSystem.cacheDirectory || ''}${filename}`;

  if (FileSystem.cacheDirectory) {
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { uri: fileUri, base64 };
  }

  // Web fallback data URI
  return { uri: `data:image/png;base64,${base64}`, base64 };
}

/**
 * Save image to device gallery (requesting permission)
 */
export async function saveToGallery(localUri: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = localUri;
      a.download = `voguecraft_export_${Date.now()}.png`;
      a.click();
      showToast('Saved');
      return true;
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      showToast('Gallery permission required');
      return false;
    }

    await MediaLibrary.saveToLibraryAsync(localUri);
    showToast('Saved to gallery');
    return true;
  } catch (err: any) {
    console.warn('Failed to save to gallery:', err);
    showToast('Failed to save to gallery');
    return false;
  }
}

/**
 * Share image via system share sheet
 */
export async function shareExportFile(localUri: string, mimeType = 'image/png'): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = localUri;
      a.download = `voguecraft_${Date.now()}.${mimeType === 'application/pdf' ? 'pdf' : 'png'}`;
      a.click();
      showToast('Exported');
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localUri, {
        mimeType,
        dialogTitle: 'Export design',
      });
      showToast('Exported');
    } else {
      showToast('Sharing unavailable');
    }
  } catch (err) {
    console.warn('Share error:', err);
  }
}

/**
 * Upload image to Supabase exports bucket at {user_id}/{uuid}.png
 */
export async function uploadExportToCloud(
  localUri: string,
  base64Data?: string
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast('Please sign in to upload to cloud');
      return null;
    }

    let bytes: Uint8Array;
    if (base64Data) {
      const binaryString = atob(base64Data);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      const b64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binaryString = atob(b64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    }

    const fileId = `${user.id}/${Date.now()}_export.png`;
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileId, bytes, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Upload error:', uploadError);
      showToast('Upload failed');
      return null;
    }

    showToast('Uploaded to cloud');
    return fileId;
  } catch (err) {
    console.warn('Cloud upload failed:', err);
    showToast('Upload failed');
    return null;
  }
}

/**
 * Clean up temporary exported file from cache
 */
export async function cleanUpExportFile(localUri: string): Promise<void> {
  try {
    if (Platform.OS !== 'web' && localUri && localUri.startsWith('file://')) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    }
  } catch {}
}
