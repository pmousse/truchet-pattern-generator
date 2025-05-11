import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss']
})
export class TileComponent {
  @Input() rotation: number = 0;
  @Output() rotate = new EventEmitter<void>();
  isRotating = false;

  onTileClick() {
    if (!this.isRotating) {
      this.isRotating = true;
      this.rotate.emit();
      
      // Reset the animation flag after the animation completes
      setTimeout(() => {
        this.isRotating = false;
      }, 600); // Match the CSS transition duration
    }
  }

  getRotationStyle(): { [key: string]: string } {
    return {
      'transform': `rotate(${this.rotation}deg)`,
      'transform-origin': '50% 50%'
    };
  }
}
