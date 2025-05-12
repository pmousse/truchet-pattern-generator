import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TileComponent } from '../tile/tile.component';
import { TruchetService, TruchetTile } from '../services/truchet.service';
import { Router } from '@angular/router';
import { SavedDesign } from '../models/saved-design';
import { SaveDesignModalComponent } from './save-design-modal.component';
import { SuccessModalComponent } from './success-modal.component';
import { GeneratorStateService } from '../services/generator-state.service';
import { DesignStorageService } from '../services/design-storage.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-truchet-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbTooltipModule,
    TileComponent
  ],
  templateUrl: './truchet-grid.component.html',
  styleUrls: ['./truchet-grid.component.scss']
})
export class TruchetGridComponent implements OnInit {
  @ViewChild('gridContainer') gridContainer!: ElementRef;
  cols = 8;
  rows = 8;
  currentDesignId?: number;  // Track the current design's ID
  tileSize = 100;  strokeColor = '#ffffff';
  backgroundColor = '#000000';  strokeWidth = 10;
  noiseScale = 0.2;
  noiseFrequency = 1.0;
  noiseOffset = { x: Math.random() * 1000, y: Math.random() * 1000 };
  tiles$;
  pattern$;
  isAutoRandomizing = false;
  private randomizeInterval: any;  constructor(
    private truchetService: TruchetService,
    private router: Router,
    private modalService: NgbModal,
    private generatorState: GeneratorStateService,
    private designStorage: DesignStorageService
  ) {
    // Check if we're explicitly navigating with a design from gallery
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
    
    if (navigation && state && 'design' in state && state['design']) {
      this.design = state['design'] as SavedDesign;
    }
    
    this.tiles$ = this.truchetService.getTiles();
    this.pattern$ = this.truchetService.getPattern();
  }

  private design?: SavedDesign;    private isFirstInit = true;
  async ngOnInit() {
    if (this.design) {
      // Load design if explicitly navigated from gallery
      this.loadSavedDesign(this.design);
      this.design = undefined; // Clear design after loading
    } else {
      // Restore state from generator state service
      if (!await this.restoreGridState() && this.isFirstInit) {
        // Only reset to defaults on first initialization if no state exists
        this.resetToDefaults();
        this.isFirstInit = false;
      }
    }
  }
  private async loadSavedDesign(design: SavedDesign) {
    // Reset to defaults without updating grid
    await this.resetToDefaults(false);

    // Load design properties
    this.currentDesignId = design.id;
    this.cols = design.gridSize.cols;
    this.rows = design.gridSize.rows;
    this.strokeColor = design.primaryColor;
    this.backgroundColor = design.secondaryColor;
    this.strokeWidth = design.strokeWidth;
    this.tileSize = design.tileSize;
    this.noiseScale = design.noiseScale;
    this.noiseFrequency = design.noiseFrequency;

    // Update visual styles first
    this.updateStyle();

    // Set the pattern type
    this.truchetService.setPattern(design.pattern as 'curve' | 'triangle');

    // Create grid with saved rotations
    const gridRows = [];
    let rotationIndex = 0;
    
    for (let i = 0; i < this.rows; i++) {
      const row = [];
      for (let j = 0; j < this.cols; j++) {
        row.push({
          rotation: design.tileRotations[rotationIndex++],
          id: `tile-${i}-${j}`,
          pattern: design.pattern as 'curve' | 'triangle'
        });
      }
      gridRows.push(row);
    }
    
    // Update grid with saved rotations
    this.truchetService['tiles'].next(gridRows);

    // Save complete state
    await this.saveGridState();
  }  private async resetToDefaults(updateGrid: boolean = true) {
    // Get default values from service
    const defaults = this.truchetService.getDefaultValues();

    // Clear current design ID
    this.currentDesignId = undefined;

    // Reset component properties
    this.cols = defaults.gridSize.cols;
    this.rows = defaults.gridSize.rows;
    this.tileSize = defaults.tileSize;
    this.strokeColor = defaults.primaryColor;
    this.backgroundColor = defaults.secondaryColor;
    this.strokeWidth = defaults.strokeWidth;
    this.noiseScale = defaults.noiseScale;
    this.noiseFrequency = defaults.noiseFrequency;
    this.noiseOffset = { x: Math.random() * 1000, y: Math.random() * 1000 };

    // Reset services with new values
    this.truchetService.resetToDefaults(false);  // false to match reset grid behavior
    this.generatorState.resetState();

    // Update visual styles
    this.updateStyle();
    
    // Only update grid if requested
    if (updateGrid) {
      await this.updateGridSize();
    }
  }

