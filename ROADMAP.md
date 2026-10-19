# Feuille de route du front — Application de documents d'audit interne (MEF / DAI)

Ce fichier suit la réalisation du front, étape par étape. On ne passe à l'étape suivante qu'une fois la précédente compilée (`npm run build`), testée dans le navigateur et cochée ici.

Légende : `[ ]` à faire · `[~]` en cours · `[x]` terminé · ⛔ bloqué par le backend

---

## 1. Objectifs

Application Angular qui permet de :

- consulter le catalogue des types de documents et générer un document Word à partir d'un modèle ;
- créer, modifier, activer ou désactiver et supprimer des types de documents (modèle DOCX et champs dynamiques) sans modifier le code Angular ;
- consulter l'historique des documents générés et les retélécharger ;
- gérer les missions d'audit ;
- consulter un tableau de bord, des statistiques et les paramètres de l'application, alimentés par les API.

### Règles non négociables

- **Aucun rôle.** Tous les utilisateurs ont les mêmes droits et les mêmes menus, sans aucun contrôle d'accès dans le front.
- **Rien en dur.** Les types de documents et leurs champs viennent toujours de l'API. Il n'y a jamais de page spécifique à un type de document.
- **Aucune route ni fonctionnalité inventée.** Si une API manque, on le signale dans ce fichier (section 4) au lieu de simuler un fonctionnement.
- **Conventions du `CLAUDE.md`.** Composants standalone, signaux, `@if` / `@for`, pas de `any`, pas d'attribut `style`, variables SCSS, réutilisation de `shared/components/`. **Noms de fonctions et commentaires en anglais.**
- **Chaque page gère** le chargement, l'erreur API, l'état vide, la notification (toast), la validation, la confirmation des suppressions, les boutons désactivés pendant un traitement et l'affichage responsive.

---

## 2. Ce que le backend permet réellement

URL de base : `http://localhost:8080/api`. Le CORS global autorise `http://localhost:4200` et expose les en-têtes `Content-Disposition` et `X-Document-Id`. Aucun proxy n'est nécessaire.

| Domaine | Endpoints disponibles |
|---|---|
| Types de documents | `GET /document-types` · `POST /document-types` · `PUT /document-types/{id}` · `PATCH /document-types/{id}/statut` · `DELETE /document-types/{id}` · `GET /document-types/{id}/form` · `GET /document-types/{id}/template/validate-variables` · `POST /document-types/{id}/generate?missionId=` |
| Modèle Word | `POST /document-types/{id}/template` (multipart, clé `file`, `.docx` uniquement, 10 Mo maximum ; remplace le modèle actif et incrémente la version) |
| Champs | `GET /document-fields/document-type/{typeId}` · `GET /document-fields/{id}` · `POST /document-fields` · `POST /document-fields/batch` · `PUT /document-fields/{id}` · `DELETE /document-fields/{id}` |
| Historique | `GET /documents-generes?documentTypeId=&missionId=` · `GET /documents-generes/{id}` · `GET /documents-generes/{id}/download` · `DELETE /documents-generes/{id}` |
| Statistiques | `GET /statistiques` · `GET /statistiques/avancement` |
| Paramètres | `GET /parametres` (lecture seule) |
| Missions | `GET / POST /missions` · `GET / PUT / DELETE /missions/{id}` · `GET /mission-personnes/mission/{missionId}` |
| Référentiels | `/personnes` (CRUD) · `/structures` (CRUD) |
| Rapport | `POST /rapports` · `GET /rapports/mission/{missionId}` · `PUT /rapports/{id}` |
| Autres documents métier | `/tdrs`, `/reunions`, `/interviews`, `/declarations-independance`, `/programmes-travail`, `/tests`, `/constats`, `/pv-affirmations`, `/tableau-recommandations`, `/reponses`, `/recommandations/{id}/maintien` |

### Contrats importants

**Types de documents**

- `GET /document-types` renvoie `{ id, code, nom, description, actif, dateCreation }[]`. Il n'y a pas de filtre côté backend : le catalogue n'affiche que les types `actif`.
- `PUT /document-types/{id}` reçoit `{ code, nom, description }`. Le code est mis en majuscules et doit rester unique.
- `PATCH /document-types/{id}/statut` reçoit `{ actif: true | false }`. On ne peut ni téléverser un modèle ni générer de document avec un type désactivé.
- `DELETE /document-types/{id}` supprime le type, ses champs et ses modèles. La suppression est **refusée** (409) si le type a déjà servi à générer des documents : il faut alors le désactiver.
- `GET /document-types/{id}/form` renvoie `{ documentType, template, fields[] }`. Il fonctionne aussi pour un type désactivé ou sans modèle, ce qui permet de le configurer.
  - `template` vaut `null` si aucun modèle n'a été téléversé.
  - Chaque champ a la forme `{ id, documentTypeId, documentTypeNom, nom, libelle, type, obligatoire, ordre }`.

