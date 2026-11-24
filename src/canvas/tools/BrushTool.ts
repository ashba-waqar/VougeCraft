import { ITool, ToolContext } from './Tool';
import { Point, StrokeItem } from '../../types/canvas';
import { StrokeBuilder } from '../engine/strokeBuilder';

export class BrushTool implements ITool {
  type = 'brush' as const;
  name = 'Studio brush';
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
        tool: 'brush',
        baseWidth: ctx.settings.size * 1.6,
        stabilizer: ctx.settings.stabilizer || 40,
        isStylus: point.pressure !== undefined,
      }
    );

    const stroke: StrokeItem = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'stroke',
      points,
      tool: 'brush',
      color: ctx.settings.color,
      width: computedWidth,
      opacity: ctx.settings.opacity,
      svgPath,
    };

    ctx.onCommitItem(stroke);
    this.currentPoints = [];
  }

  onCancel(): void {
    this.currentPoints = [];
  }
}
