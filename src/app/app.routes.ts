import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/pages/document-generate/document-generate.component').then(
            (m) => m.DocumentGenerateComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
