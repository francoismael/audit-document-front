import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the sidebar from the header button and close it from a menu link', () => {
    const element: HTMLElement = fixture.nativeElement;
    const menuButton = element.querySelector<HTMLButtonElement>('.header-menu-button');
    const sidebar = element.querySelector<HTMLElement>('.sidebar');

    menuButton?.click();
    fixture.detectChanges();

    expect(sidebar?.classList).toContain('open');
    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.main-layout-backdrop')).not.toBeNull();

    element.querySelector<HTMLAnchorElement>('.sidebar-link')?.click();
    fixture.detectChanges();

    expect(sidebar?.classList).not.toContain('open');
    expect(element.querySelector('.main-layout-backdrop')).toBeNull();
  });

  it('should close the sidebar with the Escape key', () => {
    component.toggleSidebar();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.sidebarOpen()).toBeFalse();
  });

  it('should show the eight menu entries', () => {
    const links = fixture.nativeElement.querySelectorAll('.sidebar-link');

    expect(links.length).toBe(8);
  });
});
