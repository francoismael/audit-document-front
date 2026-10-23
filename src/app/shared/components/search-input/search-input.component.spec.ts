import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;
  let element: HTMLElement;
  let searches: string[];

  const typeText = (text: string): void => {
    const input = element.querySelector<HTMLInputElement>('input') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('id', 'test-search');
    fixture.detectChanges();

    searches = [];
    component.search.subscribe((text) => searches.push(text));
  });

  it('should have no search button', () => {
    expect(element.querySelectorAll('button').length).toBe(0);
  });

  it('should show the loader while typing, then search once the user stops', fakeAsync(() => {
    typeText('rap');
    typeText('rapport ');

    expect(element.querySelector('.search-input-loader')).not.toBeNull();
    expect(searches).toEqual([]);

    tick(300);
    fixture.detectChanges();

    expect(searches).toEqual(['rapport']);
    expect(element.querySelector('.search-input-loader')).toBeNull();
    expect(element.querySelector('button[aria-label="Effacer la recherche"]')).not.toBeNull();
  }));

  it('should search right away with Enter and when the text is cleared', fakeAsync(() => {
    typeText('fiche');
    element.querySelector('input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(searches).toEqual(['fiche']);

    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('button[aria-label="Effacer la recherche"]')?.click();
    expect(searches).toEqual(['fiche', '']);

    tick(300);
    expect(searches).toEqual(['fiche', '']);
  }));

  it('should show the loader while the page loads its results', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(element.querySelector('.search-input-loader')).not.toBeNull();
  });
});
