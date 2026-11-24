import { ITool, ToolContext } from './Tool';
import { Point, StrokeItem } from '../../types/canvas';
import { StrokeBuilder } from '../engine/strokeBuilder';

export class FineLinerTool implements ITool {
  type = 'fineliner' as const;
  name = 'Fine liner';
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

    const { points, svgPath } = StrokeBuilder.processRawPoints(
      this.currentPoints,
      {
        tool: 'fineliner',
        baseWidth: ctx.settings.size,
        stabilizer: ctx.settings.stabilizer,
      }
    );

    const stroke: StrokeItem = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'stroke',
      points,
      tool: 'fineliner',
      color: ctx.settings.color,
      width: ctx.settings.size, // Constant width, crisp edge
      opacity: 1.0,
      svgPath,
    };

    ctx.onCommitItem(stroke);
    this.currentPoints = [];
  }

  onCancel(): void {
    this.currentPoints = [];
  }
}
