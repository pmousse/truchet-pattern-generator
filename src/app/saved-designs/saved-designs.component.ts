import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SavedDesign } from '../models/saved-design';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DesignStorageService } from '../services/design-storage.service';

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-saved-designs',
  standalone: true,
  imports: [CommonModule, NgbModule, DatePipe],
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
              <th>Settings</th>              <th (click)="toggleSort()" style="cursor: pointer">
                Created 
                <i class="bi" [ngClass]="{
                  'bi-sort-down': sortDirection === 'desc',
                  'bi-sort-up': sortDirection === 'asc',
                  'bi-arrow-down-up': !sortDirection
                }"></i>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>            <tr *ngFor="let design of sortedDesigns">              <td style="width: 120px">
                <div class="design-thumbnail">
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
    }    .btn-group {
      gap: 4px;
    }
    small.text-muted {
      font-size: 0.85em;
      line-height: 1.4;
      display: block;
    }    .design-thumbnail {
      width: 100px;
      height: 100px;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8f9fa;
    }
    .design-thumbnail img {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
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
  sortDirection: SortDirection | null = null;

  constructor(
    private router: Router,
    private designStorage: DesignStorageService
  ) {}

  ngOnInit() {
    this.loadDesigns();
  }

  loadDesigns() {
    this.savedDesigns = this.designStorage.getAllDesigns();
  }

  editDesign(design: SavedDesign) {
    // Navigate to generator with the design state
    this.router.navigate(['/generator'], {
      state: { design },
      skipLocationChange: false // Make sure the navigation state is preserved
    });
  }

  deleteDesign(design: SavedDesign) {
    if (design.id !== undefined && confirm('Are you sure you want to delete this design?')) {
      this.designStorage.deleteDesign(design.id);
      this.loadDesigns();
    }
  }

  deleteAllDesigns() {
    if (confirm('Are you sure you want to delete all designs? This cannot be undone.')) {
      this.designStorage.deleteAllDesigns();
      this.loadDesigns();
    }
  }

  toggleSort() {
    if (!this.sortDirection) {
      this.sortDirection = 'desc';
    } else if (this.sortDirection === 'desc') {
      this.sortDirection = 'asc';
    } else {
      this.sortDirection = null;
    }
    // No need to manually sort, the getter will handle it
  }
  get sortedDesigns(): SavedDesign[] {
    if (!this.sortDirection) {
      // By default, show newest first
      return [...this.savedDesigns].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    return [...this.savedDesigns].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }
}
