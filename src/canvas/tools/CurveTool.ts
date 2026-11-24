import { ITool, ToolContext } from './Tool';
import { Point, ShapeItem } from '../../types/canvas';

export class CurveTool implements ITool {
  type = 'curve' as const;
  name = 'Bezier curve';
  private anchors: Point[] = [];

  onPointerDown(point: Point, ctx: ToolContext): void {
    // Check if tapping close to first anchor to close path
    if (this.anchors.length >= 3) {
      const first = this.anchors[0];
      const dist = Math.hypot(point.x - first.x, point.y - first.y);
      if (dist < 18) {
        this.finishPath(ctx, true);
        return;
      }
    }
    this.anchors.push(point);
  }

  onPointerMove(point: Point, ctx: ToolContext): void {}

  onPointerUp(point: Point, ctx: ToolContext): void {
    // If double tap or 4+ points, finish curve
    if (this.anchors.length >= 6) {
      this.finishPath(ctx, false);
    }
  }

  private finishPath(ctx: ToolContext, closed: boolean): void {
    if (this.anchors.length < 2) return;

    let path = `M ${this.anchors[0].x.toFixed(1)} ${this.anchors[0].y.toFixed(1)}`;
    for (let i = 1; i < this.anchors.length; i++) {
      path += ` L ${this.anchors[i].x.toFixed(1)} ${this.anchors[i].y.toFixed(1)}`;
    }
    if (closed) path += ' Z';

    const shape: ShapeItem = {
      id: `curve_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'shape',
      shapeType: 'path',
      closed,
      svgPath: path,
      stroke: {
        color: ctx.settings.color,
        width: ctx.settings.size,
        style: ctx.settings.isDashed ? 'dashed' : 'solid',
      },
    };

    ctx.onCommitItem(shape);
    this.anchors = [];
  }

  onCancel(): void {
    this.anchors = [];
  }
}
