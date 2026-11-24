import { ITool, ToolContext } from './Tool';
import { Point, StrokeItem } from '../../types/canvas';

export class LineTool implements ITool {
  type = 'line' as const;
  name = 'Line';
  private startPoint: Point | null = null;

  onPointerDown(point: Point, ctx: ToolContext): void {
    this.startPoint = point;
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    // Live feedback handled via live stroke shared value
  }

  onPointerUp(point: Point, ctx: ToolContext): void {
    if (!this.startPoint) return;

    let endX = point.x;
    let endY = point.y;

    // Shift-snap to 15 degree steps if enabled
    if (ctx.settings.snap15Deg) {
      const dx = point.x - this.startPoint.x;
      const dy = point.y - this.startPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const snapAngle = Math.round(angle / (Math.PI / 12)) * (Math.PI / 12);
      endX = this.startPoint.x + dist * Math.cos(snapAngle);
      endY = this.startPoint.y + dist * Math.sin(snapAngle);
    }

    const path = `M ${this.startPoint.x.toFixed(1)} ${this.startPoint.y.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;

    const stroke: StrokeItem = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'stroke',
      points: [this.startPoint, { x: endX, y: endY }],
      tool: 'line',
      color: ctx.settings.color,
      width: ctx.settings.size,
      opacity: ctx.settings.opacity,
      svgPath: path,
      isDashed: ctx.settings.isDashed, // for stitch lines
    };

    ctx.onCommitItem(stroke);
    this.startPoint = null;
  }

  onCancel(): void {
    this.startPoint = null;
  }
}
