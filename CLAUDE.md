# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Front-end Angular 19 de l'application d'audit documentaire du MEF. Les textes de l'interface sont en français. Le projet en est au début : le routing est vide (`src/app/app.routes.ts`), `src/app/core/http/api.config.ts` est un fichier vide, et `AppComponent` sert pour l'instant de page de démonstration des composants partagés.

## Commandes (PowerShell)

- `npm start` : serveur de dev (`ng serve`, http://localhost:4200)
- `npm run build` : build de production dans `dist/audit-document-front`
- `npm run watch` : build de développement en mode watch
- `npm test` : tests unitaires Karma + Jasmine (Chrome)
- Un seul fichier de test : `npx ng test --include=src/app/shared/components/button/button.component.spec.ts`
- Générer un composant : `npx ng g c shared/components/<nom>` (SCSS par défaut)

Aucun linter n'est configuré.

## Technologies

- Angular 19, composants standalone uniquement (pas de NgModule). Le bootstrap passe par `app.config.ts`.
- TypeScript strict (`strict`, `strictTemplates`). **Jamais de `any`.**
- Signaux Angular quand c'est pertinent : `input()`, `input.required()`, `output()`, `signal()`, `computed()`, déclarés `readonly`. Pas de décorateurs `@Input` / `@Output`.
- Syntaxe moderne des templates : `@if`, `@for`, `@switch` (jamais `*ngIf` / `*ngFor`).
- Toujours générer les composants avec Angular CLI (`ng g c ...`).
- **Jamais de style dans le HTML** (pas d'attribut `style`). Utiliser les classes SCSS, `[ngClass]`, `[class.xxx]` et les mécanismes Angular.
- Code ultra propre et lisible : simple, sans sur-ingénierie, sans commentaires superflus, sans code verbeux qui ressemble à du code généré par une IA.

## Architecture cible

```
src/app/
├── core/
│   ├── http/api.config.ts
│   └── services/
├── layout/
│   └── main-layout/
├── features/
│   ├── dashboard/
│   ├── missions/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── models/
│   └── documents/
│       ├── pages/
│       ├── components/
│       ├── services/
│       └── models/
└── shared/
    ├── components/
    ├── directives/
    ├── pipes/
    ├── models/
    └── interfaces/
```

Images et fichiers statiques : dans `public/` (servi à la racine du site), par exemple `public/images/logos/` et `public/images/icons/`. Dans le code, on y fait référence sans `public` : `<img src="images/logos/logo-mef.svg" alt="Logo MEF">`.

Pour l'instant, seuls `core/http/` et `shared/components/` existent. Créer les autres dossiers au fur et à mesure des besoins.

- Composants génériques et réutilisables : `shared/components/`. Ils servent uniquement à l'affichage : ils reçoivent des données en `input` et émettent des événements en `output` (`valueChange`, `clicked`…), sans appeler de service.
- **Toujours réutiliser les composants de `shared/components/`** (`app-button`, `app-card`, `app-data-table`, `app-modal`, `app-form-field`, `app-page-header`…) au lieu de réécrire leur HTML et leur SCSS dans une page ou un composant métier. Avant d'écrire un élément d'interface, vérifier si un composant partagé existe déjà. Si un même bloc revient à plusieurs endroits, en faire un composant réutilisable plutôt que de dupliquer le code.
- Composants métier : dans le dossier `features/<feature>/components/` correspondant ; pages : `features/<feature>/pages/`.
- Séparer clairement l'affichage, la logique métier (services) et les appels API.
- Commencer par les composants visuels réutilisables, puis assembler les pages.

## Types et interfaces

- Type ou interface propre à un seul composant : dans le dossier du composant (ex. `card/card.interface.ts`, `button/button.interface.ts` pour `ButtonVariant`, `ButtonSize`, `ButtonType`).
- Type réellement partagé entre plusieurs composants ou fonctionnalités : dans `src/app/shared/interfaces/`.
- Modèle métier (ex. `Mission`, `DocumentType`) : dans le dossier `models/` de la fonctionnalité concernée.
- Ne pas créer d'interface inutile pour un type qui ne sert qu'à un seul endroit.

## Styles SCSS

- Toutes les variables sont dans `src/styles/_variables.scss` (palette MEF, espacements `$space-1..6`, rayons `$radius-*`, ombres, tailles de layout).
- `src/styles` est déclaré dans `stylePreprocessorOptions.includePaths` (`angular.json`, pour le build et les tests). Chaque fichier SCSS de composant commence donc par `@use 'variables' as *;`.
- **Toujours utiliser les variables** pour les couleurs, espacements, bordures et rayons. Aucune couleur en dur dans un composant : si une couleur manque, l'ajouter dans `_variables.scss`.
- Variables SCSS avec un seul `$` (`$color-primary`). **Jamais de variables CSS `--xxx`.**
- SCSS imbriqué quand ça améliore la lisibilité. Éviter de dupliquer les styles communs.

```scss
.container {
  background-color: $color-primary;
  display: flex;

  .teste-card {
    text-align: center;

    label {
      color: $color-turquoise;
    }
  }
}
```

### Palette officielle

| Couleur | Valeur | Variable |
|---|---|---|
| Bleu primaire | `#103549` | `$color-primary` |
| Turquoise | `#1D8EA6` | `$color-turquoise` |
| Noir / gris foncé | `#2A2D2E` | `$color-dark` |
| Jaune doré | `#F5B940` | `$color-gold` |
| Vert | `#436758` | `$color-green` |
| Gris clair | `#E1E7EA` | `$color-light-gray` |

## Conventions de nommage

- Classes CSS et variables SCSS en kebab-case : `.page-header`, `.teste-card`, `$color-turquoise`.
- **Aucun double tiret** dans les noms de classes ou de variables (pas de BEM `button--primary`).
- Noms de composants simples, sans préfixe inutile : `button`, `card`, `status-badge`, `page-header` (pas de `ui-`). Le sélecteur garde le préfixe Angular `app-`.
- Noms de fichiers Angular standards : `button.component.ts`, `button.component.html`, `button.component.scss`.
- Guillemets simples, indentation de 2 espaces (`.editorconfig`).

## Façon de répondre et de travailler

- Donner le chemin exact de chaque fichier créé ou modifié.
- Fournir le code complet des fichiers à créer ou modifier.
- Ne jamais remplacer un fichier existant sans signaler les modifications apportées.
- Expliquer les commandes à exécuter dans PowerShell.
- Avancer étape par étape et vérifier la compilation (`npm run build`) avant de continuer.
- Respecter la palette, l'architecture et les conventions ci-dessus pour tous les nouveaux composants.
