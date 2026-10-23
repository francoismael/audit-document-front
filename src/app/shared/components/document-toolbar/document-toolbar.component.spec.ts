import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentToolbarComponent } from './document-toolbar.component';

describe('DocumentToolbarComponent', () => {
  let fixture: ComponentFixture<DocumentToolbarComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentToolbarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentToolbarComponent);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('title', 'Termes de référence');
    fixture.detectChanges();
  });

  it('should open the print window of the browser', () => {
    const print = spyOn(window, 'print');

    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Imprimer / PDF'))
      ?.click();

    expect(element.querySelector('h2')?.textContent).toContain('Termes de référence');
    expect(print).toHaveBeenCalled();
  });

  it('should hide the print button when there is nothing to print', () => {
    fixture.componentRef.setInput('printable', false);
    fixture.detectChanges();

    expect(element.textContent).not.toContain('Imprimer / PDF');
  });
});
