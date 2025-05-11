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

@Component({
  selector: 'app-truchet-grid',
  standalone: true,  imports: [
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
  tiles$;
  pattern$;
  isAutoRandomizing = false;
  private randomizeInterval: any;  constructor(
    private truchetService: TruchetService,
    private router: Router,
    private modalService: NgbModal,
    private generatorState: GeneratorStateService
  ) {
    this.tiles$ = this.truchetService.getTiles();
    this.pattern$ = this.truchetService.getPattern();

    // Check for saved design in navigation state
    const navigation = this.router.getCurrentNavigation();
    const design = navigation?.extras?.state?.['design'] as SavedDesign;
    
    if (design) {
      // Store the current design ID
      this.currentDesignId = design.id;

      // Set component properties
      if (typeof design.gridSize === 'number') {
        // Handle old format where gridSize was a single number
        this.cols = design.gridSize;
        this.rows = design.gridSize;
      } else {
        // Handle new format with separate rows and columns
        this.cols = design.gridSize.cols;
        this.rows = design.gridSize.rows;
      }
      this.strokeColor = design.primaryColor;
      this.backgroundColor = design.secondaryColor;
      this.strokeWidth = design.strokeWidth;
      this.tileSize = design.tileSize;
      this.noiseScale = design.noiseScale;
      this.noiseFrequency = design.noiseFrequency;

      // Update styles immediately
      requestAnimationFrame(() => {
        this.updateStyle();
      });

      // Load design into service
      this.truchetService.loadSavedDesign(design);
    }
  }  ngOnInit() {
    // If there's no saved design in navigation state, load from generator state
    if (!this.router.getCurrentNavigation()?.extras?.state?.['design']) {
      const savedState = this.generatorState.getState();
      this.rows = savedState.rows;
      this.cols = savedState.cols;
      this.tileSize = savedState.tileSize;
      this.strokeColor = savedState.strokeColor;
      this.backgroundColor = savedState.backgroundColor;
      this.strokeWidth = savedState.strokeWidth;
      this.noiseScale = savedState.noiseScale;
      this.noiseFrequency = savedState.noiseFrequency;
    }
    this.updateGridSize();
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
  }
  updateGridSize() {
    this.truchetService.setGridSize(this.rows, this.cols);
    this.generatorState.saveState({ rows: this.rows, cols: this.cols });
  }

  onTileRotate(row: number, col: number) {
    this.truchetService.rotateTile(row, col);
  }  resetGrid() {
    // Get default values from service
    const defaults = this.truchetService.getDefaultValues();

    // Clear the current design ID so it's treated as new
    this.currentDesignId = undefined;
    
    // Reset the generator state service
    this.generatorState.resetState();

    // Reset all component properties
    this.cols = defaults.gridSize.cols;
    this.rows = defaults.gridSize.rows;
    this.tileSize = defaults.tileSize;
    this.strokeColor = defaults.primaryColor;
    this.backgroundColor = defaults.secondaryColor;
    this.strokeWidth = defaults.strokeWidth;
    this.noiseScale = defaults.noiseScale;
    this.noiseFrequency = defaults.noiseFrequency;

    // Reset service state
    this.truchetService.resetToDefaults();

    // Update CSS variables
    this.updateStyle();

    // Stop auto-randomize if it's running
    if (this.isAutoRandomizing) {
      this.toggleAutoRandomize();
    }
  }

  randomizeRotations() {
    this.truchetService.randomizeRotations();
  }  applyNoisePattern() {
    this.truchetService.setNoiseScale(this.noiseScale);
    this.truchetService.setNoiseFrequency(this.noiseFrequency);
    this.generatorState.saveState({
      noiseScale: this.noiseScale,
      noiseFrequency: this.noiseFrequency
    });
  }

  regenerateNoise() {
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

  setPattern(pattern: 'curve' | 'triangle') {
    this.truchetService.setPattern(pattern);
  }
  async saveAsImage() {
    // Calculate dimensions to maintain proper aspect ratio
    const baseSize = 800; // Base size for good resolution
    const aspectRatio = this.cols / this.rows;
    
    let width, height;
    if (aspectRatio > 1) {
      width = baseSize;
      height = baseSize / aspectRatio;
    } else {
      height = baseSize;
      width = baseSize * aspectRatio;
    }

    const imageData = await this.generateSVGImage(width, height, true);
    
    if (imageData) {
      const link = document.createElement('a');
      link.download = 'truchet-pattern.png';
      link.href = imageData;
      link.click();
    }
  }

  async saveAsSVG() {
    // Calculate dimensions to maintain proper aspect ratio
    const baseSize = 800; // Base size for good resolution
    const aspectRatio = this.cols / this.rows;
    
    let width, height;
    if (aspectRatio > 1) {
      width = baseSize;
      height = baseSize / aspectRatio;
    } else {
      height = baseSize;
      width = baseSize * aspectRatio;
    }

    const svgData = await this.generateSVGImage(width, height, false);
    
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
    // Calculate tile size to maintain proper proportions
    const tileSize = Math.min(width / this.cols, height / this.rows);
    const totalWidth = tileSize * this.cols;
    const totalHeight = tileSize * this.rows;
    
    // Calculate stroke width relative to tile size
    const scaledStrokeWidth = (this.strokeWidth / 100) * tileSize;
    
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
    
    // Subscribe to tiles to get current state
    const currentTiles: TruchetTile[] = [];
    this.tiles$.subscribe(tiles => {
      tiles.forEach(row => row.forEach(tile => currentTiles.push(tile)));
    }).unsubscribe();
    
    // Process each tile
    currentTiles.forEach((tileData, index) => {
      const row = Math.floor(index / this.cols);
      const col = index % this.cols;
      
      // Create group for this tile position
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${col * tileSize} ${row * tileSize})`);

      // Create rotation group
      const rotationGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      rotationGroup.setAttribute('transform', `rotate(${tileData.rotation} ${tileSize/2} ${tileSize/2})`);

      // Create paths based on the pattern
      if (tileData.pattern === 'curve') {
        [
          `M 0 ${tileSize/2} A ${tileSize/2} ${tileSize/2} 0 0 0 ${tileSize/2} 0`,
          `M ${tileSize/2} ${tileSize} A ${tileSize/2} ${tileSize/2} 0 0 1 ${tileSize} ${tileSize/2}`
        ].forEach(pathData => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', pathData);
          path.setAttribute('stroke', this.strokeColor);
          path.setAttribute('stroke-width', scaledStrokeWidth.toString());
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          rotationGroup.appendChild(path);
        });
      } else {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M 0 0 L ${tileSize} 0 L 0 ${tileSize} Z`);
        path.setAttribute('fill', this.strokeColor);
        path.setAttribute('stroke', 'none');
        rotationGroup.appendChild(path);
      }
      
      g.appendChild(rotationGroup);
      exportSvg.appendChild(g);
    });

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
      
      // Draw on canvas
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
    // Generate a smaller version for the thumbnail with improved resolution
    const maxDimension = 200; // Increased from 100 for better quality
    const aspectRatio = this.cols / this.rows; // Flipped to get the correct ratio
    
    let width: number;
    let height: number;

    if (aspectRatio > 1) {
      // Wider than tall
      width = maxDimension;
      height = maxDimension / aspectRatio;
    } else {
      // Taller than wide or square
      height = maxDimension;
      width = maxDimension * aspectRatio;
    }

    return this.generateSVGImage(width, height);
  }  async saveDesign() {
    // Get current tiles state
    const currentTiles: TruchetTile[] = [];
    const subscription = this.tiles$.subscribe(tiles => {
      tiles.forEach(row => {
        row.forEach((tile: TruchetTile) => {
          currentTiles.push(tile);
        });
      });
    });
    subscription.unsubscribe();

    // Generate thumbnail
    const thumbnail = await this.generateThumbnail();

    let shouldSaveAsNew = true;

    // If we have a current design, show modal to ask user what to do
    if (this.currentDesignId) {
      try {
        const modalRef = this.modalService.open(SaveDesignModalComponent, {
          backdrop: 'static',
          keyboard: false
        });
        
        const result = await modalRef.result;
        if (result === 'update') {
          shouldSaveAsNew = false;
        } else if (result === 'new') {
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
      id: this.currentDesignId,
      name: new Date().toLocaleString(),
      gridSize: {
        rows: this.rows,
        cols: this.cols
      },
      pattern: this.truchetService.getCurrentPattern(),
      tileRotations: currentTiles.map(t => t.rotation),
      primaryColor: this.strokeColor,
      secondaryColor: this.backgroundColor,
      createdAt: new Date(),
      strokeWidth: this.strokeWidth,
      tileSize: this.tileSize,
      noiseScale: this.noiseScale,
      noiseFrequency: this.noiseFrequency,
      noiseOffset: this.truchetService.getNoiseOffset(),
      thumbnail: thumbnail
    };    // Get existing designs
    const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
    
    if (!shouldSaveAsNew && this.currentDesignId) {
      // Update existing design
      const index = savedDesigns.findIndex((d: SavedDesign) => d.id === this.currentDesignId);
      if (index !== -1) {        savedDesigns[index] = design;
        localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
        const modalRef = this.modalService.open(SuccessModalComponent);
        modalRef.componentInstance.message = 'Design updated successfully!';
        return;
      }
    }

    // Save as new design
    // Find the next available ID
    let maxId = 0;
    savedDesigns.forEach((d: SavedDesign) => {
      if (d.id && d.id > maxId) maxId = d.id;
    });
    design.id = maxId + 1;
    this.currentDesignId = design.id;
      savedDesigns.push(design);
    localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
    const modalRef = this.modalService.open(SuccessModalComponent);
    modalRef.componentInstance.message = 'Design saved successfully!';
  }
}
