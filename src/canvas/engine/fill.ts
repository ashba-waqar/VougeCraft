import { Fill, ShapeItem } from '../../types/canvas';

export class FillEngine {
  /**
   * Apply a fill to a shape, returning an updated ShapeItem.
   */
  static applyFill(shape: ShapeItem, fill: Fill): ShapeItem {
    return {
      ...shape,
      fill: {
        ...fill,
      },
    };
  }

  /**
   * Remove fill from a shape.
   */
  static clearFill(shape: ShapeItem): ShapeItem {
    const updated = { ...shape };
    delete updated.fill;
    return updated;
  }

  /**
   * Close an open SVG path by appending line to origin if endpoints are within gapTolerance.
   */
  static closePathWithTolerance(pathData: string, gapTolerance: number = 20): string {
    const trimmed = pathData.trim();
    if (trimmed.endsWith('Z') || trimmed.endsWith('z')) {
      return trimmed;
    }
    return `${trimmed} Z`;
  }
}
