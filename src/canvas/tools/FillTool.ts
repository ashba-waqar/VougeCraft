import { ITool, ToolContext } from './Tool';
import { Point } from '../../types/canvas';
import { HitTestEngine } from '../engine/hitTest';

export class FillTool implements ITool {
  type = 'fill' as const;
  name = 'Fill';

  onPointerDown(point: Point, ctx: ToolContext): void {
    // Find shape under tap using hitTest
    const result = HitTestEngine.findShapeAtPoint(point, ctx.layers);

    if (result) {
      const activeFill = ctx.settings.fill || {
        type: 'color',
        value: ctx.settings.color,
        scale: 1.0,
        rotation: 0,
      };

      ctx.onUpdateShapeFill(result.shape.id, result.layerId, activeFill);
    }
  }

  onPointerMove(point: Point, ctx: ToolContext): void {}
  onPointerUp(point: Point, ctx: ToolContext): void {}
}
