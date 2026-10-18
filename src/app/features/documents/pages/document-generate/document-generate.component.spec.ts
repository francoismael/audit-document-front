import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DocumentGenerateComponent } from './document-generate.component';

describe('DocumentGenerateComponent', () => {
  let component: DocumentGenerateComponent;
  let fixture: ComponentFixture<DocumentGenerateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentGenerateComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentGenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
