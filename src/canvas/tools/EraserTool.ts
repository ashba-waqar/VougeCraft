import { ITool, ToolContext } from './Tool';
import { Point } from '../../types/canvas';
import { useCanvasStore } from '../../store/canvasStore';

export class EraserTool implements ITool {
  type = 'eraser' as const;
  name = 'Eraser';

  onPointerDown(point: Point, ctx: ToolContext): void {
    useCanvasStore.getState().eraseNearPoint(point, ctx.settings.size * 2.5);
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    useCanvasStore.getState().eraseNearPoint(point, ctx.settings.size * 2.5);
  }

  onPointerUp(point: Point, ctx: ToolContext): void {
    useCanvasStore.getState().eraseNearPoint(point, ctx.settings.size * 2.5);
  }

  onCancel(): void {}
}
