export type ToolType =
  | 'pencil'
  | 'fineliner'
  | 'marker'
  | 'brush'
  | 'eraser'
  | 'line'
  | 'curve'
  | 'shape'
  | 'fill'
  | 'lasso'
  | 'move'
  | 'textNote';

export type LayerType = 'figure' | 'garment' | 'details' | 'notes';

export type FabricId =
  | 'silk'
  | 'denim'
  | 'lace'
  | 'wool'
  | 'chiffon'
  | 'velvet'
  | 'brocade'
  | 'linen';

export type PatternId =
  | 'stripes'
  | 'florals'
  | 'paisley'
  | 'houndstooth'
  | 'polka'
  | 'checks';

export type DetailType =
  | 'stitch_single'
  | 'stitch_double'
  | 'topstitch'
  | 'button_round'
  | 'button_shank'
  | 'zipper'
  | 'pleat_knife'
  | 'pleat_box'
  | 'dart'
  | 'pocket_patch'
  | 'pocket_welt'
  | 'collar_notch'
  | 'collar_mandarin'
  | 'cuff_button'
  | 'embroidery_floral'
  | 'embroidery_zari'
  | 'tassel';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

export interface Fill {
  type: 'color' | 'fabric' | 'pattern';
  value: string; // color hex, or fabric id, or pattern id
  scale: number; // 0.25 to 4.0
  rotation: number; // 0 to 360
  opacity?: number;
}

export interface StrokeItem {
  id: string;
  type: 'stroke';
  points: Point[];
  tool: ToolType;
  color: string;
  width: number;
  opacity: number;
  svgPath: string;
  isDashed?: boolean;
}

export interface ShapeItem {
  id: string;
  type: 'shape';
  name?: string; // e.g. "Body", "Left Sleeve", "Collar"
  shapeType: 'rect' | 'ellipse' | 'polygon' | 'path';
  svgPath: string;
  closed: boolean;
  fill?: Fill;
  stroke?: {
    color: string;
    width: number;
    style?: 'solid' | 'dashed';
  };
}

export interface DetailStampItem {
  id: string;
  type: 'detailStamp';
  stampType: DetailType;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  mirrored?: boolean;
  color: string;
}

export interface TextNoteItem {
  id: string;
  type: 'textNote';
  text: string;
  position: { x: number; y: number };
  size: number;
  color: string;
}

export interface ImageItem {
  id: string;
  type: 'image';
  uri: string;
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
}

export type CanvasItem =
  | StrokeItem
  | ShapeItem
  | DetailStampItem
  | TextNoteItem
  | ImageItem;

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  items: CanvasItem[];
}

export interface Viewport {
  scale: number; // 0.25 to 8.0
  translateX: number;
  translateY: number;
  rotation: number; // 0, 90, 180, 270
}

export interface Guides {
  dotGrid: boolean;
  centerLine: boolean;
  snapToGrid: boolean;
  proportionGuides: boolean;
}

export interface Sketch {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  canvasSize: { width: number; height: number };
  layers: Layer[];
  viewport: Viewport;
  guides: Guides;
}

export interface ToolSettings {
  size: number; // 1 to 60
  opacity: number; // 0.05 to 1.0
  stabilizer: number; // 0 to 100
  color: string;
  fill?: Fill;
  isDashed?: boolean;
  snap15Deg?: boolean;
}

export interface Command {
  id: string;
  name: string;
  execute: () => void;
  undo: () => void;
}
