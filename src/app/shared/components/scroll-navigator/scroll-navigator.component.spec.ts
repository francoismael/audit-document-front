import { Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollNavigatorComponent } from './scroll-navigator.component';

@Component({
  standalone: true,
  imports: [ScrollNavigatorComponent],
  template: `
    <div class="host">
      <div #area class="area"><div [class.tall]="tall"></div></div>
      <app-scroll-navigator [target]="area" />
    </div>
  `,
  styles: ['.host { position: relative; } .area { height: 100px; overflow-y: auto; } .tall { height: 1000px; }']
})
class HostComponent {
  readonly area = viewChild.required<ElementRef<HTMLElement>>('area');
  tall = true;
}

describe('ScrollNavigatorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let element: HTMLElement;
  let area: HTMLElement;

  const labels = (): (string | null)[] =>
    Array.from(element.querySelectorAll('.scroll-navigator-button')).map((button) => button.getAttribute('aria-label'));

  const scrollAreaTo = (top: number): void => {
    area.scrollTop = top;
    area.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
    area = fixture.componentInstance.area().nativeElement;
    fixture.detectChanges();
  });

  it('should only point down at the top of the area', () => {
    expect(labels()).toEqual(['Descendre en bas']);
  });

  it('should point both ways in the middle, and only up at the bottom', () => {
    scrollAreaTo(400);
    expect(labels()).toEqual(['Remonter en haut', 'Descendre en bas']);

    scrollAreaTo(900);
    expect(labels()).toEqual(['Remonter en haut']);
  });

  it('should scroll the area when an arrow is clicked', () => {
    const scrollTo = spyOn(area, 'scrollTo') as jasmine.Spy<(options: ScrollToOptions) => void>;

    element.querySelector<HTMLButtonElement>('.scroll-navigator-button')?.click();

    expect(scrollTo).toHaveBeenCalledWith({ top: area.scrollHeight, behavior: 'smooth' });
  });

  it('should hide itself when the content fits', async () => {
    fixture.componentInstance.tall = false;
    fixture.detectChanges();
    // The observers report the change asynchronously.
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();

    expect(element.querySelector('.scroll-navigator')).toBeNull();
  });
});
