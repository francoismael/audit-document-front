import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentPreviewComponent } from './document-preview.component';

describe('DocumentPreviewComponent', () => {
  let component: DocumentPreviewComponent;
  let fixture: ComponentFixture<DocumentPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentPreviewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Fiche de suivi');
    fixture.componentRef.setInput('fields', []);
    fixture.componentRef.setInput('values', {});

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
