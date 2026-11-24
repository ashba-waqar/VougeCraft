export interface TechPackMeasurement {
  label: string;
  value: string;
}

export interface TechPackFabricItem {
  name: string;
  color?: string;
  notes?: string;
}

export interface TechPackHtmlData {
  title: string;
  designerName?: string;
  date?: string;
  frontImageBase64?: string;
  backImageBase64?: string;
  measurements: TechPackMeasurement[];
  unit: 'inch' | 'cm';
  fabrics: TechPackFabricItem[] | string;
  paletteColors?: string[];
  stitchNotes?: string[] | string;
  embroideryNotes?: string[] | string;
  notes?: string;
  showWatermark?: boolean; // 'Made with VogueCraft' footer label
}

export function generateTechPackHtml(data: TechPackHtmlData): string {
  const dateStr = data.date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const designer = data.designerName || 'Couture Designer';
  const unitUpper = (data.unit || 'INCH').toUpperCase();

  // Measurement table rows
  const measRows = (data.measurements || [])
    .map(
      (m) => `
      <tr>
        <td style="padding: 7px 12px; border-bottom: 1px solid #EDE8DF; font-weight: 500; font-size: 12px; color: #1A1A1F;">${m.label}</td>
        <td style="padding: 7px 12px; border-bottom: 1px solid #EDE8DF; font-weight: 700; font-size: 12px; text-align: right; color: #7F0020;">${m.value} ${unitUpper === 'INCH' ? 'in' : 'cm'}</td>
      </tr>`
    )
    .join('');

  // Palette chips
  const paletteChipsHtml = (data.paletteColors || ['#7F0020', '#C9A24B', '#1A1A1F', '#F7F4EE'])
    .slice(0, 6)
    .map(
      (hex) => `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <div style="width: 32px; height: 32px; border-radius: 6px; background-color: ${hex}; border: 1px solid rgba(0,0,0,0.12);"></div>
        <span style="font-size: 9px; font-weight: 600; color: #52535A;">${hex}</span>
      </div>`
    )
    .join('');

  // Parse fabric list
  let fabricRowsHtml = '';
  if (Array.isArray(data.fabrics)) {
    fabricRowsHtml = data.fabrics
      .map(
        (f) => `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <div style="width: 18px; height: 18px; border-radius: 4px; background-color: ${f.color || '#7F0020'}; border: 1px solid rgba(0,0,0,0.1);"></div>
          <span style="font-size: 12px; font-weight: 600; color: #1A1A1F;">${f.name}</span>
          ${f.notes ? `<span style="font-size: 11px; color: #7E8088;">&bull; ${f.notes}</span>` : ''}
        </div>`
      )
      .join('');
  } else {
    fabricRowsHtml = `
      <div style="font-size: 12px; line-height: 1.5; color: #1A1A1F;">
        ${data.fabrics || 'Silk Organza body with Raw Silk facings and Gold Zari embroidery trim.'}
      </div>`;
  }

  // Parse stitch & embroidery notes
  const stitchNotesText = Array.isArray(data.stitchNotes)
    ? data.stitchNotes.join('<br>')
    : data.stitchNotes || 'Single needle 1/4 inch seam allowance. French seams on silk panels. Clean blind-stitch hem.';

  const embroideryNotesText = Array.isArray(data.embroideryNotes)
    ? data.embroideryNotes.join('<br>')
    : data.embroideryNotes || 'Hand-guided metallic zardozi and zari thread relief along neckline and cuffs.';

  const freeNotesText = data.notes || 'Atelier technical production specification. Strictly bespoke craftsmanship.';

  // Blueprint image embeds
  const frontImgTag = data.frontImageBase64
    ? `<img src="data:image/png;base64,${data.frontImageBase64}" style="max-width: 100%; max-height: 180px; object-fit: contain; margin: 0 auto; display: block;" />`
    : `<div style="height: 160px; display: flex; align-items: center; justify-content: center; color: #7E8088; font-size: 11px;">Front blueprint flat</div>`;

  const backImgTag = data.backImageBase64
    ? `<img src="data:image/png;base64,${data.backImageBase64}" style="max-width: 100%; max-height: 180px; object-fit: contain; margin: 0 auto; display: block;" />`
    : `<div style="height: 160px; display: flex; align-items: center; justify-content: center; color: #7E8088; font-size: 11px;">Back blueprint flat</div>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
            background-color: #FFFFFF;
            color: #0E0E10;
            margin: 0;
            padding: 0;
            line-height: 1.4;
          }
          .header {
            border-bottom: 2px solid #7F0020;
            padding-bottom: 12px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .brand-title {
            font-family: "Playfair Display", Georgia, serif;
            font-size: 24px;
            font-weight: 700;
            color: #7F0020;
            letter-spacing: -0.5px;
            margin: 0 0 4px 0;
          }
          .sketch-title {
            font-size: 16px;
            font-weight: 600;
            color: #1A1A1F;
            margin: 0 0 2px 0;
          }
          .meta-row {
            font-size: 11px;
            color: #7E8088;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .section-card {
            background: #FFFFFF;
            border-radius: 8px;
            border: 1px solid #EDE8DF;
            padding: 14px;
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .section-heading {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin: 0 0 10px 0;
            color: #7F0020;
          }
          .blueprint-grid {
            display: flex;
            gap: 16px;
          }
          .blueprint-box {
            flex: 1;
            background: #FDFBF8;
            border: 1px solid #EDE8DF;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
          }
          .blueprint-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #7E8088;
            margin-bottom: 6px;
            font-weight: 600;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
          }
          .notes-grid {
            display: flex;
            gap: 14px;
          }
          .note-cell {
            flex: 1;
            background: #FDFBF8;
            border: 1px solid #EDE8DF;
            border-radius: 6px;
            padding: 10px 12px;
          }
          .note-cell-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #7E8088;
            margin-bottom: 4px;
            font-weight: 700;
          }
          .note-cell-text {
            font-size: 11px;
            line-height: 1.5;
            color: #1A1A1F;
          }
          .footer {
            margin-top: 18px;
            border-top: 1px solid #EDE8DF;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #7E8088;
          }
          .watermark-badge {
            font-size: 10px;
            color: #7F0020;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div>
            <div class="brand-title">VogueCraft Atelier</div>
            <div class="sketch-title">${data.title}</div>
            <div class="meta-row">Designer: <strong>${designer}</strong> &bull; Date: <strong>${dateStr}</strong></div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #52535A;">
            <div>Unit Standard: <strong>${unitUpper}</strong></div>
            <div>Spec: <strong>Haute Couture Technical Flat</strong></div>
          </div>
        </div>

        <!-- Blueprint Flats Section -->
        <div class="section-card">
          <div class="section-heading">1. Blueprint Silhouette Flats</div>
          <div class="blueprint-grid">
            <div class="blueprint-box">
              <div class="blueprint-label">Front View</div>
              ${frontImgTag}
            </div>
            <div class="blueprint-box">
              <div class="blueprint-label">Back View</div>
              ${backImgTag}
            </div>
          </div>
        </div>

        <!-- 7-Point Measurement Table -->
        <div class="section-card">
          <div class="section-heading">2. Technical Measurements (${unitUpper})</div>
          <table class="table">
            <tbody>
              ${measRows}
            </tbody>
          </table>
        </div>

        <!-- Materials & Color Palette -->
        <div class="section-card">
          <div class="section-heading">3. Textile Curation & Color Palette</div>
          <div style="display: flex; gap: 20px; align-items: flex-start;">
            <div style="flex: 1.2;">
              <div style="font-size: 10px; text-transform: uppercase; color: #7E8088; margin-bottom: 6px; font-weight: 600;">Fabric Specification</div>
              ${fabricRowsHtml}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 10px; text-transform: uppercase; color: #7E8088; margin-bottom: 6px; font-weight: 600;">Color Harmony Strip</div>
              <div style="display: flex; gap: 8px;">
                ${paletteChipsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Construction & Notes -->
        <div class="section-card">
          <div class="section-heading">4. Construction Standards & Finishing</div>
          <div class="notes-grid">
            <div class="note-cell">
              <div class="note-cell-label">Stitch & Seam Standard</div>
              <div class="note-cell-text">${stitchNotesText}</div>
            </div>
            <div class="note-cell">
              <div class="note-cell-label">Embroidery & Embellishment</div>
              <div class="note-cell-text">${embroideryNotesText}</div>
            </div>
          </div>
        </div>

        <!-- Atelier Free Notes -->
        <div class="section-card">
          <div class="section-heading">5. Atelier Free Notes</div>
          <div style="font-size: 11px; line-height: 1.5; color: #1A1A1F;">
            ${freeNotesText}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>Technical Spec Document &bull; Confidential Production Specification</div>
          ${data.showWatermark !== false ? '<div class="watermark-badge">Made with VogueCraft</div>' : ''}
          <div>Page 1 of 1</div>
        </div>
      </body>
    </html>
  `;
}