**Champs**

- Types acceptés par le backend : `TEXT`, `TEXTAREA`, `DATE`, `NUMBER` et `BOOLEAN` uniquement. Il n'existe ni options de liste (`SELECT`), ni placeholder.
- Ordre : il est attribué automatiquement par le backend à la création et n'est pas modifiable par l'API. On l'affiche, on ne l'édite pas.
- `POST` / `PUT` : le corps est `{ documentTypeId, nom, libelle, type, obligatoire }`. Le `batch` attend `{ documentTypeId, fields: [{ nom, libelle, type, obligatoire }] }`.

**Génération** (`POST /document-types/{id}/generate`)

- Corps JSON `{ "<nom du champ>": valeur }`, avec les dates au format `aaaa-mm-jj` et `BOOLEAN` en `true`/`false`.
- Paramètre facultatif `?missionId=` pour rattacher le document à une mission.
- Réponse : un fichier `.docx` (blob). Son nom figure dans l'en-tête `Content-Disposition`, et l'identifiant de l'entrée d'historique dans `X-Document-Id`.
- Chaque génération est enregistrée automatiquement dans l'historique, avec le fichier et les valeurs saisies.
- Un champ obligatoire vide, un type désactivé ou un type sans modèle provoquent une erreur 400. Comme la requête attend un blob, le JSON d'erreur arrive sous forme de `Blob` : il faut le lire pour afficher le message.

**Validation du modèle**

- Réponse : `{ variablesInTemplate, fieldsInDatabase, missingFields, unknownVariables, valid, templateName }`.
- Une variable `{{motifs}}` du modèle Word doit correspondre au champ technique `motifs`.

**Historique**

- `GET /documents-generes` renvoie, du plus récent au plus ancien : `{ id, documentTypeId, documentTypeCode, documentTypeNom, missionId, missionNumero, missionIntitule, nomFichier, taille, templateVersion, dateGeneration, valeurs }[]`.
- `valeurs` contient les données saisies, ce qui permet d'afficher le récapitulatif d'un ancien document.
- Les filtres `documentTypeId` et `missionId` sont facultatifs et combinables.

**Statistiques** (`GET /statistiques`)

