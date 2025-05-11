import { Routes } from '@angular/router';
import { TruchetGridComponent } from './truchet-grid/truchet-grid.component';
import { SavedDesignsComponent } from './saved-designs/saved-designs.component';

export const routes: Routes = [
  { path: '', redirectTo: '/generator', pathMatch: 'full' },
  { path: 'generator', component: TruchetGridComponent },
  { path: 'gallery', component: SavedDesignsComponent }
];
