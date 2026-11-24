import { ITool, ToolContext } from './Tool';
import { Point } from '../../types/canvas';
import { HitTestEngine } from '../engine/hitTest';

export class MoveTool implements ITool {
  type = 'move' as const;
  name = 'Move';
  private selectedItemId: string | null = null;
  private lastPoint: Point | null = null;

  onPointerDown(point: Point, ctx: ToolContext): void {
    const result = HitTestEngine.findShapeAtPoint(point, ctx.layers);
    if (result) {
      this.selectedItemId = result.shape.id;
      this.lastPoint = point;
      if (ctx.onSelectItems) {
        ctx.onSelectItems([result.shape]);
      }
    } else {
      this.selectedItemId = null;
      this.lastPoint = null;
      if (ctx.onSelectItems) {
        ctx.onSelectItems([]);
      }
    }
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    this.lastPoint = point;
  }

  onPointerUp(point: Point, ctx: ToolContext): void {
    this.lastPoint = null;
  }

  onCancel(): void {
    this.selectedItemId = null;
    this.lastPoint = null;
  }
}
