# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Front-end Angular 19 de l'application d'audit documentaire du MEF. Les textes de l'interface sont en français. Il consomme l'API de `../audit-document-back` (`API_BASE_URL` dans `core/http/api.config.ts`).

**La feuille de route est dans `ROADMAP.md`** : contrats de l'API, étapes de réalisation et état d'avancement. La lire avant toute nouvelle étape, et la mettre à jour (cases cochées et journal) à la fin de chaque étape.

Outils HTTP communs dans `core/http/` : `readApiErrorMessage()` pour afficher le message d'une erreur API, `readFileName()` et `saveFile()` pour les téléchargements.

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
- Syntaxe moderne des templates : `@if`, `@for`, `@switch` (jamais `*ngIf` / `*ngFor`). Attention : `as` n'est accepté que sur le `@if` principal, jamais sur un `@else if` ; écrire `} @else if (x()) { @if (x(); as x) { … } }`.
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

Créer les dossiers au fur et à mesure des besoins. Les fonctionnalités prévues sont `dashboard`, `missions`, `documents`, `document-types`, `document-history`, `statistics` et `settings`.

- Composants génériques et réutilisables : `shared/components/`. Ils servent uniquement à l'affichage : ils reçoivent des données en `input` et émettent des événements en `output` (`valueChange`, `clicked`…), sans appeler de service.
- **Toujours réutiliser les composants de `shared/components/`** (`app-button`, `app-card`, `app-data-table`, `app-modal`, `app-form-field`, `app-page-header`…) au lieu de réécrire leur HTML et leur SCSS dans une page ou un composant métier. Avant d'écrire un élément d'interface, vérifier si un composant partagé existe déjà. Si un même bloc revient à plusieurs endroits, en faire un composant réutilisable plutôt que de dupliquer le code.
- Composants métier : dans le dossier `features/<feature>/components/` correspondant ; pages : `features/<feature>/pages/`.
- Tableaux : `app-data-table` affiche les valeurs en texte. Pour une colonne qui demande autre chose (badge, boutons d'action…), fournir un gabarit avec la directive `appDataTableCell` : `<ng-template appDataTableCell="actions" let-row>…</ng-template>`. Ne pas réécrire de tableau HTML dans une page.
- Actions dans une liste ou un tableau : **icônes Angular Material** via le composant partagé `app-icon-button` (`icon` = nom d'icône Material, `label` = texte du title et de l'`aria-label`, `variant` `default | primary | danger`), jamais de grands boutons texte. Exemple : `<app-icon-button icon="delete" variant="danger" label="Supprimer" (clicked)="askDelete(item)" />`. La police d'icônes est servie localement (`material-icons`, déclarée dans `angular.json`). Les boutons texte (`app-button`) restent pour les actions principales d'une page ou d'une modale.
- Détail d'un élément d'une liste : **pas de page séparée**. Il s'ouvre dans un tiroir `app-side-panel` qui glisse depuis la droite **par-dessus** la page (fond assombri, la liste garde toute sa largeur dessous), avec : petit libellé (`eyebrow`) et titre, badges (`[panel-badges]`), onglets `app-tabs` (`[panel-tabs]`), lignes « libellé : valeur » `app-detail-row`, et actions principales en bas (`[panel-footer]`). Le détail est une route enfant de la liste (ex. `/document-types/:id`) affichée par un `<router-outlet>` de la page liste ; il se ferme en revenant à la route de la liste (croix ou clic sur le fond). Chaque slot projeté doit être dans son propre `@if`.
- Champ de recherche (`app-search-input`) : **pas de bouton « Rechercher »**. Filtrer sur l'événement `(search)`, émis 300 ms après la dernière frappe (ou avec Entrée) ; un petit indicateur de chargement s'affiche dans le champ pendant ce délai et quand on lui passe `[loading]`.
- Menu latéral : chaque entrée a une icône Angular Material (`icon` dans `SidebarItem`).
- **Défilement** : les barres de défilement verticales sont masquées dans tout le projet (`styles.scss`) ; la molette, le pavé tactile et le clavier font toujours défiler. Elles sont remplacées par `app-scroll-navigator`, un bouton rond en bas à droite de la zone : ↓ en haut, ↑ et ↓ au milieu, ↑ en bas, rien si le contenu tient. Déjà posé sur le contenu principal (`main-layout`), le tiroir (`app-side-panel`) et les fenêtres (`app-modal`). Toute nouvelle zone qui défile verticalement le reçoit aussi : `<div #zone class="…" (overflow-y: auto)>…</div><app-scroll-navigator [target]="zone" />`, le parent commun étant en `position: relative` (le composant ne doit pas être dans la zone qui défile). Les barres horizontales restent visibles (fines) pour les tableaux larges.
- **Documents métier d'une mission** (dossier d'audit, `features/audit-file`) : ils se saisissent dans l'**espace de travail** pleine largeur `/missions/:id/dossier/<document>` (menu des 12 documents à gauche). Chaque document a deux modes dans la page : **aperçu** (feuille A4 `app-document-sheet`, fidèle à `Document.docx`) et **modification** (formulaire en pleine largeur, pas dans une fenêtre, car ces documents sont longs) ; seules les petites saisies (une date, une confirmation) passent par `app-modal`. Barre du document : `app-document-toolbar` (bouton « Imprimer / PDF » inclus). Documents à plusieurs éléments (déclarations, interviews, tests, constats) : liste à gauche et feuille à droite avec `app-document-split` et `app-document-list-item` (`<li app-document-list-item split-list …>`). Formulaires des documents : mixin SCSS `document-form` (`@use 'document-form'; @include document-form.styles;`) et ses classes `file-form-*`. Tableau large (programme de travail, tableau des constats) : `app-document-sheet orientation="landscape"`, imprimé sur une page A4 paysage. Les données de la mission et des documents sont dans `AuditFileStore`, fourni par l'espace de travail. Ce qui ne doit pas être imprimé porte la classe `no-print` (feuille de style `src/styles/_print.scss`). À l'impression, la page n'a **aucune marge** (`@page { margin: 0 }`) pour que le navigateur n'ajoute pas sa date, son titre d'onglet, l'adresse et le numéro de page ; les marges blanches sont données par `app-document-sheet` et répétées sur chaque page (`box-decoration-break: clone`). Mise en forme des documents : en-tête centré (logo `minitere_economie_et_finance.png`, « MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES », « DIRECTION DE L'AUDIT INTERNE ») fourni par `app-document-sheet` ; informations du type « Nom : RAKOTOBE » sur une ligne avec la classe `document-info` (pas de tableau à colonnes larges) ; date de fin de document (« Antananarivo, le … ») avec la classe `document-date` : à droite, après quelques lignes vides, et rien après. Le titre de l'espace de travail et la barre du document restent fixés en haut au défilement (`$workspace-header-height`, `$content-padding`).
- Formulaires de création et de modification : dans une `app-modal`, sous forme d'un composant de la fonctionnalité (exemple : `DocumentTypeFormModalComponent`). Toujours demander une confirmation avec `app-modal` (`confirmVariant="danger"`, `size="sm"`, et le nom de l'élément en `description`) avant une suppression. Les fenêtres n'ont **pas d'icône** : le titre et le nom de l'élément sont centrés en haut (texte et boutons aussi pour une confirmation `sm`).
- Les composants de champ partagés (`app-form-field`, `app-select-field`, `app-search-input`…) ont un input `id` qu'ils posent sur leur `<input>` ou `<select>`. **Toujours le passer en liaison** : `[id]="'mission-select'"`, jamais `id="mission-select"`. Un attribut statique est aussi posé sur la balise du composant, ce qui crée deux éléments avec le même id et casse le lien `<label for>`.
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
- **Pas de barre verticale colorée** (`border-left` d'accent) sur les messages, encadrés ou cartes : un message d'information ou d'avertissement est un simple bloc au fond doux (`$color-warning-light`, `$color-danger-light`…) avec des coins arrondis.
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

### Langue du code (front et back)

- **Les noms de fonctions et de méthodes sont toujours en anglais** et décrivent l'action réalisée, sous la forme verbe + complément : `loadDocumentTypes()`, `generateDocument()`, `onDownload()`, `findMissionPersonne()`. Ne jamais écrire `chargerTypes()`, `trouverMission()`, etc.
- **Tous les commentaires sont en anglais**, dans le front (TypeScript, HTML, SCSS) comme dans le back (Java).
- Restent en français :
  - les textes affichés à l'utilisateur (libellés, messages, toasts) et les messages d'erreur métier renvoyés par l'API ;
  - les noms des entités métier et des champs du contrat d'API (`Mission`, `Constat`, `motifs`, `dateEmission`…). Ils ne sont pas traduits, y compris quand ils apparaissent dans un nom de fonction : `addRisques()`, `findConstat()`.

## Façon de répondre et de travailler

- Donner le chemin exact de chaque fichier créé ou modifié.
- Fournir le code complet des fichiers à créer ou modifier.
- Ne jamais remplacer un fichier existant sans signaler les modifications apportées.
- Expliquer les commandes à exécuter dans PowerShell.
- Avancer étape par étape et vérifier la compilation (`npm run build`) avant de continuer.
- Respecter la palette, l'architecture et les conventions ci-dessus pour tous les nouveaux composants.
