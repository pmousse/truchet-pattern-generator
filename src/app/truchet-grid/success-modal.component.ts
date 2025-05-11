import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Success!</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="alert alert-success mb-0">
        {{ message }}
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" (click)="viewGallery()">View in Gallery</button>
      <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Close</button>
    </div>
  `
})
export class SuccessModalComponent {
  message: string = '';

  constructor(
    public modal: NgbActiveModal,
    private router: Router
  ) {}

  viewGallery() {
    this.modal.dismiss();
    this.router.navigate(['/gallery']);
  }
}
