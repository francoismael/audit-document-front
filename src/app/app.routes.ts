import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const APP_NAME = 'Audit documentaire MEF';

const pageTitle = (page: string): string => `${page} · ${APP_NAME}`;

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: pageTitle('Tableau de bord'),
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        // Workspace of a mission: its business documents in full width. Declared before "missions" and its drawer.
        path: 'missions/:id/dossier',
        title: pageTitle('Dossier d\'audit'),
        loadComponent: () =>
          import('./features/audit-file/pages/mission-workspace/mission-workspace.component').then(
            (m) => m.MissionWorkspaceComponent
          ),
        children: [
          { path: '', redirectTo: 'ordre-de-mission', pathMatch: 'full' },
          {
            path: 'ordre-de-mission',
            loadComponent: () =>
              import('./features/audit-file/pages/ordre-mission-document/ordre-mission-document.component').then(
                (m) => m.OrdreMissionDocumentComponent
              )
          },
          {
            path: 'tdr',
            loadComponent: () =>
              import('./features/audit-file/pages/tdr-document/tdr-document.component').then(
                (m) => m.TdrDocumentComponent
              )
          },
          {
            path: 'declarations',
            loadComponent: () =>
              import('./features/audit-file/pages/declarations-document/declarations-document.component').then(
                (m) => m.DeclarationsDocumentComponent
              )
          },
          {
            path: 'pv-ouverture',
            loadComponent: () =>
              import('./features/audit-file/pages/pv-ouverture-document/pv-ouverture-document.component').then(
                (m) => m.PvOuvertureDocumentComponent
              )
          }
        ]
      },
      {
        path: 'missions',
        title: pageTitle('Missions d\'audit'),
        loadComponent: () =>
          import('./features/missions/pages/mission-list/mission-list.component').then(
            (m) => m.MissionListComponent
          ),
        children: [
          {
            // Opens as a drawer over the list.
            path: ':id',
            title: pageTitle('Mission d\'audit'),
            loadComponent: () =>
              import('./features/missions/pages/mission-detail/mission-detail.component').then(
                (m) => m.MissionDetailComponent
              )
          }
        ]
      },
      {
        path: 'documents',
        title: pageTitle('Documents d\'audit'),
        loadComponent: () =>
          import('./features/documents/pages/document-catalog/document-catalog.component').then(
            (m) => m.DocumentCatalogComponent
          )
      },
      {
        path: 'documents/generer/:documentTypeId',
        title: pageTitle('Générer un document'),
        loadComponent: () =>
          import('./features/documents/pages/document-generate/document-generate.component').then(
            (m) => m.DocumentGenerateComponent
          )
      },
      {
        path: 'document-history',
        title: pageTitle('Historique des documents'),
        loadComponent: () =>
          import('./features/document-history/pages/document-history/document-history.component').then(
            (m) => m.DocumentHistoryComponent
          ),
        children: [
          {
            // Opens as a drawer over the list.
            path: ':id',
            title: pageTitle('Document généré'),
            loadComponent: () =>
              import(
                './features/document-history/pages/generated-document-detail/generated-document-detail.component'
              ).then((m) => m.GeneratedDocumentDetailComponent)
          }
        ]
      },
      {
        path: 'document-types',
        title: pageTitle('Types de documents'),
        loadComponent: () =>
          import('./features/document-types/pages/document-type-list/document-type-list.component').then(
            (m) => m.DocumentTypeListComponent
          ),
        children: [
          {
            // Opens in a side panel next to the list.
            path: ':id',
            title: pageTitle('Configuration du type de document'),
            loadComponent: () =>
              import('./features/document-types/pages/document-type-config/document-type-config.component').then(
                (m) => m.DocumentTypeConfigComponent
              )
          }
        ]
      },
      {
        path: 'templates',
        title: pageTitle('Templates et champs'),
        loadComponent: () =>
          import('./features/document-types/pages/template-overview/template-overview.component').then(
            (m) => m.TemplateOverviewComponent
          )
      },
      {
        path: 'statistics',
        title: pageTitle('Statistiques'),
        loadComponent: () =>
          import('./features/statistics/pages/statistics/statistics.component').then(
            (m) => m.StatisticsComponent
          )
      },
      {
        path: 'settings',
        title: pageTitle('Paramètres'),
        loadComponent: () =>
          import('./features/settings/pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
