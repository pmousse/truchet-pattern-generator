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

  onTileClick() {
    this.rotate.emit();
  }
}
