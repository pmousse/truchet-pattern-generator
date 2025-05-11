export interface SavedDesign {
  id?: number;
  name: string;
  createdAt: Date;
  gridSize: {
    rows: number;
    cols: number;
  };
  tileSize: number;
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  pattern: 'curve' | 'triangle';
  tiles: {
    rotation: number;
    pattern: 'curve' | 'triangle';
  }[][];
}
