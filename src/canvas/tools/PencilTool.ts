import { ITool, ToolContext } from './Tool';
import { Point, StrokeItem } from '../../types/canvas';
import { StrokeBuilder } from '../engine/strokeBuilder';

export class PencilTool implements ITool {
  type = 'pencil' as const;
  name = 'Pencil';
  private currentPoints: Point[] = [];

  onPointerDown(point: Point, ctx: ToolContext): void {
    this.currentPoints = [point];
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    this.currentPoints.push(point);
  }

  onPointerUp(point: Point, ctx: ToolContext): void {
    this.currentPoints.push(point);
    if (this.currentPoints.length < 2) return;

    const { points, svgPath, computedWidth } = StrokeBuilder.processRawPoints(
      this.currentPoints,
      {
        tool: 'pencil',
        baseWidth: ctx.settings.size,
        stabilizer: ctx.settings.stabilizer,
      }
    );

    const stroke: StrokeItem = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'stroke',
      points,
      tool: 'pencil',
      color: ctx.settings.color,
      width: Math.max(computedWidth * 0.9, 0.8),
      opacity: Math.min(ctx.settings.opacity * 0.85, 0.9), // textured grain low build-up
      svgPath,
    };

    ctx.onCommitItem(stroke);
    this.currentPoints = [];
  }

  onCancel(): void {
    this.currentPoints = [];
  }
}
