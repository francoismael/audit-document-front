import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconButtonComponent } from './icon-button.component';

describe('IconButtonComponent', () => {
  let component: IconButtonComponent;
  let fixture: ComponentFixture<IconButtonComponent>;
  let button: HTMLButtonElement;
  let clicks: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'delete');
    fixture.componentRef.setInput('label', 'Supprimer');
    fixture.detectChanges();

    button = fixture.nativeElement.querySelector('button');
    clicks = 0;
    component.clicked.subscribe(() => clicks++);
  });

  it('should show the icon and expose the label as accessible name and tooltip', () => {
    expect(fixture.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('delete');
    expect(button.getAttribute('aria-label')).toBe('Supprimer');
    expect(button.title).toBe('Supprimer');
  });

  it('should emit on click, but not when disabled', () => {
    button.click();
    expect(clicks).toBe(1);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    button.click();
    expect(clicks).toBe(1);
  });

  it('should apply the danger style', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();

    expect(button.classList).toContain('icon-button-danger');
  });
});
