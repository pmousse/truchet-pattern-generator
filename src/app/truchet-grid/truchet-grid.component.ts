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
    // Get router state immediately during construction
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
    this.design = state?.['design'] as SavedDesign;
    
    this.tiles$ = this.truchetService.getTiles();
    this.pattern$ = this.truchetService.getPattern();
  }

  private design?: SavedDesign;

  ngOnInit() {
    if (this.design) {
      // Reset to defaults first
      const defaults = this.truchetService.getDefaultValues();
      this.cols = defaults.gridSize.cols;
      this.rows = defaults.gridSize.rows;
      this.tileSize = defaults.tileSize;
      this.strokeColor = defaults.primaryColor;
      this.backgroundColor = defaults.secondaryColor;
      this.strokeWidth = defaults.strokeWidth;
      this.noiseScale = defaults.noiseScale;
      this.noiseFrequency = defaults.noiseFrequency;

      // Reset services
      this.generatorState.resetState();
      this.truchetService.resetToDefaults(false);

      // Now load the design
      this.currentDesignId = this.design.id;
      this.cols = this.design.gridSize.cols;
      this.rows = this.design.gridSize.rows;
      this.strokeColor = this.design.primaryColor;
      this.backgroundColor = this.design.secondaryColor;
      this.strokeWidth = this.design.strokeWidth;
      this.tileSize = this.design.tileSize;
      this.noiseScale = this.design.noiseScale;
      this.noiseFrequency = this.design.noiseFrequency;

      // Update generator state with all values at once
      this.generatorState.saveState({
        rows: this.rows,
        cols: this.cols,
        tileSize: this.tileSize,
        strokeColor: this.strokeColor,
        backgroundColor: this.backgroundColor,
        strokeWidth: this.strokeWidth,
        noiseScale: this.noiseScale,
        noiseFrequency: this.noiseFrequency
      });

      // Update visual styles and grid
      this.updateStyle();
      this.updateGridSize();

      // Finally load the saved design pattern and tiles into the service
      this.truchetService.loadSavedDesign(this.design);
    } else {
      // If there's no saved design in navigation state, load from generator state
      const savedState = this.generatorState.getState();
      this.rows = savedState.rows;
      this.cols = savedState.cols;
      this.tileSize = savedState.tileSize;
      this.strokeColor = savedState.strokeColor;
      this.backgroundColor = savedState.backgroundColor;
      this.strokeWidth = savedState.strokeWidth;
      this.noiseScale = savedState.noiseScale;
      this.noiseFrequency = savedState.noiseFrequency;

      this.updateStyle();
      this.updateGridSize();
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
    const isEditingDesign = !!this.currentDesignId;

    // Clear the current design ID if not editing
    if (!isEditingDesign) {
      this.currentDesignId = undefined;
    }
    
    // Reset the generator state service if not editing
    if (!isEditingDesign) {
      this.generatorState.resetState();
    }

    // Reset all component properties if not editing
    if (!isEditingDesign) {
      this.cols = defaults.gridSize.cols;
      this.rows = defaults.gridSize.rows;
      this.tileSize = defaults.tileSize;
      this.strokeColor = defaults.primaryColor;
      this.backgroundColor = defaults.secondaryColor;
      this.strokeWidth = defaults.strokeWidth;
      this.noiseScale = defaults.noiseScale;
      this.noiseFrequency = defaults.noiseFrequency;
    }

    // Reset service state
    this.truchetService.resetToDefaults(isEditingDesign);

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
