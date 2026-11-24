import { CanvasItem, Layer, Point, ShapeItem } from '../../types/canvas';

export class HitTestEngine {
  /**
   * Approximate polygon vertices from an SVG path string.
   */
  static parsePathToPolygon(pathData: string, resolution: number = 8): Point[] {
    const points: Point[] = [];
    const commandRegex = /([MLCQZmlcqz])([^MLCQZmlcqz]*)/g;
    let match;
    let currentX = 0;
    let currentY = 0;

    while ((match = commandRegex.exec(pathData)) !== null) {
      const command = match[1];
      const args = match[2]
        .trim()
        .split(/[\s,]+/)
        .map(Number)
        .filter((n) => !isNaN(n));

      switch (command) {
        case 'M':
        case 'm':
          if (args.length >= 2) {
            currentX = command === 'M' ? args[0] : currentX + args[0];
            currentY = command === 'M' ? args[1] : currentY + args[1];
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'L':
        case 'l':
          if (args.length >= 2) {
            currentX = command === 'L' ? args[0] : currentX + args[0];
            currentY = command === 'L' ? args[1] : currentY + args[1];
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'Q':
        case 'q':
          if (args.length >= 4) {
            const cx = command === 'Q' ? args[0] : currentX + args[0];
            const cy = command === 'Q' ? args[1] : currentY + args[1];
            const endX = command === 'Q' ? args[2] : currentX + args[2];
            const endY = command === 'Q' ? args[3] : currentY + args[3];

            // Sample quadratic curve
            for (let t = 1; t <= resolution; t++) {
              const u = t / resolution;
              const inv = 1 - u;
              const x = inv * inv * currentX + 2 * inv * u * cx + u * u * endX;
              const y = inv * inv * currentY + 2 * inv * u * cy + u * u * endY;
              points.push({ x, y });
            }
            currentX = endX;
            currentY = endY;
          }
          break;
        case 'C':
        case 'c':
          if (args.length >= 6) {
            const endX = command === 'C' ? args[4] : currentX + args[4];
            const endY = command === 'C' ? args[5] : currentY + args[5];
            points.push({ x: endX, y: endY });
            currentX = endX;
            currentY = endY;
          }
          break;
        case 'Z':
        case 'z':
          if (points.length > 0) {
            points.push({ x: points[0].x, y: points[0].y });
          }
          break;
      }
    }

    return points;
  }

  /**
   * Ray casting algorithm to check if point (px, py) is inside polygon.
   */
  static isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Check if a point hits a ShapeItem.
   */
  static hitTestShape(point: Point, shape: ShapeItem): boolean {
    const polygon = this.parsePathToPolygon(shape.svgPath);
    return this.isPointInPolygon(point, polygon);
  }

  /**
   * Find the top-most shape under point across unlocked visible layers.
   */
  static findShapeAtPoint(
    point: Point,
    layers: Layer[]
  ): { shape: ShapeItem; layerId: string } | null {
    // Iterate from top layer down
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.locked) continue;

      // Iterate from top item down
      for (let j = layer.items.length - 1; j >= 0; j--) {
        const item = layer.items[j];
        if (item.type === 'shape' && item.closed) {
          if (this.hitTestShape(point, item)) {
            return { shape: item, layerId: layer.id };
          }
        }
      }
    }

    return null;
  }
}
