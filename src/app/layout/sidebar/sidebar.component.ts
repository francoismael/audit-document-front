import { Component } from '@angular/core';
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
  readonly items: SidebarItem[] = [
    { label: 'Tableau de bord', route: '/dashboard' },
    { label: 'Types de documents', route: '/document-types' },
    { label: 'Templates', route: '/templates' },
    { label: 'Champs dynamiques', route: '/dynamic-fields' },
    { label: 'Documents', route: '/documents' },
    { label: 'Paramètres', route: '/settings' }
  ];
}
