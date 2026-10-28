import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ScrollNavigatorComponent } from '../../shared/components/scroll-navigator/scroll-navigator.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ScrollNavigatorComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  host: {
    '(document:keydown.escape)': 'closeSidebar()'
  }
})
export class MainLayoutComponent {
  // Only used on small screens, where the sidebar is hidden by default.
  readonly sidebarOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
