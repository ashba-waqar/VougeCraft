export interface LookbookDesignItem {
  id: string;
  title: string;
  imageBase64?: string;
  paletteColors?: string[];
  fabrics?: string;
  notes?: string;
}

export interface LookbookHtmlData {
  title: string;
  designerName?: string;
  season?: string;
  designs: LookbookDesignItem[];
  contactLine?: string;
  showWatermark?: boolean;
}

export function generateLookbookHtml(data: LookbookHtmlData): string {
  const designer = data.designerName || 'Couture Designer';
  const season = data.season || 'Autumn / Winter Atelier Edition';
  const showWatermark = data.showWatermark !== false;

  const designPagesHtml = (data.designs || [])
    .map((design, idx) => {
      const paletteHtml = (design.paletteColors || ['#7F0020', '#C9A24B', '#1A1A1F', '#F7F4EE'])
        .slice(0, 5)
        .map(
          (hex) => `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div style="width: 36px; height: 36px; border-radius: 6px; background-color: ${hex}; border: 1px solid rgba(0,0,0,0.12);"></div>
            <span style="font-size: 9px; font-weight: 600; color: #52535A;">${hex}</span>
          </div>`
        )
        .join('');

      const imgTag = design.imageBase64
        ? `<img src="data:image/png;base64,${design.imageBase64}" style="max-width: 100%; max-height: 380px; object-fit: contain; margin: 0 auto; display: block;" />`
        : `<div style="height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FDFBF8; border-radius: 8px; border: 1px dashed #EDE8DF; color: #7E8088; font-size: 13px;">
            <span>Silhouette Illustration</span>
            <span style="font-size: 11px; margin-top: 4px;">Plate ${idx + 1}</span>
          </div>`;

      return `
        <!-- Design Plate Page ${idx + 1} -->
        <div class="page design-page">
          <div class="plate-header">
            <span class="plate-number">Plate ${String(idx + 1).padStart(2, '0')}</span>
            <span class="plate-title">${design.title}</span>
          </div>

          <div class="design-layout">
            <!-- Left: Large Sketch Graphic -->
            <div class="design-visual-box">
              ${imgTag}
            </div>

            <!-- Right: Details, Palette & Notes -->
            <div class="design-details-box">
              <div class="meta-card">
                <div class="meta-heading">Color Harmony</div>
                <div style="display: flex; gap: 10px; margin-top: 8px;">
                  ${paletteHtml}
                </div>
              </div>

              <div class="meta-card">
                <div class="meta-heading">Textile & Fabric Curation</div>
                <div class="meta-body">
                  ${design.fabrics || 'Silk Organza bodice layered with hand-woven Brocade and metallic thread accents.'}
                </div>
              </div>

              <div class="meta-card">
                <div class="meta-heading">Atelier Craftsmanship Notes</div>
                <div class="meta-body">
                  ${design.notes || 'Contoured tailored fit with handcrafted embroidery finish along perimeter.'}
                </div>
              </div>
            </div>
          </div>

          <div class="plate-footer">
            <span>${data.title} &bull; ${designer}</span>
            ${showWatermark ? '<span class="watermark-tag">Made with VogueCraft</span>' : ''}
            <span>Page ${idx + 2}</span>
          </div>
        </div>
      `;
    })
    .join('');

  const contactSectionHtml = data.contactLine
    ? `
      <!-- Optional Final Contact Page -->
      <div class="page cover-page">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 4px; color: #7F0020; font-weight: 700;">Atelier Enquiries</div>
        <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; margin: 20px 0 10px 0;">${designer}</div>
        <div style="font-size: 14px; color: #52535A; letter-spacing: 1px;">${data.contactLine}</div>
        <div class="cover-rule"></div>
        ${showWatermark ? '<div style="font-size: 11px; color: #7F0020; font-weight: 600; letter-spacing: 1px;">Made with VogueCraft</div>' : ''}
      </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
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
          }
          .page {
            page-break-after: always;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 10px 14px;
          }
          .cover-page {
            align-items: center;
            justify-content: center;
            text-align: center;
            min-height: 480px;
          }
          .cover-brand {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 5px;
            color: #7F0020;
            font-weight: 700;
            margin-bottom: 24px;
          }
          .cover-title {
            font-family: "Playfair Display", Georgia, serif;
            font-size: 44px;
            font-weight: 700;
            letter-spacing: -1px;
            margin: 0 0 10px 0;
            color: #1A1A1F;
          }
          .cover-sub {
            font-size: 16px;
            color: #7E8088;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 24px;
          }
          .cover-rule {
            width: 70px;
            height: 2px;
            background-color: #7F0020;
            margin: 0 auto 24px auto;
          }
          .cover-designer {
            font-size: 14px;
            font-weight: 600;
            color: #3A0A16;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }
          .plate-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            border-bottom: 1px solid #EDE8DF;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .plate-number {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #7F0020;
            font-weight: 700;
          }
          .plate-title {
            font-family: "Playfair Display", Georgia, serif;
            font-size: 20px;
            font-weight: 700;
            color: #1A1A1F;
          }
          .design-layout {
            display: flex;
            gap: 24px;
            flex: 1;
            align-items: stretch;
          }
          .design-visual-box {
            flex: 1.2;
            background: #FDFBF8;
            border-radius: 12px;
            border: 1px solid #EDE8DF;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .design-details-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
            justify-content: center;
          }
          .meta-card {
            background: #FFFFFF;
            border-radius: 8px;
            border: 1px solid #EDE8DF;
            padding: 14px 16px;
          }
          .meta-heading {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: #7E8088;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .meta-body {
            font-size: 12px;
            line-height: 1.5;
            color: #1A1A1F;
          }
          .plate-footer {
            border-top: 1px solid #EDE8DF;
            padding-top: 8px;
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #7E8088;
          }
          .watermark-tag {
            color: #7F0020;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <!-- Page 1: Editorial Cover -->
        <div class="page cover-page">
          <div class="cover-brand">VogueCraft Atelier Editions</div>
          <div class="cover-title">${data.title}</div>
          <div class="cover-sub">${season}</div>
          <div class="cover-rule"></div>
          <div class="cover-designer">Curated by ${designer}</div>
          ${showWatermark ? '<div style="margin-top: 36px; font-size: 10px; color: #7F0020; letter-spacing: 1px; font-weight: 600;">Made with VogueCraft</div>' : ''}
        </div>

        ${designPagesHtml}

        ${contactSectionHtml}
      </body>
    </html>
  `;
}