- Missions : `nombreMissions`, `missionsEnCours`, `missionsAVenir`, `missionsTerminees` (calculés à partir des dates de la mission).
- Types : `nombreTypesDocuments`, `nombreTypesActifs`.
- Documents : `nombreDocumentsGeneres`, `documentsParType` (`[{ documentTypeId, code, nom, nombre }]`, triés par nombre décroissant), `documentsParMois` (`[{ mois: 'aaaa-mm', nombre }]` sur les 12 derniers mois, mois vides inclus) et `derniersDocuments` (les 5 plus récents, au même format que l'historique).

**Avancement des missions** (`GET /statistiques/avancement`)

- Une entrée par mission : `{ missionId, missionNumero, missionIntitule, documentsCompletes, documentsAttendus, pourcentage, tdr, programme, tests, constats, rapport, pvAffirmation, pvCloture }`.
- `documentsAttendus` vaut 7. Chaque booléen indique si le document métier correspondant existe pour la mission.

**Paramètres** (`GET /parametres`)

- Configuration réelle, en lecture seule : `nomApplication`, `dossierModeles`, `dossierDocumentsGeneres`, `tailleMaxFichier`, `formatsModeles`, `formatsGeneration`, `syntaxeVariables`, `typesChamps` et `rolesMission`.

**Missions**

- Création et modification : `{ intitule, objet, dateDebut, dateFin, dateSignature, structureId, personnes: [{ personneId, roles }] }`.
- Réponse : la mission, avec `id`, `numero`, `structureNom` et `personnes[]`.
- Supprimer une mission conserve ses documents générés dans l'historique, sans mission associée.
- Rôles de mission (valeurs fixes) : `DIRECTEUR_AUDIT_INTERNE`, `CHEF_MISSION`, `SUPERVISEUR`, `AUDITEUR`, `POINT_FOCAL`.

**Erreurs**

Toutes les erreurs ont le même format JSON : `{ status, message, timestamp }`. Le `message` est en français et peut être affiché tel quel dans un toast.

| Code | Cas |
|---|---|
| 400 | Validation ou règle métier (champ obligatoire, valeur invalide, JSON mal formé, type désactivé, modèle absent) |
| 404 | Ressource introuvable |
| 409 | Doublon (« existe déjà ») ou suppression impossible car l'élément est lié à d'autres données |
| 413 | Fichier trop volumineux (plus de 10 Mo) |
| 500 | Erreur technique côté serveur |

---

## 3. Étapes de réalisation

### Étape 0 — Prérequis backend

- [x] Autoriser des modèles Word jusqu'à 10 Mo (`spring.servlet.multipart.max-file-size=10MB`), pour s'aligner sur `app-file-upload`.
- [x] Ajouter les API manquantes : modification, statut et suppression des types de documents ; historique ; statistiques ; paramètres.
- [x] Codes HTTP corrects (400, 404, 409, 413, 500) et format d'erreur JSON unique.

### Étape 0 bis — Problèmes backend trouvés et corrigés

Ces problèmes ont été découverts en préparant le front. Ils sont tous corrigés et vérifiés sur le backend en fonctionnement.

- [x] **Le formulaire d'un type sans modèle ou désactivé était inaccessible.**
  - Problème : `GET /document-types/{id}/form` renvoyait une erreur quand le type n'avait pas encore de modèle Word ou était désactivé.
  - Impact : on n'aurait jamais pu ouvrir la configuration d'un type qu'on vient de créer (étape 9), alors que c'est précisément là qu'on téléverse son modèle.
  - Correction : l'endpoint renvoie maintenant `template: null` quand il n'y a pas de modèle, et accepte les types désactivés. La génération, elle, refuse toujours un type désactivé ou sans modèle (erreur 400).
  - Fichier : `GetDocumentTypeFormService.java`.
- [x] **Un message d'erreur exposait le chemin complet d'un fichier sur le serveur.**
  - Problème : « Le fichier template est introuvable : D:\…\storage\templates\….docx » révélait l'arborescence du serveur au client.
  - Correction : le message n'affiche plus que le nom du fichier.
  - Fichier : `ValidateDocumentTemplateVariablesService.java`.
- [x] **Les modèles Word étaient introuvables après le déplacement du projet.**
  - Problème : le backend enregistrait le chemin absolu des fichiers. Après le déplacement du projet dans `Audit document`, la validation et la génération échouaient pour les deux types existants.
  - Correction : le composant `DocumentStorage` retrouve les fichiers à partir du dossier configuré. Le chemin absolu ne sert plus que de secours.
- [x] **Toutes les erreurs renvoyaient 404.**
  - Problème : « champ obligatoire », « existe déjà » et « introuvable » donnaient le même code, en texte brut.
  - Correction : les exceptions `ResourceNotFoundException` et `ConflictException` ont été créées, et les 156 `throw` reclassés selon leur sens. Les erreurs sont maintenant en JSON (voir « Erreurs » en section 2).

### Étape 1 — Socle HTTP et modèles

- [ ] `app.config.ts` : ajouter `provideHttpClient()`.
- [ ] `core/http/api.config.ts` : définir la constante `API_BASE_URL`.
- [ ] `core/http/api-error.ts` : écrire une fonction qui extrait le `message` d'une `HttpErrorResponse`, que le corps soit déjà du JSON ou un `Blob` (erreur pendant un téléchargement). Si le backend est injoignable (`status === 0`), afficher « Le serveur est injoignable ».
- [ ] `core/http/file-download.ts` : lire le nom du fichier dans `Content-Disposition` et déclencher l'enregistrement d'un `Blob`. Cette fonction sert à la génération et à l'historique.
- [ ] Créer les modèles TypeScript calqués sur les DTO :
  - `features/document-types/models/` : `DocumentType`, `DocumentField`, `DocumentTemplate`, `DocumentTypeForm`, `TemplateValidation`, `DocumentFieldType` ;
  - `features/document-history/models/` : `GeneratedDocument` ;
  - `features/missions/models/` : `Mission`, `MissionPersonne`, `MissionRole`, `Personne`, `Structure` ;
  - `features/statistics/models/` : `Statistics` ;
  - `features/settings/models/` : `AppSettings`.
- [ ] Aligner `shared/interfaces/dynamic-field.interface.ts` sur les types du backend (`TEXT | TEXTAREA | DATE | NUMBER | BOOLEAN`). `BOOLEAN` s'affiche avec `app-checkbox-field`. `EMAIL` est supprimé définitivement, car il n'est pas nécessaire. `SELECT` est retiré tant que le backend ne le gère pas.
- **Validation :** `npm run build` passe.

### Étape 2 — Layout et navigation

- [ ] Sidebar dans l'ordre : Tableau de bord · Missions d'audit · Documents d'audit · Historique des documents · Types de documents · Templates et champs · Statistiques · Paramètres.
- [ ] Header : retirer « Admin » et l'avatar, puisqu'il n'y a ni utilisateur ni rôle, et garder le logo et le titre.
- [ ] Routes en lazy loading : `/dashboard`, `/missions`, `/documents`, `/documents/generer/:documentTypeId`, `/document-history`, `/document-types`, `/document-types/:id`, `/templates`, `/statistics`, `/settings`.
- [ ] Layout responsive : sidebar repliable sur petit écran.
- **Validation :** chaque lien mène à une page existante, sans redirection inattendue.

### Étape 3 — Catalogue des documents (`/documents`)

- [ ] `DocumentTypeService.getAll()` → `GET /document-types`.
- [ ] Page catalogue :
  - cartes `app-card` (nom, description, code) et bouton « Créer un document » ;
  - seuls les types `actif` sont affichés ;
  - recherche par nom ou code avec `app-search-input` ;
  - états `app-loading`, erreur et `app-empty-state`.
- [ ] Supprimer les données de démonstration « Fiche de suivi » de `DocumentGenerateComponent`.
- **Validation :** créer 2 ou 3 types via l'API, puis vérifier qu'ils apparaissent tous et que la recherche fonctionne.

### Étape 4 — Chargement du formulaire (`/documents/generer/:documentTypeId`)

- [ ] `DocumentTypeService.getForm(id)` → `GET /document-types/{id}/form`.
- [ ] Convertir les `DocumentField` en `DynamicField`, triés par `ordre`.
- [ ] Liste déroulante facultative « Mission associée » (`GET /missions`), envoyée en `?missionId=`.
- [ ] Cas particuliers :
  - pas de modèle (`template === null`) : message « Aucun modèle Word, configurez ce type » avec un lien vers sa configuration ;
  - aucun champ : état vide ;
  - type introuvable ou désactivé : erreur et retour au catalogue.
- **Validation :** les champs s'affichent dans le bon ordre, avec le bon composant pour chaque type.

### Étape 5 — Formulaire dynamique

- [ ] `DynamicFormComponent` :
  - ajouter un input `loading` qui désactive le bouton pendant le traitement ;
  - ajouter un input `initialValues` pour garder la saisie au retour depuis le récapitulatif ou après une erreur ;
  - gérer le type `NUMBER` ;
  - valider les champs obligatoires et le format des nombres ;
  - afficher les erreurs sous chaque champ.
- **Validation :** soumettre un formulaire vide affiche les erreurs, et les valeurs saisies sont conservées.

### Étape 6 — Récapitulatif

- [ ] Après validation du formulaire, afficher `app-document-preview` avec le titre « Récapitulatif des informations » : c'est un résumé des données, pas un aperçu du fichier Word. La mission choisie y figure si elle est renseignée.
- [ ] Boutons « Modifier » (retour au formulaire, valeurs conservées) et « Générer le document ».
- **Validation :** l'aller-retour formulaire ↔ récapitulatif ne perd aucune valeur.

### Étape 7 — Génération et téléchargement

- [ ] `DocumentGenerationService.generate(typeId, values, missionId?)` → `POST /document-types/{id}/generate`, avec `responseType: 'blob'` et `observe: 'response'`.
- [ ] Lire le nom du fichier (`Content-Disposition`) et l'identifiant d'historique (`X-Document-Id`).
- [ ] Pendant la génération : afficher le chargement et empêcher le double clic.
- [ ] En cas d'erreur : lire le message contenu dans le blob, afficher un toast et revenir au formulaire avec les valeurs.
- [ ] Écran de succès : message, nom du document, et boutons « Télécharger », « Voir dans l'historique », « Retour aux documents » et « Créer un autre document ».
- [ ] Format : uniquement DOCX, puisque le PDF n'est pas pris en charge par le backend.
- **Validation :** le fichier téléchargé s'ouvre dans Word, les variables sont remplacées, et le document apparaît dans l'historique.

### Étape 8 — Types de documents (`/document-types`)

- [ ] Ajouter une colonne d'actions à `app-data-table`. C'est le seul ajout générique nécessaire, et il servira aussi pour les missions, les champs et l'historique.
- [ ] Tableau des types : nom, code, description, statut (`app-status-badge`) et date de création.
- [ ] Bouton « Créer un type » : formulaire (code, nom, description) dans `app-modal` → `POST /document-types`. Après création, rediriger vers sa configuration.
- [ ] Actions par ligne :
  - « Configurer » : ouvre `/document-types/:id` ;
  - « Modifier » : modale pré-remplie → `PUT /document-types/{id}` ;
  - « Activer » / « Désactiver » → `PATCH /document-types/{id}/statut` ;
  - « Supprimer », avec confirmation → `DELETE /document-types/{id}`. Si le type a déjà servi, afficher le message du backend, qui propose de le désactiver.
- **Validation :** un type créé apparaît dans la liste et dans le catalogue. Un type désactivé disparaît du catalogue.

### Étape 9 — Configuration d'un type (`/document-types/:id`)

Page unique en 4 sections, chargées à partir de `GET /document-types/{id}/form` :

- [ ] **Informations :** code, nom, description et statut, avec un bouton « Modifier » qui réutilise la modale de l'étape 8.
- [ ] **Modèle Word :**
  - afficher le modèle actif (nom du fichier, version, date, taille) ;
  - téléverser ou remplacer le fichier avec `app-file-upload` (`.docx`, 10 Mo) → `POST /document-types/{id}/template`.
- [ ] **Champs :**
  - tableau des champs (ordre, nom technique, libellé, type, obligatoire) ;
  - ajout et modification dans une modale → `POST /document-fields` et `PUT /document-fields/{id}` ;
  - suppression avec confirmation → `DELETE /document-fields/{id}` ;
  - type choisi dans une liste limitée à `TEXT / TEXTAREA / DATE / NUMBER / BOOLEAN` ;
  - nom technique contrôlé (`[A-Za-z0-9_]+`, le même motif que les variables `{{ }}` du modèle).
- [ ] **Vérification :** bouton « Vérifier le modèle » → `GET .../template/validate-variables`. Afficher les variables détectées, les champs absents du modèle, les variables inconnues et un statut valide ou invalide.
- [ ] **Tester :** bouton « Tester la génération » qui ouvre `/documents/generer/:id`.
- **Validation :** créer un type, téléverser un modèle, ajouter les champs, obtenir un statut valide, puis générer le document.

### Étape 10 — Templates et champs (`/templates`)

- [ ] Vue d'ensemble de tous les types : présence d'un modèle (nom et version), nombre de champs et statut de vérification. Chaque ligne a une action « Configurer » vers `/document-types/:id`, qui réutilise la page de l'étape 9 sans la dupliquer.
- [ ] ⛔ Il n'existe pas d'API qui liste les anciennes versions d'un modèle. On n'affiche que le modèle actif de chaque type.
- **Validation :** l'état affiché correspond à ce qui est configuré.

### Étape 11 — Historique des documents (`/document-history`)

- [ ] `DocumentHistoryService` → `GET /documents-generes`, `GET /documents-generes/{id}`, `GET /documents-generes/{id}/download` et `DELETE /documents-generes/{id}`.
- [ ] Tableau : nom du fichier, type, mission, date de génération et taille.
- [ ] Filtres par type de document et par mission (paramètres de l'API), plus une recherche locale sur le nom du fichier.
- [ ] Actions par ligne :
  - « Détails » : modale avec le récapitulatif des `valeurs` saisies (réutilise `app-document-preview`) ;
  - « Télécharger » ;
  - « Supprimer », avec confirmation.
- **Validation :** un document généré à l'étape 7 apparaît en tête de liste et se retélécharge à l'identique.

### Étape 12 — Missions d'audit (`/missions`)

- [ ] `MissionService`, `PersonneService` et `StructureService` connectés aux API existantes.
- [ ] **Liste :** tableau (numéro, intitulé, structure, dates), recherche, et suppression avec confirmation.
- [ ] **Création et modification** (`/missions/nouvelle`, `/missions/:id/modifier`) :
  - champs : intitulé, objet, dates et structure (liste déroulante) ;
  - équipe : ajout de personnes avec un rôle parmi les 5 valeurs fixes ;
  - les représentants de l'entité auditée sont ajoutés comme `POINT_FOCAL`.
- [ ] Création rapide dans une modale (décidé le 19/10/2026), sans page de référentiel séparée :
  - à côté de la liste des structures, un bouton « + » ouvre une modale (nom, description) → `POST /structures`, puis la nouvelle structure est sélectionnée automatiquement ;
  - à côté de la liste des personnes, un bouton « + » ouvre une modale (nom, prénom, matricule, fonction, service) → `POST /personnes`, puis la nouvelle personne est ajoutée à l'équipe.
- [ ] **Détail** (`/missions/:id`) : informations, équipe groupée par rôle, et documents générés pour cette mission (`GET /documents-generes?missionId=`).
- [ ] Listes de personnes selon les formulaires : source `/mission-personnes/mission/{id}` filtrée par rôle, en envoyant `personneId` ou `missionPersonneId` selon le formulaire (règle décidée le 19/10/2026).
- **Validation :** créer une mission avec son équipe, la modifier, générer un document lié, puis supprimer la mission (le document reste dans l'historique).

### Étape 13 — Tableau de bord (`/dashboard`)

- [ ] Source unique : `GET /statistiques`.
- [ ] Indicateurs avec des tuiles : missions (en cours, à venir, terminées), documents générés et types actifs.
- [ ] Derniers documents générés (`derniersDocuments`), avec un lien vers l'historique.
- [ ] Avancement des missions (`GET /statistiques/avancement`) : une barre de progression par mission, avec le détail des 7 documents.
- [ ] Liens rapides vers « Créer un document » et « Nouvelle mission ».
- **Validation :** les chiffres correspondent à la base.

### Étape 14 — Statistiques (`/statistics`)

- [ ] Source : `GET /statistiques`.
- [ ] Graphiques : documents générés par mois (12 derniers mois) et documents par type ; répartition des missions par état.
- [ ] Choisir une approche sans dépendance lourde (SVG simple) ou ajouter une bibliothèque de graphiques. À décider au début de l'étape.
- **Validation :** les graphiques correspondent aux chiffres de l'API, y compris quand il n'y a encore aucun document (état vide).

### Étape 15 — Paramètres (`/settings`)

- [ ] Source : `GET /parametres`, en lecture seule.
- [ ] Afficher les informations générales, les paramètres de génération (formats, taille maximale, syntaxe `{{nomDuChamp}}`), les types de champs et les rôles de mission.
- [ ] Aucun paramètre modifiable : le backend n'en expose pas.
- **Validation :** les valeurs affichées correspondent à `application.properties`.

### Étape 16 — Recette complète

- [ ] Parcours A : un type existant → formulaire → récapitulatif → génération → téléchargement → historique, testé sur au moins 3 types différents.
- [ ] Parcours B : nouveau type → modèle → champs → vérification → apparition dans le catalogue → génération → désactivation → disparition du catalogue.
- [ ] Parcours C : création d'une mission avec son équipe, puis génération d'un document lié.
- [ ] Responsive (téléphone, tablette, bureau), erreurs API (backend arrêté) et états vides.

---

## 4. Dépendances backend restantes

| Fonctionnalité | Ce qui manque côté backend |
|---|---|
| Réordonner les champs | Le `PUT` d'un champ n'accepte pas `ordre` |
| Liste déroulante (`SELECT`) dans les formulaires dynamiques | Un type `SELECT` et une liste d'options sur `DocumentField` |
| Anciennes versions d'un modèle Word | Un endpoint qui liste les modèles d'un type (`DocumentTemplate`) |
| Paramètres modifiables | Une table de paramètres et un endpoint de mise à jour |
| PDF | Conversion DOCX → PDF |

## 5. Hors périmètre pour l'instant

Les documents métier qui ont leurs propres API (TDR, réunions, interviews, déclarations d'indépendance, programme de travail, tests, constats, PV d'affirmation, rapport et tableau des recommandations) ne font pas partie des objectifs actuels. Ils pourront être rattachés plus tard à la page de détail d'une mission.

---

## 6. Journal d'avancement

| Date | Étape | Statut | Notes |
|---|---|---|---|
| 19/10/2026 | Backend | Fait | Ajout de `/api/rapports`, du CORS global, de l'endpoint de génération DOCX et de la validation des rôles de mission |
| 19/10/2026 | Étape 0 | Fait | Upload jusqu'à 10 Mo ; ajout de la gestion des types (modification, statut, suppression), de l'historique, des statistiques et des paramètres ; noms de méthodes et commentaires du back passés en anglais |
| 19/10/2026 | Étape 0 | Fait | Codes HTTP d'erreur corrects et format JSON unique ; `/form` accessible sans modèle ; fichiers retrouvés même après déplacement du projet |
