import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SidebarItem } from './sidebar.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly open = input<boolean>(false);

  readonly linkClicked = output<void>();

  readonly items: SidebarItem[] = [
    { label: 'Tableau de bord', route: '/dashboard' },
    { label: 'Missions d\'audit', route: '/missions' },
    { label: 'Documents d\'audit', route: '/documents' },
    { label: 'Historique des documents', route: '/document-history' },
    { label: 'Types de documents', route: '/document-types' },
    { label: 'Templates et champs', route: '/templates' },
    { label: 'Statistiques', route: '/statistics' },
    { label: 'Paramètres', route: '/settings' }
  ];
}
