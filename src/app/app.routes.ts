import { Routes } from '@angular/router';
import { TruchetGridComponent } from './truchet-grid/truchet-grid.component';

export const routes: Routes = [
  { path: '', redirectTo: '/generator', pathMatch: 'full' },
  { 
    path: 'generator', 
    component: TruchetGridComponent 
  },
  { 
    path: 'gallery', 
    loadComponent: () => import('./saved-designs/saved-designs.component').then(m => m.SavedDesignsComponent)
  }
];
