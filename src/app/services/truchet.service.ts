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
  // Default values
  private readonly DEFAULT_GRID_SIZE = { rows: 8, cols: 8 };
  private readonly DEFAULT_PATTERN = 'curve' as const;
  private readonly DEFAULT_NOISE_SCALE = 0.2;
  private readonly DEFAULT_NOISE_INTENSITY = 1.0;
  private readonly DEFAULT_NOISE_FREQUENCY = 1.0;

  private gridSize = new BehaviorSubject<{ rows: number; cols: number }>(this.DEFAULT_GRID_SIZE);
  private tiles = new BehaviorSubject<TruchetTile[][]>([]);
  private pattern = new BehaviorSubject<'curve' | 'triangle'>(this.DEFAULT_PATTERN);
  private noiseScale = new BehaviorSubject<number>(this.DEFAULT_NOISE_SCALE);
  private noiseIntensity = new BehaviorSubject<number>(this.DEFAULT_NOISE_INTENSITY);
  private noiseFrequency = new BehaviorSubject<number>(this.DEFAULT_NOISE_FREQUENCY);
  private noiseOffset = { x: Math.random() * 1000, y: Math.random() * 1000 };
  private noise2D = createNoise2D();
  private shouldApplyNoise = true;

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
    // Only initialize with rotations if we're not loading a saved design
    if (this.shouldApplyNoise) {
      this.gridSize.next({ rows, cols });
      this.initializeGrid({ rows, cols });
      this.applyNoisePattern();
    } else {
      this.gridSize.next({ rows, cols });
    }
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
    if (!this.shouldApplyNoise) return;

    const currentGrid = this.tiles.value;
    const scale = this.noiseScale.value;
    const frequency = this.noiseFrequency.value;
    
    const newGrid = currentGrid.map((row, i) =>
      row.map((tile, j) => {
        const noiseValue = this.noise2D(
          (i * frequency + this.noiseOffset.x) * scale,
          (j * frequency + this.noiseOffset.y) * scale
        );
        
        // Map noise value (-1 to 1) to rotation (0, 90, 180, 270)
        const rotation = Math.floor((noiseValue + 1) * 2) * 90;
        
        return {
          ...tile,
          rotation
        };
      })
    );
    
    this.tiles.next(newGrid);
  }

  regenerateNoise(): void {
    this.noiseOffset = {
      x: Math.random() * 1000,
      y: Math.random() * 1000
    };
    this.applyNoisePattern();
  }

  getNoiseOffset(): { x: number; y: number } {
    return this.noiseOffset;
  }

  getCurrentPattern(): 'curve' | 'triangle' {
    return this.pattern.value;
  }

  loadSavedDesign(design: any) {
    // Temporarily disable noise application
    this.shouldApplyNoise = false;

    try {
      // Store noise settings but don't apply them
      this.noiseScale.next(design.noiseScale);
      this.noiseFrequency.next(design.noiseFrequency);
      this.noiseOffset = design.noiseOffset;
      
      // Set pattern
      this.pattern.next(design.pattern as 'curve' | 'triangle');
        // Set grid size
      this.gridSize.next({ 
        rows: design.gridSize.rows, 
        cols: design.gridSize.cols 
      });      // Create grid with exactly the saved rotations
      const newGrid: TruchetTile[][] = [];
      let rotationIndex = 0;
      
      for (let i = 0; i < design.gridSize.rows; i++) {
        const row: TruchetTile[] = [];
        for (let j = 0; j < design.gridSize.cols; j++) {
          row.push({
            rotation: design.tileRotations[rotationIndex++],
            id: `tile-${i}-${j}`,
            pattern: design.pattern as 'curve' | 'triangle'
          });
        }
        newGrid.push(row);
      }

      // Update the grid with exact saved rotations
      this.tiles.next(newGrid);
    } finally {
      // Re-enable noise application for future updates
      this.shouldApplyNoise = true;
    }
  }

  resetToDefaults() {
    // Reset all parameters to defaults
    this.pattern.next(this.DEFAULT_PATTERN);
    this.gridSize.next(this.DEFAULT_GRID_SIZE);
    this.noiseScale.next(this.DEFAULT_NOISE_SCALE);
    this.noiseIntensity.next(this.DEFAULT_NOISE_INTENSITY);
    this.noiseFrequency.next(this.DEFAULT_NOISE_FREQUENCY);
    this.noiseOffset = { x: Math.random() * 1000, y: Math.random() * 1000 };
    
    // Reinitialize the grid
    this.initializeGrid(this.DEFAULT_GRID_SIZE);
  }

  // Add getters for default values
  getDefaultValues() {
    return {
      gridSize: this.DEFAULT_GRID_SIZE,
      pattern: this.DEFAULT_PATTERN,
      noiseScale: this.DEFAULT_NOISE_SCALE,
      noiseFrequency: this.DEFAULT_NOISE_FREQUENCY,
      noiseIntensity: this.DEFAULT_NOISE_INTENSITY,
      strokeWidth: 8,
      tileSize: 100,
      primaryColor: '#ffffff',
      secondaryColor: '#000000'
    };
  }
}
