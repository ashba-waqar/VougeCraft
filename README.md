# VogueCraft

> Digital fashion sketchbook application for designers. Draw garments by hand or from templates, assign procedural fabrics, generate production tech sheets, and compile freeform moodboards.

---

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start the Expo development server
npx expo start
```

### Platform Commands
- **iOS Simulator**: `npx expo run:ios`
- **Android Emulator**: `npx expo run:android`
- **Web Studio**: `npx expo start --web`
- **Typecheck**: `npx tsc --noEmit`

---

## Tech Stack

- **Framework**: React Native 0.88 + Expo SDK 58 + TypeScript
- **Drawing Engine**: `@shopify/react-native-skia`
- **Gestures**: `react-native-gesture-handler`
- **Motion**: `react-native-reanimated`
- **State Management**: `Zustand` + `Immer`
- **Typography**: Playfair Display (editorial titles) + Inter (controls & body)
- **Icons**: `lucide-react-native` (line icons, 1.75 stroke)
- **Export**: `expo-print` (vector PDF) + `expo-sharing` + PNG

---

## Features & Screens

1. **Onboarding**:
   - 2 swipeable screens only.
   - Screen 1: Real-time animated pencil tracing a dress outline on paper canvas.
   - Screen 2: Staggered fade-in silhouettes of Western and Eastern silhouettes.

2. **Sketchbooks (Home)**:
   - 2-column paper card grid with vector preview thumbnails.
   - Skeleton loaders during load.
   - Floating action button: "New design" opening a bottom sheet (Blank page, Figure template, Garment template).
   - Line-art empty state ("No sketches yet").

3. **Design Studio Canvas**:
   - Skia 60fps live stroke pipeline on UI thread.
   - 12 Tools: Pencil, Fine liner, Marker, Studio brush, Eraser, Line (15° snap & stitch dashed), Bezier curve, Shapes (rounded rect, ellipse, polygon), Fill tool, Lasso, Move, and Text notes.
   - Multi-touch viewport: pinch zoom (25% to 800%), 2-finger pan, 2-finger rotation with 90° snap.
   - Gestures: 2-finger tap to undo, 3-finger tap to redo, double-tap with Move tool to fit canvas.
   - Canvas surface always stays paper-colored (`#F7F4EE`) in both light and dark theme.

4. **AI Studio & Motif Generator**:
   - Sparkle icon in the canvas top bar or Studio tab.
   - 4 Tabs: Motif & Embroidery, Clean sketch, Palette harmonizer, Silhouette variants.
   - Style chips: Zardozi, Zari, Resham, Floral, Geometric, Paisley.
   - Density and scale sliders with seamless tileable motifs.
   - Non-destructive application to garment parts (e.g. kurta sleeves or body) or border brush along drawn hems.
   - Palette Harmonizer with Color Theory rules, Kundan/Polki jewellery pairings, and Khussa/Kolhapuri footwear matches.

5. **3D Draping Studio**:
   - Cube icon in the canvas top bar.
   - Multi-layer wardrobe stack (Shirt, Plazo, Sharara, Dupatta, Jacket, Kurta, Lehenga).
   - Reorder layers (e.g. Dupatta over Kurta over Shirt) and toggle visibility.
   - 7 PBR fabric presets: Jamawar, Silk, Organza, Chiffon, Velvet, Denim, Linen.
   - Dynamic vertex sway Fall & Flow slider, studio floor spotlight, and 360° light direction orbital control.
   - Free glTF drop-in: Place any CC0/free mannequin (`mannequin.gltf` or `mannequin.glb`) into `assets/models/`.

6. **Library**:
   - Segmented control: Western, Eastern, Figures.
   - Subcategory filter chips: Tops, Bottoms, Dresses, Outerwear, Formal, Bridal.
   - 1-tap "Design" button to start sketching directly over the chosen template.

7. **Moodboards & Lookbook Export**:
   - Freeform tactile moodboard canvas.
   - Pin sketches, fabric swatches, color palettes, and photos.
   - Rotate, enlarge, group, and arrange items.
   - **Palette Tool**: Automatically extracts a 5-color fashion harmony from uploaded photos.
   - **Lookbook Export**: Multi-page PDF with cover page, core silhouette blueprint, palette strip, and curated fabric notes.

8. **Tech Sheet (Spec Sheet)**:
   - Auto-generated technical production sheet for any garment.
   - Front and back technical flat views with seamlines.
   - 7-Point measurements table: Chest, Waist, Hip, Shoulder, Sleeve, Length, Inseam.
   - Unit toggle (`inch` vs `cm`) with auto-conversion calculation.
   - Fabric specification, stitch standard, embroidery details, and tailor notes.
   - Print-ready tailor PDF export and image sharing.

9. **Export**:
   - Bottom sheet with live preview and format selector: PNG image, Transparent PNG, and PDF document.
   - Single gradient-free accent button: "Export".

10. **Profile**:
   - Studio atelier identity and stats (sketches and boards).
   - Saved color palettes.
   - Settings list: Light/Dark theme toggle (live switch), grid defaults, stylus mode, sign out.

---

## Bottom Navigation Bar

The app provides a 5-tab bottom navigation bar:
- `Sketchbooks`: Project collection grid and drafts.
- `Library`: Western/Eastern garment flats and croquis figures.
- `Studio`: Active drawing canvas with Skia engine, AI Assist, and 3D Studio.
- `Boards`: Freeform moodboards and lookbook compilation.
- `Profile`: Atelier settings, preferences, and saved palettes.

---

## Design System Guidelines

- **Colors**:
  - Ink: `#0E0E10` (Dark Mode: `#F5F5F7`)
  - Paper: `#F7F4EE` (Dark Mode: `#141416`)
  - Canvas Paper: strictly `#F7F4EE` in all themes
  - Accent: `#6C5CE7` (Dark Mode: `#8374F5`)
  - Accent Soft: `#EDEAFD` (Dark Mode: `#2C274E`)
  - Line: `#E3DDD1` (Dark Mode: `#32323D`)
- **Radii**: Cards `20px`, Buttons `14px`, Chips `999px`.
- **Copy**: 1 to 3 words per label. Helper text max 6 words. Zero emojis. Zero shopping UI.
