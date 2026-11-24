import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Sketch, ShapeItem, StrokeItem } from '../../types/canvas';

export interface ExportResult {
  uri: string;
  format: 'png' | 'pdf';
  transparent: boolean;
}

export class ExportEngine {
  /**
   * Render sketch layers into an SVG string.
   */
  static generateSvgString(sketch: Sketch, transparent: boolean = false): string {
    const { width, height } = sketch.canvasSize;
    const bgColor = transparent ? 'none' : '#F7F4EE';

    let svgElements = '';

    // Render layers from bottom to top
    for (const layer of sketch.layers) {
      if (!layer.visible) continue;

      let layerContent = '';
      for (const item of layer.items) {
        if (item.type === 'stroke') {
          const s = item as StrokeItem;
          const strokeColor = s.color;
          const strokeWidth = s.width;
          const opacity = s.opacity;
          const dash = s.isDashed ? 'stroke-dasharray="4,4"' : '';
          layerContent += `<path d="${s.svgPath}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" ${dash} />\n`;
        } else if (item.type === 'shape') {
          const sh = item as ShapeItem;
          let fillColor = 'none';
          if (sh.fill) {
            fillColor = sh.fill.type === 'color' ? sh.fill.value : '#7F0020';
          }
          const strokeColor = sh.stroke?.color || '#0E0E10';
          const strokeWidth = sh.stroke?.width || 1.5;
          layerContent += `<path d="${sh.svgPath}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n`;
        } else if (item.type === 'textNote') {
          layerContent += `<text x="${item.position.x}" y="${item.position.y}" font-family="Inter, sans-serif" font-size="${item.size}" fill="${item.color}">${item.text}</text>\n`;
        }
      }

      svgElements += `<g id="${layer.id}" opacity="${layer.opacity}">\n${layerContent}</g>\n`;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="${bgColor}" />
        ${svgElements}
      </svg>
    `;
  }

  /**
   * Export sketch as PDF using expo-print.
   */
  static async exportPdf(sketch: Sketch, transparent: boolean = false): Promise<string> {
    const svg = this.generateSvgString(sketch, transparent);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: ${transparent ? 'transparent' : '#F7F4EE'}; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${svg}
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return uri;
  }

  /**
   * Export sketch as PNG data URI or file URI.
   */
  static async exportPng(sketch: Sketch, transparent: boolean = false): Promise<string> {
    const svg = this.generateSvgString(sketch, transparent);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Export tailor-ready Tech Pack spec sheet as PDF.
   */
  static async exportTechSheetPdf(data: {
    title: string;
    measurements: { label: string; value: string }[];
    unit: string;
    fabricNotes: string;
    stitchNotes: string;
    embroideryNotes: string;
    notes: string;
    frontPath: string;
    backPath: string;
  }): Promise<string> {
    const measRows = data.measurements
      .map(
        (m) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2DFD8; font-weight: 500; font-size: 13px;">${m.label}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2DFD8; font-weight: 600; font-size: 13px; text-align: right; color: #7F0020;">${m.value}</td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
              background-color: #F7F4EE;
              color: #0E0E10;
              margin: 0;
              padding: 32px;
            }
            .header {
              border-bottom: 2px solid #0E0E10;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title {
              font-family: "Playfair Display", Georgia, serif;
              font-size: 26px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .subtitle {
              font-size: 12px;
              color: #7E8088;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-top: 4px;
            }
            .section {
              background: #FFFFFF;
              border-radius: 12px;
              border: 1px solid #E2DFD8;
              padding: 20px;
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0 0 16px 0;
              color: #131418;
            }
            .flats-container {
              display: flex;
              gap: 24px;
              justify-content: center;
            }
            .flat-box {
              flex: 1;
              text-align: center;
              background: #FDFBF7;
              border: 1px solid #EAE7E0;
              border-radius: 8px;
              padding: 16px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
            }
            .notes-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .note-card {
              background: #FDFBF7;
              border: 1px solid #EAE7E0;
              border-radius: 8px;
              padding: 12px 16px;
            }
            .note-title {
              font-size: 11px;
              text-transform: uppercase;
              color: #7E8088;
              margin-bottom: 4px;
              font-weight: 600;
            }
            .note-body {
              font-size: 13px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Technical Spec Sheet</h1>
              <div class="subtitle">VogueCraft Atelier &bull; ${data.title}</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #7E8088;">
              <div>Unit: <strong>${data.unit.toUpperCase()}</strong></div>
              <div>Standard: <strong>Haute Couture Flat</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Blueprint Flats</div>
            <div class="flats-container">
              <div class="flat-box">
                <div style="font-size: 11px; text-transform: uppercase; color: #7E8088; margin-bottom: 8px;">Front Flat</div>
                <svg viewBox="0 0 110 110" width="160" height="160" style="margin: 0 auto; display: block;">
                  <path d="${data.frontPath}" stroke="#0E0E10" stroke-width="1.75" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="flat-box">
                <div style="font-size: 11px; text-transform: uppercase; color: #7E8088; margin-bottom: 8px;">Back Flat</div>
                <svg viewBox="0 0 110 110" width="160" height="160" style="margin: 0 auto; display: block;">
                  <path d="${data.backPath}" stroke="#0E0E10" stroke-width="1.75" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                  <line x1="55" y1="24" x2="55" y2="96" stroke="#C2BFB8" stroke-width="1" stroke-dasharray="3,3" />
                </svg>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">7-Point Measurements (${data.unit.toUpperCase()})</div>
            <table class="table">
              <tbody>
                ${measRows}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Construction & Craftsmanship</div>
            <div class="notes-grid">
              <div class="note-card">
                <div class="note-title">Fabric Specification</div>
                <div class="note-body">${data.fabricNotes}</div>
              </div>
              <div class="note-card">
                <div class="note-title">Stitch Standard</div>
                <div class="note-body">${data.stitchNotes}</div>
              </div>
              <div class="note-card">
                <div class="note-title">Embroidery Details</div>
                <div class="note-body">${data.embroideryNotes}</div>
              </div>
              <div class="note-card">
                <div class="note-title">Atelier Notes</div>
                <div class="note-body">${data.notes}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    return uri;
  }

  /**
   * Export multi-page Atelier Lookbook as PDF.
   */
  static async exportLookbookPdf(data: {
    title: string;
    itemsCount: number;
    colorPalette: string[];
    frontPath: string;
  }): Promise<string> {
    const paletteChips = data.colorPalette
      .map(
        (hex) => `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
          <div style="width: 44px; height: 44px; border-radius: 8px; background-color: ${hex}; border: 1px solid rgba(0,0,0,0.1);"></div>
          <span style="font-size: 10px; font-weight: 600; color: #52535A;">${hex}</span>
        </div>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
              background-color: #F7F4EE;
              color: #0E0E10;
              margin: 0;
              padding: 0;
            }
            .page {
              padding: 48px 40px;
              min-height: 90vh;
              page-break-after: always;
              box-sizing: border-box;
            }
            .cover-title {
              font-family: "Playfair Display", Georgia, serif;
              font-size: 40px;
              font-weight: 700;
              letter-spacing: -1px;
              margin-top: 140px;
              margin-bottom: 8px;
            }
            .cover-sub {
              font-size: 14px;
              color: #7E8088;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 40px;
            }
            .line-rule {
              width: 80px;
              height: 2px;
              background-color: #7F0020;
              margin-bottom: 30px;
            }
            .section-header {
              font-family: "Playfair Display", Georgia, serif;
              font-size: 24px;
              margin-bottom: 16px;
              border-bottom: 1px solid #E2DFD8;
              padding-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <!-- Page 1: Editorial Cover -->
          <div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 4px; color: #7F0020; font-weight: 700;">VogueCraft Editions</div>
            <div class="cover-title">${data.title}</div>
            <div class="cover-sub">Atelier Lookbook &bull; Autumn/Winter</div>
            <div class="line-rule"></div>
            <div style="font-size: 13px; color: #7E8088;">A curated collection of couture flats, fabric swatches & embroidery studies</div>
          </div>

          <!-- Page 2: Design Blueprint & Palette -->
          <div class="page">
            <div class="section-header">Design Study &bull; Core Silhouette</div>
            <div style="display: flex; gap: 32px; align-items: center; margin-top: 32px;">
              <div style="flex: 1; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2DFD8; padding: 24px; text-align: center;">
                <svg viewBox="0 0 110 110" width="220" height="220" style="margin: 0 auto; display: block;">
                  <path d="${data.frontPath}" stroke="#0E0E10" stroke-width="1.75" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #7E8088; margin-bottom: 8px;">Harmonious Palette</div>
                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                  ${paletteChips}
                </div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #7E8088; margin-bottom: 8px;">Fabric Curation</div>
                <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #E2DFD8; padding: 16px; font-size: 13px; line-height: 1.6;">
                  <strong>Jamawar Brocade</strong> shell trimmed with <strong>Raw Silk</strong> and hand-guided <strong>Gold Zardozi</strong> embroidery along neckline and sleeve cuffs.
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    return uri;
  }

  /**
   * Share exported file.
   */
  static async share(uri: string, mimeType?: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: mimeType || 'application/pdf',
        dialogTitle: 'Export sketch',
      });
    }
  }
}
