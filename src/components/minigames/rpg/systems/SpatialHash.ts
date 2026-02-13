// SpatialHash — Pure spatial partitioning for collision and viewport queries
// No React dependencies — fully testeable

export interface SpatialEntity {
  id: string;
  x: number;
  y: number;
  type: 'npc' | 'monster' | 'object';
}

export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, SpatialEntity[]>;
  private entityPositions: Map<string, string>; // entityId -> cellKey

  constructor(cellSize = 16) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.entityPositions = new Map();
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  insert(entity: SpatialEntity): void {
    const key = this.getKey(entity.x, entity.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(entity);
    this.entityPositions.set(entity.id, key);
  }

  remove(entityId: string): void {
    const key = this.entityPositions.get(entityId);
    if (!key) return;
    const cell = this.cells.get(key);
    if (cell) {
      const idx = cell.findIndex(e => e.id === entityId);
      if (idx >= 0) cell.splice(idx, 1);
      if (cell.length === 0) this.cells.delete(key);
    }
    this.entityPositions.delete(entityId);
  }

  /** Query a single tile position */
  queryPoint(x: number, y: number): SpatialEntity[] {
    const key = this.getKey(x, y);
    const cell = this.cells.get(key);
    if (!cell) return [];
    return cell.filter(e => e.x === x && e.y === y);
  }

  /** Query a rectangular region (in tile coordinates) */
  queryRect(x1: number, y1: number, x2: number, y2: number): SpatialEntity[] {
    const results: SpatialEntity[] = [];
    const cx1 = Math.floor(x1 / this.cellSize);
    const cy1 = Math.floor(y1 / this.cellSize);
    const cx2 = Math.floor(x2 / this.cellSize);
    const cy2 = Math.floor(y2 / this.cellSize);

    for (let cx = cx1; cx <= cx2; cx++) {
      for (let cy = cy1; cy <= cy2; cy++) {
        const cell = this.cells.get(`${cx},${cy}`);
        if (cell) {
          for (const entity of cell) {
            if (entity.x >= x1 && entity.x <= x2 && entity.y >= y1 && entity.y <= y2) {
              results.push(entity);
            }
          }
        }
      }
    }
    return results;
  }

  /** Check if any entity occupies this tile */
  hasEntityAt(x: number, y: number): boolean {
    return this.queryPoint(x, y).length > 0;
  }

  clear(): void {
    this.cells.clear();
    this.entityPositions.clear();
  }

  get size(): number {
    let count = 0;
    for (const cell of this.cells.values()) count += cell.length;
    return count;
  }
}
