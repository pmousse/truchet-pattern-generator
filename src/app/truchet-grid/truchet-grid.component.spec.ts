import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruchetGridComponent } from './truchet-grid.component';

describe('TruchetGridComponent', () => {
  let component: TruchetGridComponent;
  let fixture: ComponentFixture<TruchetGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TruchetGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruchetGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
