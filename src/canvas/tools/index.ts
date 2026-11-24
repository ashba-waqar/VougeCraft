import { ITool } from './Tool';
import { ToolType } from '../../types/canvas';
import { PencilTool } from './PencilTool';
import { FineLinerTool } from './FineLinerTool';
import { MarkerTool } from './MarkerTool';
import { BrushTool } from './BrushTool';
import { EraserTool } from './EraserTool';
import { LineTool } from './LineTool';
import { CurveTool } from './CurveTool';
import { ShapeTool } from './ShapeTool';
import { FillTool } from './FillTool';
import { LassoTool } from './LassoTool';
import { MoveTool } from './MoveTool';
import { TextNoteTool } from './TextNoteTool';

export * from './Tool';
export * from './PencilTool';
export * from './FineLinerTool';
export * from './MarkerTool';
export * from './BrushTool';
export * from './EraserTool';
export * from './LineTool';
export * from './CurveTool';
export * from './ShapeTool';
export * from './FillTool';
export * from './LassoTool';
export * from './MoveTool';
export * from './TextNoteTool';

export function createTool(type: ToolType): ITool {
  switch (type) {
    case 'pencil':
      return new PencilTool();
    case 'fineliner':
      return new FineLinerTool();
    case 'marker':
      return new MarkerTool();
    case 'brush':
      return new BrushTool();
    case 'eraser':
      return new EraserTool();
    case 'line':
      return new LineTool();
    case 'curve':
      return new CurveTool();
    case 'shape':
      return new ShapeTool();
    case 'fill':
      return new FillTool();
    case 'lasso':
      return new LassoTool();
    case 'move':
      return new MoveTool();
    case 'textNote':
      return new TextNoteTool();
  }
}
