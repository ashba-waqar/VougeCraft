import { ITool, ToolContext } from './Tool';
import { Point, TextNoteItem } from '../../types/canvas';

export class TextNoteTool implements ITool {
  type = 'textNote' as const;
  name = 'Text note';

  onPointerDown(point: Point, ctx: ToolContext): void {
    const note: TextNoteItem = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'textNote',
      text: 'Silk satin drape',
      position: { x: point.x, y: point.y },
      size: 13,
      color: ctx.settings.color,
    };

    ctx.onCommitItem(note);
  }

  onPointerMove(point: Point, ctx: ToolContext): void {}
  onPointerUp(point: Point, ctx: ToolContext): void {}
}
