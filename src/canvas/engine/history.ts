import { Command, Sketch } from '../../types/canvas';

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private snapshots: Map<number, string> = new Map();
  private commandCount: number = 0;

  constructor() {}

  /**
   * Push a command and execute it.
   */
  push(command: Command, currentSketchSnapshot?: Sketch): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo on new action
    this.commandCount++;

    // Snapshot every 50 commands for fast restore
    if (this.commandCount % 50 === 0 && currentSketchSnapshot) {
      this.snapshots.set(
        this.commandCount,
        JSON.stringify(currentSketchSnapshot)
      );
    }
  }

  /**
   * Undo last command.
   */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;

    command.undo();
    this.redoStack.push(command);
    return true;
  }

  /**
   * Redo previously undone command.
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;

    command.execute();
    this.undoStack.push(command);
    return true;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.snapshots.clear();
    this.commandCount = 0;
  }
}
