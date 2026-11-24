import {
  ToolType,
  Point,
  ToolSettings,
  Layer,
  Viewport,
  CanvasItem,
  Fill,
} from '../../types/canvas';

export interface ToolContext {
  activeLayerId: string;
  settings: ToolSettings;
  layers: Layer[];
  viewport: Viewport;
  onCommitItem: (item: CanvasItem) => void;
  onUpdateShapeFill: (shapeId: string, layerId: string, fill: Fill) => void;
  onSelectItems?: (items: CanvasItem[]) => void;
}

export interface ITool {
  type: ToolType;
  name: string; // 1 to 2 words
  onPointerDown: (point: Point, ctx: ToolContext) => void;
  onPointerMove: (point: Point, ctx: ToolContext) => void;
  onPointerUp: (point: Point, ctx: ToolContext) => void;
  onCancel?: () => void;
}
