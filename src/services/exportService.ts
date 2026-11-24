import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import {
  exportSketchPng,
  saveToGallery,
  shareExportFile,
  uploadExportToCloud,
  cleanUpExportFile,
  PngExportOptions,
  PngExportResult,
} from '../export/pngExport';
import {
  generateTechPackHtml,
  TechPackHtmlData,
} from '../export/templates/techPackHtml';
import {
  generateLookbookHtml,
  LookbookHtmlData,
  LookbookDesignItem,
} from '../export/templates/lookbookHtml';
import { Sketch } from '../types/canvas';
import { profileRepository } from './profileRepository';
import { showToast } from '../utils/toast';

export interface ExportTechPackOptions {
  sketch: Sketch;
  measurements?: Array<{ label: string; value: string }>;
  unit?: 'inch' | 'cm';
  fabricNotes?: string;
  stitchNotes?: string;
  embroideryNotes?: string;
  notes?: string;
  showWatermark?: boolean;
}

export interface ExportLookbookOptions {
  title?: string;
  designs: Array<{
    id: string;
    title: string;
    thumbnailUrl?: string | null;
    sketchData?: Sketch | null;
    paletteColors?: string[];
    fabrics?: string;
    notes?: string;
  }>;
  season?: string;
  contactLine?: string;
  showWatermark?: boolean;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export const exportService = {
  /**
   * Generates a 2x PNG or Transparent PNG snapshot of a sketch
   */
  async generatePng(sketch: Sketch, options: PngExportOptions = {}): Promise<PngExportResult> {
    return exportSketchPng(sketch, options);
  },

  /**
   * Saves an exported PNG to the user's gallery
   */
  async saveImageToGallery(localUri: string): Promise<boolean> {
    return saveToGallery(localUri);
  },

  /**
   * Shares an exported file via system share sheet
   */
  async shareFile(localUri: string, mimeType = 'image/png'): Promise<void> {
    await shareExportFile(localUri, mimeType);
    await cleanUpExportFile(localUri);
  },

  /**
   * Uploads an exported file to the private exports bucket
   */
  async uploadToCloud(localUri: string, base64Data?: string): Promise<string | null> {
    return uploadExportToCloud(localUri, base64Data);
  },

  /**
   * Generates and prints an A4 portrait Tech Pack PDF
   */
  async exportTechPackPdf(options: ExportTechPackOptions): Promise<string | null> {
    try {
      // Fetch designer name from profile
      let designerName = 'Couture Designer';
      try {
        const profile = await profileRepository.getProfile();
        if (profile?.displayName) {
          designerName = profile.displayName;
        }
      } catch {}

      // Snapshot the front flat view from the sketch at 2x resolution
      let frontBase64 = '';
      try {
        const snap = await exportSketchPng(options.sketch, {
          transparent: true,
          excludeFigure: true,
          scale: 2,
        });
        frontBase64 = snap.base64;
      } catch (err) {
        console.warn('Could not generate front flat snapshot:', err);
      }

      const html = generateTechPackHtml({
        title: options.sketch.title || 'Technical Garment Specification',
        designerName,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        frontImageBase64: frontBase64,
        backImageBase64: frontBase64, // Uses front flat with dashed midline in template
        measurements: options.measurements || [
          { label: 'Chest', value: '38' },
          { label: 'Waist', value: '32' },
          { label: 'Hip', value: '40' },
          { label: 'Shoulder', value: '15' },
          { label: 'Sleeve Length', value: '22' },
          { label: 'Garment Length', value: '44' },
          { label: 'Inseam', value: '30' },
        ],
        unit: options.unit || 'inch',
        fabrics: options.fabricNotes || 'Silk Organza body with Raw Silk facings and Gold Zari embroidery trim.',
        stitchNotes: options.stitchNotes || 'Single needle 1/4 inch seam allowance. French seams on silk panels. Clean blind-stitch hem.',
        embroideryNotes: options.embroideryNotes || 'Hand-guided metallic zardozi and zari thread relief along neckline and cuffs.',
        notes: options.notes || 'Atelier technical production specification. Strictly bespoke craftsmanship.',
        showWatermark: options.showWatermark !== false,
      });

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        showToast('Exported');
        return null;
      }

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      await shareExportFile(uri, 'application/pdf');
      await cleanUpExportFile(uri);
      return uri;
    } catch (err: any) {
      console.warn('Tech pack export error:', err);
      showToast('Export failed');
      return null;
    }
  },

  /**
   * Generates and prints an A4 landscape Lookbook PDF from selected designs
   */
  async exportLookbookPdf(options: ExportLookbookOptions): Promise<string | null> {
    try {
      let designerName = 'Couture Designer';
      try {
        const profile = await profileRepository.getProfile();
        if (profile?.displayName) {
          designerName = profile.displayName;
        }
      } catch {}

      const total = options.designs.length || 1;
      const preparedDesigns: LookbookDesignItem[] = [];

      for (let i = 0; i < options.designs.length; i++) {
        if (options.signal?.aborted) {
          showToast('Cancelled');
          return null;
        }

        const design = options.designs[i];
        let imageBase64 = '';

        try {
          if (design.sketchData) {
            const snap = await exportSketchPng(design.sketchData, {
              transparent: false,
              scale: 2,
            });
            imageBase64 = snap.base64;
          } else if (design.thumbnailUrl) {
            // Download thumbnail to base64
            if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
              const tempUri = `${FileSystem.cacheDirectory}lookbook_${design.id}.jpg`;
              const res = await FileSystem.downloadAsync(design.thumbnailUrl, tempUri);
              imageBase64 = await FileSystem.readAsStringAsync(res.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              await FileSystem.deleteAsync(res.uri, { idempotent: true });
            }
          }
        } catch (err) {
          console.warn(`Could not process design ${design.title} thumbnail:`, err);
        }

        preparedDesigns.push({
          id: design.id,
          title: design.title,
          imageBase64,
          paletteColors: design.paletteColors,
          fabrics: design.fabrics,
          notes: design.notes,
        });

        if (options.onProgress) {
          options.onProgress(Math.round(((i + 1) / total) * 100));
        }
      }

      const html = generateLookbookHtml({
        title: options.title || 'Haute Couture Edition',
        designerName,
        season: options.season || 'Autumn / Winter Atelier Edition',
        designs: preparedDesigns,
        contactLine: options.contactLine,
        showWatermark: options.showWatermark !== false,
      });

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        showToast('Exported');
        return null;
      }

      // A4 Landscape: width 842pt, height 595pt
      const { uri } = await Print.printToFileAsync({
        html,
        width: 842,
        height: 595,
        base64: false,
      });

      await shareExportFile(uri, 'application/pdf');
      await cleanUpExportFile(uri);
      return uri;
    } catch (err: any) {
      console.warn('Lookbook export error:', err);
      showToast('Export failed');
      return null;
    }
  },
};
