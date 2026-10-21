import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DetailRowComponent } from './detail-row.component';

@Component({
  standalone: true,
  imports: [DetailRowComponent],
  template: '<app-detail-row label="Code">FICHE_SUIVI</app-detail-row>'
})
class HostComponent {}

describe('DetailRowComponent', () => {
  it('should show the label and the projected value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.detail-row-label')?.textContent).toBe('Code');
    expect(element.querySelector('.detail-row-value')?.textContent).toContain('FICHE_SUIVI');
  });
});
