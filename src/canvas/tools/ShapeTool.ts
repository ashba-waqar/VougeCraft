import { ITool, ToolContext } from './Tool';
import { Point, ShapeItem } from '../../types/canvas';

export class ShapeTool implements ITool {
  type = 'shape' as const;
  name = 'Shape';
  private startPoint: Point | null = null;
  public shapeKind: 'rect' | 'ellipse' | 'polygon' = 'rect';

  onPointerDown(point: Point, ctx: ToolContext): void {
    this.startPoint = point;
  }

  onPointerMove(point: Point, ctx: ToolContext): void {}

  onPointerUp(point: Point, ctx: ToolContext): void {
    if (!this.startPoint) return;

    const x1 = Math.min(this.startPoint.x, point.x);
    const y1 = Math.min(this.startPoint.y, point.y);
    const w = Math.max(Math.abs(point.x - this.startPoint.x), 10);
    const h = Math.max(Math.abs(point.y - this.startPoint.y), 10);

    let path = '';
    const r = 12; // corner radius

    if (this.shapeKind === 'rect') {
      path = `M ${x1 + r} ${y1} L ${x1 + w - r} ${y1} Q ${x1 + w} ${y1} ${x1 + w} ${y1 + r} L ${x1 + w} ${y1 + h - r} Q ${x1 + w} ${y1 + h} ${x1 + w - r} ${y1 + h} L ${x1 + r} ${y1 + h} Q ${x1} ${y1 + h} ${x1} ${y1 + h - r} L ${x1} ${y1 + r} Q ${x1} ${y1} ${x1 + r} ${y1} Z`;
    } else if (this.shapeKind === 'ellipse') {
      const rx = w / 2;
      const ry = h / 2;
      const cx = x1 + rx;
      const cy = y1 + ry;
      path = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    } else {
      // Polygon / diamond
      path = `M ${x1 + w / 2} ${y1} L ${x1 + w} ${y1 + h / 2} L ${x1 + w / 2} ${y1 + h} L ${x1} ${y1 + h / 2} Z`;
    }

    const shape: ShapeItem = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'shape',
      shapeType: this.shapeKind,
      closed: true,
      svgPath: path,
      fill: ctx.settings.fill,
      stroke: {
        color: ctx.settings.color,
        width: ctx.settings.size,
      },
    };

    ctx.onCommitItem(shape);
    this.startPoint = null;
  }

  onCancel(): void {
    this.startPoint = null;
  }
}
