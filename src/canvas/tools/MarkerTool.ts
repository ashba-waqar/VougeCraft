import { ITool, ToolContext } from './Tool';
import { Point, StrokeItem } from '../../types/canvas';
import { StrokeBuilder } from '../engine/strokeBuilder';

export class MarkerTool implements ITool {
  type = 'marker' as const;
  name = 'Marker';
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
        tool: 'marker',
        baseWidth: ctx.settings.size * 2.2,
        stabilizer: ctx.settings.stabilizer,
      }
    );

    const stroke: StrokeItem = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'stroke',
      points,
      tool: 'marker',
      color: ctx.settings.color,
      width: ctx.settings.size * 2.2,
      opacity: 0.38, // Semi-transparent flat wash
      svgPath,
    };

    ctx.onCommitItem(stroke);
    this.currentPoints = [];
  }

  onCancel(): void {
    this.currentPoints = [];
  }
}
