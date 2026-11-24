import { ITool, ToolContext } from './Tool';
import { Point } from '../../types/canvas';

export class LassoTool implements ITool {
  type = 'lasso' as const;
  name = 'Lasso';
  private lassoPoints: Point[] = [];

  onPointerDown(point: Point, ctx: ToolContext): void {
    this.lassoPoints = [point];
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    this.lassoPoints.push(point);
  }

  onPointerUp(point: Point, ctx: ToolContext): void {
    if (this.lassoPoints.length < 3) return;
    // Lasso closed selection
    this.lassoPoints = [];
  }

  onCancel(): void {
    this.lassoPoints = [];
  }
}
