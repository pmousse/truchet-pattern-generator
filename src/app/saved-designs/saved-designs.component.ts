import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SavedDesign } from '../models/saved-design';

@Component({
  selector: 'app-saved-designs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <h2>Saved Designs</h2>
      <div class="row">
        <div class="col-md-4 mb-4" *ngFor="let design of savedDesigns">
          <div class="card">
            <div class="card-header">
              {{ design.name }}
            </div>
            <div class="card-body">
              <div class="design-preview" 
                   [style.background-color]="design.secondaryColor"
                   [style.border]="'2px solid ' + design.primaryColor">
                <div class="preview-text">
                  {{ design.gridSize }}x{{ design.gridSize }} grid
                  <br>
                  Pattern: {{ design.pattern }}
                </div>
              </div>
              <p class="text-muted mt-2">
                Created: {{ design.createdAt | date:'medium' }}
              </p>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary me-2" (click)="loadDesign(design)">
                <i class="bi bi-brush"></i> Edit
              </button>
              <button class="btn btn-danger" (click)="deleteDesign(design)">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="alert alert-info" *ngIf="savedDesigns.length === 0">
        No saved designs yet. Go to the Generator to create some!
      </div>
    </div>
  `,
  styles: [`
    .design-preview {
      height: 150px;
      margin: 1rem 0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .preview-text {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 1rem;
      border-radius: 4px;
    }
  `]
})
export class SavedDesignsComponent implements OnInit {
  savedDesigns: SavedDesign[] = [];

  constructor() {
    // Load designs from localStorage
    const designsJson = localStorage.getItem('truchetDesigns');
    if (designsJson) {
      const designs = JSON.parse(designsJson);
      this.savedDesigns = designs.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt)
      }));
    }
  }

  ngOnInit() {}

  loadDesign(design: SavedDesign) {
    // Navigate to the generator with the design ID
    window.location.href = `/generator?design=${design.id}`;
  }

  deleteDesign(design: SavedDesign) {
    if (confirm('Are you sure you want to delete this design?')) {
      // Get current designs
      const designs = this.savedDesigns.filter(d => d !== design);
      // Update localStorage
      localStorage.setItem('truchetDesigns', JSON.stringify(designs));
      // Update view
      this.savedDesigns = designs;
    }
  }
}
