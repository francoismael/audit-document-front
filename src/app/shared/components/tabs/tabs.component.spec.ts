import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('tabs', [
      { id: 'details', label: 'Détails' },
      { id: 'fields', label: 'Champs', count: 4 }
    ]);
    fixture.componentRef.setInput('activeTab', 'details');
    fixture.detectChanges();
  });

  it('should mark the active tab and show the counters', () => {
    const tabs = element.querySelectorAll('[role="tab"]');

    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].textContent).toContain('4');
  });

  it('should emit the id of the clicked tab', () => {
    const changes: string[] = [];
    component.tabChange.subscribe((id) => changes.push(id));

    element.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();

    expect(changes).toEqual(['fields']);
  });
});
