import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DocumentSplitComponent } from '../document-split/document-split.component';
import { DocumentListItemComponent } from './document-list-item.component';

@Component({
  standalone: true,
  imports: [DocumentListItemComponent, DocumentSplitComponent],
  template: `
    <app-document-split>
      <li app-document-list-item split-list title="FI-001" subtitle="Ravelo Tiana" state="04/11/2026" [stateDone]="true" [selected]="true" (chosen)="chosen = chosen + 1">
        <button type="button" class="action">Modifier</button>
      </li>
      <p class="sheet">Feuille</p>
    </app-document-split>
  `
})
class HostComponent {
  chosen = 0;
}

describe('DocumentListItemComponent in a DocumentSplitComponent', () => {
  it('should put the item in the list, the rest beside it, and tell when the item is chosen', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    const item = element.querySelector('.document-split-list li');
    expect(item?.classList).toContain('document-list-item-selected');
    expect(item?.querySelector('.document-list-item-state-done')?.textContent).toContain('04/11/2026');
    expect(item?.querySelector('.action')).not.toBeNull();
    expect(element.querySelector('.document-split-main .sheet')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('.document-list-item-select')?.click();
    expect(fixture.componentInstance.chosen).toBe(1);
  });
});
