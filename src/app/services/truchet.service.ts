import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createNoise2D } from 'simplex-noise';

export interface TruchetTile {
  rotation: number; // 0, 90, 180, or 270 degrees
  id: string;
  pattern: 'curve' | 'triangle'; // The type of pattern to display
}

@Injectable({
  providedIn: 'root'
})
export class TruchetService {
  private gridSize = new BehaviorSubject<{ rows: number; cols: number }>({ rows: 8, cols: 8 });
  private tiles = new BehaviorSubject<TruchetTile[][]>([]);
  private pattern = new BehaviorSubject<'curve' | 'triangle'>('curve');
  private noiseScale = new BehaviorSubject<number>(0.2);
  private noiseIntensity = new BehaviorSubject<number>(1.0);
  private noiseFrequency = new BehaviorSubject<number>(1.0);
  private noiseOffset = { x: Math.random() * 1000, y: Math.random() * 1000 };
  private noise2D = createNoise2D();

  constructor() {
    this.initializeGrid(this.gridSize.value);
  }

  private initializeGrid(size: { rows: number; cols: number }) {
    const newGrid: TruchetTile[][] = [];
    const currentPattern = this.pattern.value;
    
    for (let i = 0; i < size.rows; i++) {
      const row: TruchetTile[] = [];
      for (let j = 0; j < size.cols; j++) {
        row.push({
          rotation: 0,
          id: `tile-${i}-${j}`,
          pattern: currentPattern
        });
      }
      newGrid.push(row);
    }
    this.tiles.next(newGrid);
  }

  getTiles(): Observable<TruchetTile[][]> {
    return this.tiles.asObservable();
  }

  getPattern(): Observable<'curve' | 'triangle'> {
    return this.pattern.asObservable();
  }

  setPattern(pattern: 'curve' | 'triangle') {
    const currentGrid = this.tiles.value;
    const newGrid = currentGrid.map(row => 
      row.map(tile => ({
        ...tile,
        pattern: pattern
      }))
    );
    this.pattern.next(pattern);
    this.tiles.next(newGrid);
  }

  getGridSize(): Observable<{ rows: number; cols: number }> {
    return this.gridSize.asObservable();
  }

  getNoiseScale(): Observable<number> {
    return this.noiseScale.asObservable();
  }

  getNoiseFrequency(): Observable<number> {
    return this.noiseFrequency.asObservable();
  }

  setNoiseScale(scale: number): void {
    this.noiseScale.next(scale);
    this.applyNoisePattern();
  }

  setNoiseIntensity(intensity: number): void {
    this.noiseIntensity.next(intensity);
    this.applyNoisePattern();
  }

  setNoiseFrequency(frequency: number): void {
    this.noiseFrequency.next(frequency);
    this.applyNoisePattern();
  }

  setGridSize(rows: number, cols: number): void {
    this.gridSize.next({ rows, cols });
    this.initializeGrid({ rows, cols });
  }

  rotateTile(row: number, col: number): void {
    const currentGrid = this.tiles.value;
    const currentRotation = currentGrid[row][col].rotation;
    const newRotation = (currentRotation + 90) % 360;
    
    const newGrid = currentGrid.map((r, i) =>
      r.map((tile, j) =>
        i === row && j === col
          ? { ...tile, rotation: newRotation }
          : tile
      )
    );
    
    this.tiles.next(newGrid);
  }

  resetGrid(): void {
    const size = this.gridSize.value;
    this.initializeGrid(size);
  }

  randomizeRotations(): void {
    const currentGrid = this.tiles.value;
    for (let i = 0; i < currentGrid.length; i++) {
      for (let j = 0; j < currentGrid[i].length; j++) {
        currentGrid[i][j].rotation = Math.floor(Math.random() * 4) * 90;
      }
    }
    this.tiles.next([...currentGrid]);
  }

  applyNoisePattern(): void {
    const currentGrid = this.tiles.value;
    const scale = this.noiseScale.value;
    const intensity = this.noiseIntensity.value;
    const frequency = this.noiseFrequency.value;
    
    for (let i = 0; i < currentGrid.length; i++) {
      for (let j = 0; j < currentGrid[i].length; j++) {
        // Get noise value for this position
        const noiseValue = this.noise2D(
          (j + this.noiseOffset.x) * scale * frequency,
          (i + this.noiseOffset.y) * scale * frequency
        );
        
        // Map noise value (-1 to 1) to rotation (0, 90, 180, 270)
        const normalizedNoise = (noiseValue + 1) / 2; // 0 to 1
        const randomRotation = Math.floor(normalizedNoise * 4) * 90;
        const alignedRotation = Math.floor(normalizedNoise * 2) * 180; // Only 0 or 180
        const rotation = Math.round(alignedRotation + (randomRotation - alignedRotation) * intensity);
        
        currentGrid[i][j].rotation = rotation % 360;
      }
    }
    
    this.tiles.next([...currentGrid]);
  }

  regenerateNoise(): void {
    this.noiseOffset = {
      x: Math.random() * 1000,
      y: Math.random() * 1000
    };
    this.applyNoisePattern();
  }
}
