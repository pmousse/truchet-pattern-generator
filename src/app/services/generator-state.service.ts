import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeneratorStateService {  private state: {
    rows: number;
    cols: number;
    tileSize: number;
    strokeColor: string;
    backgroundColor: string;
    strokeWidth: number;
    noiseScale: number;
    noiseFrequency: number;
    pattern?: 'curve' | 'triangle';
    tileRotations?: number[];
  } = {
    rows: 8,
    cols: 8,
    tileSize: 100,
    strokeColor: '#ffffff',
    backgroundColor: '#000000',
    strokeWidth: 10,
    noiseScale: 0.2,
    noiseFrequency: 1.0
  };

  saveState(state: Partial<typeof this.state>) {
    this.state = { ...this.state, ...state };
  }

  getState() {
    return { ...this.state };
  }

  getGridSize() {
    return { rows: this.state.rows, cols: this.state.cols };
  }
  resetState() {
    this.state = {
      rows: 8,
      cols: 8,
      tileSize: 100,
      strokeColor: '#ffffff',
      backgroundColor: '#000000',
      strokeWidth: 10,
      noiseScale: 0.2,
      noiseFrequency: 1.0,
      pattern: 'curve',
      tileRotations: new Array(64).fill(0) // 8x8 grid with 0 rotation
    };
  }
}
