import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SidebarItem } from './sidebar.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly open = input<boolean>(false);

  readonly linkClicked = output<void>();

  readonly items: SidebarItem[] = [
    { label: 'Tableau de bord', route: '/dashboard', icon: 'dashboard' },
    { label: 'Missions d\'audit', route: '/missions', icon: 'assignment' },
    { label: 'Documents d\'audit', route: '/documents', icon: 'description' },
    { label: 'Historique', route: '/document-history', icon: 'history' },
    { label: 'Types de documents', route: '/document-types', icon: 'category' },
    { label: 'Templates et champs', route: '/templates', icon: 'dynamic_form' },
    { label: 'Statistiques', route: '/statistics', icon: 'insights' },
    { label: 'Paramètres', route: '/settings', icon: 'settings' }
  ];
}
