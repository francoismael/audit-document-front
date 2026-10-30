import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyFigureComponent } from './key-figure.component';

describe('KeyFigureComponent', () => {
  let fixture: ComponentFixture<KeyFigureComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyFigureComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(KeyFigureComponent);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('label', 'Missions en cours');
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();
  });

  it('should show the value alone when there is no total', () => {
    expect(element.querySelector('.key-figure-value')?.textContent?.trim()).toBe('3');
    expect(element.querySelector('progress')).toBeNull();
  });

  it('should show the value out of the total with a gauge of the share', () => {
    fixture.componentRef.setInput('total', 8);
    fixture.componentRef.setInput('caption', '2 à venir');
    fixture.detectChanges();

    expect(element.querySelector('.key-figure-value')?.textContent?.replace(/\s+/g, '')).toBe('3/8');
    expect((element.querySelector('progress') as HTMLProgressElement).value).toBe(38);
    expect(element.querySelector('.key-figure-caption')?.textContent).toBe('2 à venir');
  });
});
