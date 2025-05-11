import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TileComponent } from '../tile/tile.component';
import { TruchetService } from '../services/truchet.service';

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
  tileSize = 100;  strokeColor = '#ffffff';
  backgroundColor = '#000000';  strokeWidth = 10;
  noiseScale = 0.2;
  noiseFrequency = 1.0;
  tiles$;
  isAutoRandomizing = false;
  private randomizeInterval: any;

  constructor(private truchetService: TruchetService) {
    this.tiles$ = this.truchetService.getTiles();
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
    this.truchetService.resetGrid();
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
    const root = document.documentElement;
    root.style.setProperty('--truchet-stroke-color', this.strokeColor);
    root.style.setProperty('--truchet-stroke-width', `${this.strokeWidth}px`);
    root.style.setProperty('--truchet-background-color', this.backgroundColor);
  }

  async saveAsImage() {
    const element = this.gridContainer.nativeElement;
    const gridRect = element.getBoundingClientRect();
    
    // Calculate dimensions and scaling
    const tileSize = gridRect.width / this.cols;
    const totalWidth = gridRect.width;
    const totalHeight = tileSize * this.rows;
    
    // Calculate stroke width relative to tile size
    const scaledStrokeWidth = (this.strokeWidth / 100) * tileSize;
    
    // Create SVG that will contain all tiles
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSvg.setAttribute('width', totalWidth.toString());
    exportSvg.setAttribute('height', totalHeight.toString());
    exportSvg.style.backgroundColor = this.backgroundColor;
    
    // Process each tile
    const tiles = Array.from(element.getElementsByTagName('app-tile')) as HTMLElement[];
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
    const scale = window.devicePixelRatio || 1; // For better quality on high DPI displays
    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.scale(scale, scale);
      
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
      
      // Download
      const link = document.createElement('a');
      link.download = 'truchet-pattern.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
    }
  }
}
