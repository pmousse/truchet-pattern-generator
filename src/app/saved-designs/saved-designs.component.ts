import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SavedDesign } from '../models/saved-design';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-saved-designs',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule, DatePipe],
  template: `    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Saved Designs</h2>
        <button class="btn btn-danger" (click)="deleteAllDesigns()" *ngIf="savedDesigns.length > 0">
          <i class="bi bi-trash"></i> Delete All
        </button>
      </div>
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Name</th>
              <th>Grid Size</th>
              <th>Pattern</th>
              <th>Colors</th>
              <th>Settings</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let design of savedDesigns">              <td style="width: 120px">
                <div class="design-thumbnail" 
                     [style.height]="design.gridSize ? (100 * (design.gridSize.rows / design.gridSize.cols)) + 'px' : '100px'">
                  <img *ngIf="design.thumbnail" [src]="design.thumbnail" [alt]="design.name">
                  <div *ngIf="!design.thumbnail" class="no-thumbnail">No preview</div>
                </div>
              </td>
              <td>{{ design.name }}</td>
              <td>{{ design.gridSize.rows }}x{{ design.gridSize.cols }}</td>
              <td>{{ design.pattern }}</td>
              <td>
                <div class="color-preview">
                  <span class="color-box" [style.background-color]="design.primaryColor" [title]="'Stroke Color: ' + design.primaryColor"></span>
                  <span class="color-box" [style.background-color]="design.secondaryColor" [title]="'Background Color: ' + design.secondaryColor"></span>
                </div>
              </td>
              <td>
                <small class="text-muted">
                  Tile Size: {{ design.tileSize }}px<br>
                  Stroke Width: {{ design.strokeWidth }}px<br>
                  Noise Scale: {{ design.noiseScale }}<br>
                  Noise Freq: {{ design.noiseFrequency }}<br>
                  Noise Seed: {{ design.noiseOffset.x | number:'1.2-2' }}, {{ design.noiseOffset.y | number:'1.2-2' }}
                </small>
              </td>
              <td>{{ design.createdAt | date:'medium' }}</td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-primary" (click)="editDesign(design)">
                    <i class="bi bi-pencil"></i> Edit
                  </button>
                  <button class="btn btn-danger" (click)="deleteDesign(design)">
                    <i class="bi bi-trash"></i> Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="savedDesigns.length === 0">
              <td colspan="8" class="text-center">
                No saved designs yet. Create some patterns in the Generator!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .color-preview {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .color-box {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #dee2e6;
      cursor: help;
    }
    .btn-group {
      gap: 4px;
    }
    small.text-muted {
      font-size: 0.85em;
      line-height: 1.4;
      display: block;
    }    .design-thumbnail {
      width: 100px;
      max-height: 100px;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .design-thumbnail img {
      width: 100%;
      height: auto;
      display: block;
    }
    .no-thumbnail {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8f9fa;
      color: #6c757d;
      font-size: 0.8rem;
      text-align: center;
    }
  `]
})
export class SavedDesignsComponent implements OnInit {
  savedDesigns: SavedDesign[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadSavedDesigns();
  }

  loadSavedDesigns() {
    const savedDesignsJson = localStorage.getItem('savedDesigns');
    if (savedDesignsJson) {
      try {
        this.savedDesigns = JSON.parse(savedDesignsJson);
        // Sort designs by creation date, newest first
        this.savedDesigns.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      } catch (error) {
        console.error('Error loading saved designs:', error);
        this.savedDesigns = [];
      }
    } else {
      this.savedDesigns = [];
    }
  }

  editDesign(design: SavedDesign) {
    // Navigate to generator with the design state
    this.router.navigate(['/generator'], {
      state: { design }
    });
  }

  deleteDesign(design: SavedDesign) {
    if (confirm('Are you sure you want to delete this design?')) {
      // Get fresh data from localStorage
      const savedDesignsJson = localStorage.getItem('savedDesigns');
      if (savedDesignsJson) {
        try {
          const allDesigns: SavedDesign[] = JSON.parse(savedDesignsJson);
          // Find the index by matching all properties since we don't have a unique ID
          const index = allDesigns.findIndex((d: SavedDesign) => 
            d.name === design.name && 
            d.createdAt === design.createdAt &&
            d.gridSize === design.gridSize
          );
          
          if (index > -1) {
            allDesigns.splice(index, 1);
            localStorage.setItem('savedDesigns', JSON.stringify(allDesigns));
            // Reload the designs to refresh the view
            this.loadSavedDesigns();
          }
        } catch (error) {
          console.error('Error deleting design:', error);
        }
      }
    }
  }

  deleteAllDesigns() {
    if (confirm('Are you sure you want to delete all designs? This action cannot be undone.')) {
      try {
        // Clear all designs from localStorage
        localStorage.setItem('savedDesigns', '[]');
        // Refresh the designs list
        this.loadSavedDesigns();
      } catch (error) {
        console.error('Error deleting all designs:', error);
      }
    }
  }
}
