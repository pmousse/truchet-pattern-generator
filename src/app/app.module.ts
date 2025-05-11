import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { TruchetGridComponent } from './truchet-grid/truchet-grid.component';
import { SavedDesignsComponent } from './saved-designs/saved-designs.component';
import { TileComponent } from './tile/tile.component';

import { routes } from './app.routes';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    RouterModule.forRoot(routes),
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    NgbModule,
    AppComponent,
    TruchetGridComponent,
    SavedDesignsComponent,
    TileComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
