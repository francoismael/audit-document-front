import { Component, input, output } from '@angular/core';

import { TabItem } from './tabs.interface';

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss'
})
export class TabsComponent {
  readonly tabs = input.required<TabItem[]>();
  readonly activeTab = input.required<string>();

  readonly tabChange = output<string>();
}
