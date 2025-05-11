import { TestBed } from '@angular/core/testing';

import { TruchetService } from './truchet.service';

describe('TruchetService', () => {
  let service: TruchetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TruchetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
