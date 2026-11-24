import { Point, ToolType } from '../../types/canvas';

export interface StrokeBuildOptions {
  tool: ToolType;
  baseWidth: number;
  stabilizer: number; // 0 to 100
  isStylus?: boolean;
}

export class StrokeBuilder {
  /**
   * Filter out duplicate or excessively dense points.
   * Requirement: "Limit point density: drop points closer than 1.5px."
   */
  static filterPoints(points: Point[], minDistance: number = 1.5): Point[] {
    if (points.length <= 1) return points;
    const filtered: Point[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const prev = filtered[filtered.length - 1];
      const curr = points[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= minDistance) {
        filtered.push(curr);
      }
    }

    return filtered;
  }

  /**
   * Stabilize points using weighted moving average (0 to 100).
   */
  static stabilizePoints(points: Point[], strength: number): Point[] {
    if (points.length <= 2 || strength <= 0) return points;

    const factor = Math.min(Math.max(strength / 100, 0), 0.85);
    const result: Point[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const prev = result[i - 1];
      const curr = points[i];

      const smoothX = prev.x * factor + curr.x * (1 - factor);
      const smoothY = prev.y * factor + curr.y * (1 - factor);

      result.push({
        ...curr,
        x: smoothX,
        y: smoothY,
      });
    }

    return result;
  }

  /**
   * Calculate stroke width based on pressure or velocity.
   */
  static calculateWidth(
    p1: Point,
    p2: Point,
    tool: ToolType,
    baseWidth: number,
    isStylus: boolean = false
  ): number {
    if (tool === 'fineliner') {
      return baseWidth; // Constant width, crisp edge
    }

    if (tool === 'marker') {
      return baseWidth * 1.8; // Broad flat marker line
    }

    if (isStylus && p2.pressure !== undefined && p2.pressure > 0) {
      // Direct stylus pressure mapping
      return baseWidth * (0.3 + p2.pressure * 1.4);
    }

    // Velocity-based fallback for finger input
    if (p1.time && p2.time && p2.time > p1.time) {
      const dt = (p2.time - p1.time) / 1000;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const velocity = dist / dt; // px/sec

      // Faster speed = thinner line (pen/brush feel)
      const velocityFactor = Math.max(0.4, 1.4 - Math.min(velocity / 1200, 0.9));
      return baseWidth * velocityFactor;
    }

    return baseWidth;
  }

  /**
   * Generate smooth SVG path string via quadratic midpoint smoothing.
   */
  static buildPath(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} l 0.1 0.1`;
    }

    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    if (points.length === 2) {
      d += ` L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
      return d;
    }

    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midX = ((p1.x + p2.x) / 2).toFixed(1);
      const midY = ((p1.y + p2.y) / 2).toFixed(1);
      d += ` Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}, ${midX} ${midY}`;
    }

    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

    return d;
  }

  /**
   * High-level entry point to process a raw stream of points into a polished stroke.
   */
  static processRawPoints(
    rawPoints: Point[],
    options: StrokeBuildOptions
  ): { points: Point[]; svgPath: string; computedWidth: number } {
    const filtered = this.filterPoints(rawPoints, 1.5);
    const stabilized = this.stabilizePoints(filtered, options.stabilizer);
    const svgPath = this.buildPath(stabilized);

    // Compute average width
    let totalWidth = options.baseWidth;
    if (stabilized.length >= 2) {
      const sampleP1 = stabilized[Math.floor(stabilized.length / 3)];
      const sampleP2 = stabilized[Math.floor((stabilized.length * 2) / 3)];
      totalWidth = this.calculateWidth(
        sampleP1,
        sampleP2,
        options.tool,
        options.baseWidth,
        options.isStylus
      );
    }

    return {
      points: stabilized,
      svgPath,
      computedWidth: totalWidth,
    };
  }
}