  ngOnDestroy() {
    this.stopAutoRandomize();
  }

  toggleAutoRandomize() {
    this.isAutoRandomizing = !this.isAutoRandomizing;
    if (this.isAutoRandomizing) {
      this.startAutoRandomize();
    } else {
      this.stopAutoRandomize();
    }
  }
  private startAutoRandomize() {
    this.randomizeInterval = setInterval(() => {
      this.randomizeRotations();
    }, 5000);
  }

  private stopAutoRandomize() {
    if (this.randomizeInterval) {
      clearInterval(this.randomizeInterval);
      this.randomizeInterval = null;
    }
  }  async updateGridSize(applyNoise: boolean = false) {
    // Temporarily store the current noise state
    const currentNoiseState = this.truchetService.getNoiseEnabled();
    
    // Disable noise during grid size update
    if (!applyNoise) {
      this.truchetService.setNoiseEnabled(false);
    }
    
    this.truchetService.setGridSize(this.rows, this.cols);

    // Get current tile rotations and save full state
    const currentGrid = await firstValueFrom(this.truchetService.getTiles());
    const tileRotations = currentGrid.flat().map(tile => tile.rotation);
    const pattern = await firstValueFrom(this.truchetService.getPattern());

    // Save complete state including pattern and rotations
    this.generatorState.saveState({
      rows: this.rows,
      cols: this.cols,
      tileSize: this.tileSize,
      strokeColor: this.strokeColor,
      backgroundColor: this.backgroundColor,
      strokeWidth: this.strokeWidth,
      noiseScale: this.noiseScale,
      noiseFrequency: this.noiseFrequency,
      pattern,
      tileRotations
    });
    
    // Restore previous noise state
    this.truchetService.setNoiseEnabled(currentNoiseState);
  }
  async onTileRotate(row: number, col: number) {
    this.truchetService.rotateTile(row, col);
    await this.saveGridState();
  }async resetGrid() {
    // Stop auto-randomize if it's running
    if (this.isAutoRandomizing) {
      this.toggleAutoRandomize();
    }

    // Just use resetToDefaults with full grid update
    await this.resetToDefaults(true);
  }
  async randomizeRotations() {
    this.truchetService.randomizeRotations();
    await this.saveGridState();
  }applyNoisePattern() {
    // Enable noise and update parameters
    this.truchetService.setNoiseEnabled(true);
    this.truchetService.setNoiseScale(this.noiseScale);
    this.truchetService.setNoiseFrequency(this.noiseFrequency);
    
    // Save state with updated noise parameters
    this.generatorState.saveState({
      noiseScale: this.noiseScale,
      noiseFrequency: this.noiseFrequency
    });

    // Force a regeneration of the noise pattern
    this.truchetService.regenerateNoise();
  }
  regenerateNoise() {
    // Enable noise and regenerate pattern
    this.truchetService.setNoiseEnabled(true);
    this.truchetService.regenerateNoise();
  }
  updateStyle() {
    document.documentElement.style.setProperty('--truchet-stroke-color', this.strokeColor);
    document.documentElement.style.setProperty('--truchet-stroke-width', `${this.strokeWidth}px`);
    document.documentElement.style.setProperty('--truchet-background-color', this.backgroundColor);

    if (this.gridContainer) {
      const container = this.gridContainer.nativeElement;
      container.style.gridTemplateColumns = `repeat(${this.cols}, ${this.tileSize}px)`;
    }

    // Save the current style state
    this.generatorState.saveState({
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      backgroundColor: this.backgroundColor,
      tileSize: this.tileSize
    });
  }
  async setPattern(pattern: 'curve' | 'triangle') {
    this.truchetService.setPattern(pattern);
    await this.saveGridState();
  }
  async saveAsImage() {
    // Use tile size to determine dimensions
    const totalWidth = this.cols * this.tileSize;
    const totalHeight = this.rows * this.tileSize;

    const imageData = await this.generateSVGImage(totalWidth, totalHeight, true);
    
    if (imageData) {
      const link = document.createElement('a');
      link.download = 'truchet-pattern.png';
      link.href = imageData;
      link.click();
    }
  }

