import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TileComponent } from '../tile/tile.component';
import { TruchetService, TruchetTile } from '../services/truchet.service';
import { Router } from '@angular/router';
import { SavedDesign } from '../models/saved-design';
import { SaveDesignModalComponent } from './save-design-modal.component';

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
  tiles$;
  pattern$;
  isAutoRandomizing = false;
  private randomizeInterval: any;
  constructor(
    private truchetService: TruchetService,
    private router: Router,
    private modalService: NgbModal
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
  }

  ngOnInit() {
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
  }

  onTileRotate(row: number, col: number) {
    this.truchetService.rotateTile(row, col);
  }

  resetGrid() {
    // Get default values from service
    const defaults = this.truchetService.getDefaultValues();

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
  }

  setPattern(pattern: 'curve' | 'triangle') {
    this.truchetService.setPattern(pattern);
  }
  async saveAsImage() {
    const element = this.gridContainer.nativeElement;
    const gridRect = element.getBoundingClientRect();
    const imageData = await this.generateSVGImage(gridRect.width, gridRect.height * (this.rows / this.cols));
    
    if (imageData) {
      const link = document.createElement('a');
      link.download = 'truchet-pattern.png';
      link.href = imageData;
      link.click();
    }
  }

  private async generateSVGImage(width: number, height: number): Promise<string> {
    // Calculate dimensions and scaling
    const tileSize = width / this.cols;
    const totalWidth = width;
    const totalHeight = height;
    
    // Calculate stroke width relative to tile size
    const scaledStrokeWidth = (this.strokeWidth / 100) * tileSize;
    
    // Create SVG that will contain all tiles
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSvg.setAttribute('width', totalWidth.toString());
    exportSvg.setAttribute('height', totalHeight.toString());
    exportSvg.style.backgroundColor = this.backgroundColor;
    
    // Process each tile
    const tiles = Array.from(this.gridContainer.nativeElement.getElementsByTagName('app-tile')) as HTMLElement[];
    tiles.forEach((tile, index) => {
      const row = Math.floor(index / this.cols);
      const col = index % this.cols;
      
      const tileSvg = tile.querySelector('svg');
      if (tileSvg) {
        const tileGroup = tileSvg.querySelector('g');
        if (tileGroup) {
          // Create new group for this tile position
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('transform', `translate(${col * tileSize}, ${row * tileSize})`);
          
          // Create the paths with the correct style
          const paths = [
            `M0,${tileSize/2} A${tileSize/2},${tileSize/2} 0 0,0 ${tileSize/2},0`,
            `M${tileSize/2},${tileSize} A${tileSize/2},${tileSize/2} 0 0,1 ${tileSize},${tileSize/2}`
          ];
          
          // Create inner group for rotation around center
          const rotationGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          const transform = tileGroup.style.transform;
          const match = transform.match(/rotate\(([\d.-]+)deg\)/);
          if (match) {
            const rotation = parseFloat(match[1]);
            rotationGroup.setAttribute('transform', `rotate(${rotation} ${tileSize/2} ${tileSize/2})`);
          }
          
          // Add paths to the rotation group
          paths.forEach(d => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', this.strokeColor);
            path.setAttribute('stroke-width', scaledStrokeWidth.toString());
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            rotationGroup.appendChild(path);
          });
          
          g.appendChild(rotationGroup);
          exportSvg.appendChild(g);
        }
      }
    });
    
    // Convert SVG to canvas
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw background
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      // Convert SVG to image
      const svgString = new XMLSerializer().serializeToString(exportSvg);
      const img = new Image();
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      
      // Draw on canvas
      ctx.drawImage(img, 0, 0, totalWidth, totalHeight);
      
      // Get image data
      const imageData = canvas.toDataURL('image/png');
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      return imageData;
    }
    return '';
  }
  private async generateThumbnail(): Promise<string> {
    // Generate a smaller version for the thumbnail
    const maxDimension = 100;
    const aspectRatio = this.rows / this.cols;
    
    let width: number;
    let height: number;

    if (aspectRatio > 1) {
      // Taller than wide
      height = maxDimension;
      width = maxDimension / aspectRatio;
    } else {
      // Wider than tall or square
      width = maxDimension;
      height = maxDimension * aspectRatio;
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
      if (index !== -1) {
        savedDesigns[index] = design;
        localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
        this.modalService.open({
          content: 'Design updated successfully!',
          buttons: ['OK']
        });
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
    this.modalService.open({
      content: 'Design saved successfully!',
      buttons: ['OK']
    });
  }
}
