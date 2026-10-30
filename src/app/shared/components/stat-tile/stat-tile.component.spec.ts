import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatTileComponent } from './stat-tile.component';

describe('StatTileComponent', () => {
  let fixture: ComponentFixture<StatTileComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatTileComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatTileComponent);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('label', 'Missions en cours');
    fixture.componentRef.setInput('value', 4);
    fixture.componentRef.setInput('icon', 'assignment');
    fixture.detectChanges();
  });

  it('should show the label and the value, and the hint only when given', () => {
    expect(element.querySelector('.stat-tile-label')?.textContent).toBe('Missions en cours');
    expect(element.querySelector('.stat-tile-value')?.textContent).toBe('4');
    expect(element.querySelector('.stat-tile-hint')).toBeNull();

    fixture.componentRef.setInput('hint', 'sur 12 missions');
    fixture.componentRef.setInput('tone', 'gold');
    fixture.detectChanges();

    expect(element.querySelector('.stat-tile-hint')?.textContent).toBe('sur 12 missions');
    expect(element.querySelector('.stat-tile-icon')?.classList).toContain('stat-tile-gold');
  });
});