  async saveAsSVG() {
    // Use tile size to determine dimensions
    const totalWidth = this.cols * this.tileSize;
    const totalHeight = this.rows * this.tileSize;

    const svgData = await this.generateSVGImage(totalWidth, totalHeight, false);
    
    if (svgData) {
      const link = document.createElement('a');
      link.download = 'truchet-pattern.svg';
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }
  private async generateSVGImage(width: number, height: number, toPNG: boolean = false): Promise<string> {    
    // Use the original dimensions without scaling
    const totalWidth = width;
    const totalHeight = height;
    
    // Calculate stroke width relative to the original tile size
    const scaledStrokeWidth = (this.strokeWidth / 100) * (width / this.cols);
    
    // Create SVG that will contain all tiles with proper namespace declarations
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    exportSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    exportSvg.setAttribute('version', '1.1');
    exportSvg.setAttribute('width', totalWidth.toString());
    exportSvg.setAttribute('height', totalHeight.toString());
    exportSvg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    exportSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Add background rectangle
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', totalWidth.toString());
    background.setAttribute('height', totalHeight.toString());
    background.setAttribute('fill', this.backgroundColor);
    exportSvg.appendChild(background);

    // Use actual tile size for rendering
    const tileSize = width / this.cols;

    // Create container groups for curves and triangles with common attributes
    const curves = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    curves.setAttribute('fill', 'none');
    curves.setAttribute('stroke', this.strokeColor);
    curves.setAttribute('stroke-width', scaledStrokeWidth.toString());
    curves.setAttribute('stroke-linecap', 'butt');
    curves.setAttribute('stroke-linejoin', 'round');

    const triangles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    triangles.setAttribute('fill', this.strokeColor);
    triangles.setAttribute('stroke', 'none');

    // Subscribe to tiles to get current state
    const currentTiles: TruchetTile[] = [];
    this.tiles$.subscribe(tiles => {
      tiles.forEach(row => row.forEach(tile => currentTiles.push(tile)));
    }).unsubscribe();

    // Process each tile
    currentTiles.forEach((tileData, index) => {
      const row = Math.floor(index / this.cols);
      const col = index % this.cols;
      const x = col * tileSize;
      const y = row * tileSize;

      // Create group for this tile with position and rotation
      const tileGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tileGroup.setAttribute('transform', 
        `translate(${x},${y}) rotate(${tileData.rotation},${tileSize/2},${tileSize/2})`
      );

      if (tileData.pattern === 'curve') {
        // Create curves using simple coordinates relative to tile
        [
          `M 0 ${tileSize/2} A ${tileSize/2} ${tileSize/2} 0 0 0 ${tileSize/2} 0`,
          `M ${tileSize/2} ${tileSize} A ${tileSize/2} ${tileSize/2} 0 0 1 ${tileSize} ${tileSize/2}`
        ].forEach(pathData => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', pathData);
          tileGroup.appendChild(path);
        });
        curves.appendChild(tileGroup);
      } else {
        // Create triangle using simple coordinates relative to tile
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M 0 0 L ${tileSize} 0 L 0 ${tileSize} Z`);
        tileGroup.appendChild(path);
        triangles.appendChild(tileGroup);
      }
    });

    // Add the curve and triangle groups to the SVG
    exportSvg.appendChild(curves);
    exportSvg.appendChild(triangles);

    if (!toPNG) {
      // For SVG output, return the SVG string with XML declaration
      return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + 
             new XMLSerializer().serializeToString(exportSvg);
    }

    // For PNG output, convert to canvas
    const svgString = new XMLSerializer().serializeToString(exportSvg);
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    try {
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      
      // Draw on canvas with the exact dimensions
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, totalWidth, totalHeight);
        return canvas.toDataURL('image/png');
      }
    } finally {
      URL.revokeObjectURL(url);
    }
    
    return '';
  }
  private async generateThumbnail(): Promise<string> {
    // Use a smaller tile size for thumbnails
    const thumbnailTileSize = 25; // This will give us 200px for an 8x8 grid
    const totalWidth = this.cols * thumbnailTileSize;
    const totalHeight = this.rows * thumbnailTileSize;

    // Always generate as PNG for thumbnails
    return this.generateSVGImage(totalWidth, totalHeight, true);
  }  async saveDesign() {
    // Get the current tile grid
    const currentGrid = await firstValueFrom(this.truchetService.getTiles());
    if (!currentGrid || !currentGrid.length) return;

    const tileRotations = currentGrid.flat().map((tile: TruchetTile) => tile.rotation);

    // Get thumbnail image
    const thumbnail = await this.generateThumbnail();

    // If we have a current design ID, ask if user wants to update or create new
    if (this.currentDesignId !== undefined) {
      const modalRef = this.modalService.open(SaveDesignModalComponent, { centered: true });
      try {
        const result = await modalRef.result;
        if (result === 'update') {
          // Keep the current ID for updating
          // No need to change anything
        } else if (result === 'new') {
          // Clear the ID to create a new design
          this.currentDesignId = undefined;
        } else {
          // Modal was dismissed/canceled
          return;
        }
      } catch (err) {
        // Modal was dismissed/canceled
        return;
      }
    }

    // Create design object
    const design: SavedDesign = {
      id: this.currentDesignId, // Use the current ID directly - will be undefined for new designs
      name: new Date().toLocaleString(),
      gridSize: {
        rows: this.rows,
        cols: this.cols
      },
      pattern: await firstValueFrom(this.truchetService.getPattern()),
      tileRotations,
      primaryColor: this.strokeColor,
      secondaryColor: this.backgroundColor,
      strokeWidth: this.strokeWidth,
      tileSize: this.tileSize,
      noiseScale: this.noiseScale,
      noiseFrequency: this.noiseFrequency,
      noiseOffset: { x: this.noiseOffset.x, y: this.noiseOffset.y },
      thumbnail
    };

    // Save to storage using the service
    const savedDesign = this.designStorage.saveDesign(design);
    
    // Update current design ID
    this.currentDesignId = savedDesign.id;

    // Show success message
    const modalRef = this.modalService.open(SuccessModalComponent, { centered: true });
    modalRef.componentInstance.message = 'Design saved successfully!';
    await new Promise(resolve => setTimeout(resolve, 1500));
    modalRef.close();
  }

  // Save current grid state to the generator state service
  private async saveGridState() {
    const currentGrid = await firstValueFrom(this.truchetService.getTiles());
    if (!currentGrid || !currentGrid.length) return;

    const tileRotations = currentGrid.flat().map(tile => tile.rotation);
    const pattern = await firstValueFrom(this.truchetService.getPattern());

    this.generatorState.saveState({
      rows: this.rows,
      cols: this.cols,
      tileSize: this.tileSize,
      strokeColor: this.strokeColor,
      backgroundColor: this.backgroundColor,
      strokeWidth: this.strokeWidth,
      noiseScale: this.noiseScale,
      noiseFrequency: this.noiseFrequency,
      pattern,
      tileRotations
    });
  }

  // Restore grid state with rotations from the generator state service
  private async restoreGridState() {
    const state = this.generatorState.getState();
    if (!state) return false;

    // Restore basic values
    this.rows = state.rows ?? this.rows;
    this.cols = state.cols ?? this.cols;
    this.tileSize = state.tileSize ?? this.tileSize;
    this.strokeColor = state.strokeColor ?? this.strokeColor;
    this.backgroundColor = state.backgroundColor ?? this.backgroundColor;
    this.strokeWidth = state.strokeWidth ?? this.strokeWidth;
    this.noiseScale = state.noiseScale ?? this.noiseScale;
    this.noiseFrequency = state.noiseFrequency ?? this.noiseFrequency;

    // Update pattern first if it exists
    if (state.pattern) {
      this.truchetService.setPattern(state.pattern);
    }

    // Update visual style
    this.updateStyle();

    // Restore tile rotations if they exist
    if (state.tileRotations && state.tileRotations.length === this.rows * this.cols) {
      const currentPattern = await firstValueFrom(this.truchetService.getPattern());
      const gridRows = [];
      let rotationIndex = 0;
      
      for (let i = 0; i < this.rows; i++) {
        const row = [];
        for (let j = 0; j < this.cols; j++) {
          row.push({
            rotation: state.tileRotations[rotationIndex++],
            id: `tile-${i}-${j}`,
            pattern: currentPattern
          });
        }
        gridRows.push(row);
      }
      
      // Update the grid with saved rotations
      this.truchetService['tiles'].next(gridRows);
    } else {
      // If no rotations or wrong size, just update grid size
      this.updateGridSize();
    }

    return true;
  }
}
