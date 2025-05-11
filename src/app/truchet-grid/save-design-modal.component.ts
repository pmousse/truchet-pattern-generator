import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-save-design-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Save Design</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p>Do you want to update the current design or save it as a new design?</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" (click)="modal.close('update')">Update Current</button>
      <button type="button" class="btn btn-success" (click)="modal.close('new')">Save as New</button>
      <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Cancel</button>
    </div>
  `
})
export class SaveDesignModalComponent {
  constructor(public modal: NgbActiveModal) {}
}
