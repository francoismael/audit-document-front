# Feuille de route du front — Application de documents d'audit interne (MEF / DAI)

Ce fichier suit la réalisation du front, étape par étape. On ne passe à l'étape suivante qu'une fois la précédente compilée (`npm run build`), testée dans le navigateur et cochée ici.

Légende : `[ ]` à faire · `[~]` en cours · `[x]` terminé · ⛔ bloqué par le backend

---

## 1. Objectifs

Application Angular qui permet de :

- consulter le catalogue des types de documents et générer un document **PDF** à partir d'un modèle Word (le modèle reste un `.docx` avec des variables `{{…}}`, le document produit est un PDF) ;
- créer, modifier, activer ou désactiver et supprimer des types de documents (modèle DOCX et champs dynamiques) sans modifier le code Angular ;
- consulter l'historique des documents générés et les retélécharger ;
- gérer les missions d'audit et, pour chaque mission, ses documents métier : TDR, déclarations d'indépendance, PV de réunion d'ouverture et de clôture, fiches d'interview, programme de travail, fiches de test, fiches de constats, PV d'affirmation, rapport d'audit et tableau des recommandations ;
- consulter un tableau de bord, des statistiques et les paramètres de l'application, alimentés par les API.

**Ordre de réalisation** (décidé le 20/10/2026) : terminer d'abord le parcours de génération et les écrans de gestion génériques (étapes 6 à 10), dont les briques (tableau à actions, modales, confirmation, listes éditables) seront réutilisées partout ; puis les missions (étape 11) et les 11 documents métier, un par étape (12 à 22) ; enfin le tableau de bord, les statistiques et les paramètres, qui résument tout le reste (23 à 26).

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
- Réponse actuelle : un fichier `.docx` (blob). **Décidé le 20/10/2026 : la réponse devient un PDF** (`application/pdf`, nom en `.pdf`), voir l'étape 7. Le nom du fichier figure dans l'en-tête `Content-Disposition`, et l'identifiant de l'entrée d'historique dans `X-Document-Id`.
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

- [x] `app.config.ts` : ajouter `provideHttpClient()`.
- [x] `core/http/api.config.ts` : définir la constante `API_BASE_URL`.
- [x] `core/http/api-error.ts` : `readApiErrorMessage(error)` extrait le `message` d'une `HttpErrorResponse`, que le corps soit déjà du JSON ou un `Blob` (erreur pendant un téléchargement). Si le backend est injoignable (`status === 0`), elle renvoie « Le serveur est injoignable ». La fonction est asynchrone, puisqu'un `Blob` se lit de façon asynchrone.
- [x] `core/http/file-download.ts` : `readFileName(response)` lit le nom du fichier dans `Content-Disposition`, et `saveFile(blob, fileName)` déclenche l'enregistrement. Ces fonctions servent à la génération et à l'historique.
- [x] Créer les modèles TypeScript calqués sur les DTO :
  - `features/document-types/models/` : `DocumentType`, `DocumentTypeRequest`, `DocumentTypeForm`, `DocumentField`, `DocumentFieldRequest`, `DocumentTemplate`, `TemplateValidation`. Le type d'un champ réutilise `DynamicFieldType` (`shared/interfaces`), pour ne pas dupliquer la liste des types ;
  - `features/document-history/models/` : `GeneratedDocument` ;
  - `features/missions/models/` : `Mission`, `MissionRequest`, `CreatedMission` (le `POST /missions` renvoie l'entité brute, avec `structure` imbriquée et sans `personnes`), `MissionPersonne`, `MissionRole`, `Personne`, `Structure` ;
  - `features/statistics/models/` : `Statistics`, `MissionProgress` ;
  - `features/settings/models/` : `AppSettings`.
- [x] Aligner `shared/interfaces/dynamic-field.interface.ts` sur les types du backend (`TEXT | TEXTAREA | DATE | NUMBER | BOOLEAN`). `BOOLEAN` s'affiche avec `app-checkbox-field`. `EMAIL` est supprimé définitivement, car il n'est pas nécessaire. `SELECT` est retiré tant que le backend ne le gère pas (`dynamic-form` et `document-preview` mis à jour).
- **Validation :** `npm run build` passe, la vérification TypeScript stricte des nouveaux fichiers passe, et les 25 tests unitaires passent.

### Étape 2 — Layout et navigation

- [x] Sidebar dans l'ordre : Tableau de bord · Missions d'audit · Documents d'audit · Historique des documents · Types de documents · Templates et champs · Statistiques · Paramètres.
- [x] Header : retirer « Admin » et l'avatar, puisqu'il n'y a ni utilisateur ni rôle, et garder le logo et le titre.
- [x] Routes en lazy loading : `/dashboard`, `/missions`, `/documents`, `/documents/generer/:documentTypeId`, `/document-history`, `/document-types`, `/document-types/:id`, `/templates`, `/statistics`, `/settings`. Chaque route a un titre d'onglet (« Missions d'audit · Audit documentaire MEF »).
- [x] Layout responsive : sous 992 px (`$breakpoint-tablet`), la sidebar est masquée et s'ouvre avec le bouton menu du header. Elle se ferme au clic sur un lien, sur le fond assombri ou avec la touche Échap.
- [x] Pages pas encore développées : une page provisoire (titre et « Page en préparation »), générée avec Angular CLI et remplacée à son étape.
- **Validation :** build OK, 36 tests unitaires OK (dont l'ouverture et la fermeture du menu), captures vérifiées en largeur bureau (1366 px) et tablette (600 px).

### Étape 3 — Catalogue des documents (`/documents`)

- [x] `DocumentTypeService.getAll()` → `GET /document-types` (`features/document-types/services/`).
- [x] Page catalogue :
  - cartes `app-card` (nom, description, code) et bouton « Créer un document » qui ouvre `/documents/generer/:id` ;
  - seuls les types `actif` sont affichés ;
  - recherche par nom ou code avec `app-search-input`, sans tenir compte des majuscules ni des accents, avec un compteur (« 2 types de documents », « 1 résultat sur 2 ») ;
  - états `app-loading`, erreur avec bouton « Réessayer » et message de l'API, catalogue vide avec lien vers les types de documents, aucun résultat de recherche.
- [x] Retrait des données de démonstration « Fiche de suivi » : **déplacé à l'étape 4**, où elles sont remplacées par le chargement réel des champs (sinon la page de génération resterait vide entre les deux étapes).
- **Validation :** 42 tests unitaires OK (service et page). Le catalogue a été vérifié avec le backend réel (les 2 types de la base s'affichent), puis backend arrêté (message « Le serveur est injoignable » et bouton « Réessayer »).

### Étape 4 — Chargement du formulaire (`/documents/generer/:documentTypeId`)

- [x] `DocumentTypeService.getForm(id)` → `GET /document-types/{id}/form`.
- [x] Supprimer les données de démonstration « Fiche de suivi » de `DocumentGenerateComponent` (reporté de l'étape 3).
- [x] Convertir les `DocumentField` en `DynamicField`, triés par `ordre` (`features/documents/models/dynamic-field.mapper.ts`).
- [x] Le paramètre `:documentTypeId` arrive comme `input()` du composant (`withComponentInputBinding()` dans `app.config.ts`). Changer d'identifiant dans l'URL recharge le formulaire.
- [x] Liste déroulante facultative « Mission associée » (`MissionService.getAll()` → `GET /missions`). Le choix est gardé dans le signal `missionId`, qui sera envoyé en `?missionId=` à l'étape 7. Si les missions ne se chargent pas, un toast prévient, mais le formulaire reste utilisable.
- [x] Cas particuliers :
  - pas de modèle (`template === null`) : « Aucun modèle Word », avec un bouton « Configurer ce type » ;
  - aucun champ : « Aucun champ configuré », avec un bouton « Configurer ce type » ;
  - type introuvable (message de l'API), identifiant invalide ou type désactivé : « Document indisponible », avec un bouton « Retour au catalogue ».
- [x] Ajouts génériques : `allowEmpty` sur `app-select-field` (pouvoir revenir à « Aucune mission ») et un emplacement `<ng-content />` dans `app-dynamic-form` (pour insérer un contenu avant les champs).
- [x] Page responsive : sous 992 px, le bandeau du ministère passe au-dessus du formulaire.
- **Validation :** 50 tests unitaires OK (ordre des champs, bon composant par type, missions, sans modèle, sans champ, désactivé, identifiant invalide, 404). Vérifié avec le backend réel : le type 1 affiche ses 4 vrais champs dans l'ordre, et `/documents/generer/999` affiche « Type de document introuvable ».

### Étape 5 — Formulaire dynamique

- [x] `DynamicFormComponent` :
  - input `loading` : boutons et champs désactivés, libellé « Traitement en cours... » (personnalisable avec `loadingLabel`), soumission ignorée pendant le traitement ;
  - input `initialValues` : le formulaire est pré-rempli (`linkedSignal`), ce qui permet de garder la saisie au retour depuis l'aperçu ou après une erreur ;
  - type `NUMBER` : champ numérique, et une valeur non numérique donne « Veuillez saisir un nombre valide. » ;
  - champs obligatoires : « Ce champ est obligatoire. », affiché seulement après une tentative de soumission, sous chaque champ, avec le focus placé sur le premier champ en erreur ;
  - « Réinitialiser » vide les valeurs et les erreurs.
- [x] **Bug corrigé sur les champs `BOOLEAN`** : une case non cochée n'était jamais envoyée, ce qui provoquait l'erreur backend « Le champ … est obligatoire ». À l'inverse, le front exigeait de cocher une case obligatoire. Une case vaut désormais toujours `true` ou `false`, et « Non » est une réponse valable.
- [x] Page de génération : « Modifier » depuis l'aperçu ramène au formulaire **rempli** (signal `values` séparé du signal `previewing`).
- **Validation :** 58 tests unitaires OK, dont 8 pour le formulaire dynamique et 1 pour le retour depuis l'aperçu.

### Étape 6 — Récapitulatif

- [x] Le bouton du formulaire devient « Vérifier les informations ». Il mène au récapitulatif `app-document-preview`, titré « Récapitulatif des informations » avec la mention « Ce récapitulatif n'est pas un aperçu du document PDF final ».
- [x] La première ligne du récapitulatif est « Mission associée » (la mission choisie, ou « Aucune »), via le nouvel input générique `extraRows` de `app-document-preview`.
- [x] Boutons « Modifier » (retour au formulaire, valeurs et mission conservées) et « Générer le document » (branché à l'étape 7).
- [x] Méthodes renommées selon leur action : `onReview()`, `onEdit()`, `onConfirmGeneration()`, signal `reviewing`.
- [x] **Deux bugs trouvés pendant la vérification dans le navigateur et corrigés :**
  - au retour du récapitulatif, la liste des missions affichait « Aucune mission » alors que la mission restait mémorisée (et aurait été envoyée). `app-select-field` marque maintenant l'option choisie avec `[selected]` ;
  - `id="…"` en attribut statique sur un composant de champ créait deux éléments avec le même id et cassait le lien `<label for>` (page de génération, catalogue et `filter-bar`). Remplacé par `[id]="'…'"`, règle ajoutée au `CLAUDE.md`.
- **Validation :** 61 tests unitaires OK. Parcours vérifié dans Chrome piloté par script, avec le backend réel : erreurs de validation, saisie, choix d'une mission, récapitulatif, retour par « Modifier » avec toutes les valeurs et la mission conservées, aucun id en double.

### Étape 7 — Génération et téléchargement du PDF

Décidé le 20/10/2026 : **le document généré est un PDF**, pas un fichier Word. Les modèles restent des `.docx` avec leurs variables `{{…}}` : le backend remplit le modèle comme aujourd'hui, puis le convertit en PDF.

#### 7.0 — Backend : conversion DOCX → PDF

- [x] **Outil de conversion choisi le 20/10/2026 : LibreOffice en mode headless** (`soffice --headless --convert-to pdf`). Comparatif fait sur `Document.docx` :

  | Outil | Rendu sur `Document.docx` | Installation |
  |---|---|---|
  | XDocReport 2.0.6 (bibliothèque Java, POI + iText) | Fidèle sur un modèle simple, **nettement dégradé** sur le document complet : 18 pages au lieu de 14, logo écrasé, blocs flottants mal placés, sauts de page décalés | Aucune (dépendances Maven) |
  | LibreOffice en mode headless (`soffice --convert-to pdf`) | Très proche de Word | LibreOffice à installer sur chaque poste et sur le serveur |
  | Microsoft Word (documents4j) | Identique à Word (référence) | Windows et Word sur le serveur : inadapté à un serveur |

- [x] LibreOffice 26.8 installé sur le poste de développement le 20/10/2026 (`C:\Program Files\LibreOffice\program\soffice.exe`). Vérifications faites avant l'étape 7 :
  - `Document.docx` : **15 pages contre 14 pour Word**, mêmes pages dans le même ordre, logos, tableaux et pages de garde fidèles. La page en trop est une page blanche après la lettre de déclaration (saut de page suivi d'un saut de section, que Word fusionne). À surveiller sur les modèles réels ;
  - aucun texte perdu (seules les espaces insécables sont conservées différemment) ;
  - un document rempli par le backend (retour à la ligne, date jj/mm/aaaa, case Oui/Non, en-tête, tableau) se convertit correctement ;
  - durée : environ **15 s au premier appel** (initialisation de LibreOffice), puis **3 s** pour un modèle simple et **6 s** pour `Document.docx`. Le front doit donc afficher un chargement explicite et ne pas couper la requête trop tôt.
- [x] Configuration dans `application.properties` : `app.pdf.soffice-path` (chemin de `soffice`, à adapter sur le serveur), `app.pdf.profile-dir` (profil LibreOffice dédié, `-env:UserInstallation`) et `app.pdf.timeout-seconds` (120 s).
- [x] Interface `application/port/PdfConverter` et implémentation `infrastructure/pdf/LibreOfficePdfConverter` : dossier de travail temporaire, conversions faites une par une, délai maximal, journal de LibreOffice en cas d'échec, message clair (« La conversion du document en PDF a échoué. »).
- [x] `GenerateDocumentService` : remplit le modèle `.docx`, le convertit en PDF, enregistre le PDF dans l'historique.
- [x] Réponse de `POST /document-types/{id}/generate` : `Content-Type: application/pdf`, nom en `.pdf` dans `Content-Disposition`, `X-Document-Id` inchangé (`FileResponses`, ex-`DocxResponses`).
- [x] Historique : `GET /documents-generes/{id}/download` renvoie le PDF ; les anciens documents `.docx` gardent leur type (`GeneratedDocument.contentTypeOf()`).
- [x] `GET /parametres` : `formatsGeneration` vaut `PDF`.
- [x] Bug corrigé au passage : le téléversement d'un modèle ne fermait pas son flux de lecture, et Tomcat ne pouvait pas supprimer son fichier temporaire.
- [x] **Vérifié avec `curl`** sur une instance de test (port 8081) avec un vrai modèle (logo, tableau, variables) : PDF valide, logo, accents, retour à la ligne, date jj/mm/aaaa, case « Non » et pied de page remplacés ; 21 s au premier appel puis 4,6 s ; mission enregistrée dans l'historique ; retéléchargement identique ; erreur 400 claire si un champ obligatoire manque. Données de test supprimées.
- [x] Reporté le 20/10/2026 dans `d:ismaelStagelivrableprojectaudit-document-spring` (copie choisie par l'utilisateur) : mêmes fichiers, `DocxResponses` supprimé, réglages PDF ajoutés à `application.properties` (base `audit_interne` conservée), `CLAUDE.md` mis à jour. Compilation OK, démarrage OK (sécurité intacte : 401 sans token).

#### 7.1 — Front : génération et téléchargement

- [x] `DocumentGenerationService.generate(typeId, values, missionId)` → `POST /document-types/{id}/generate`, avec `responseType: 'blob'` et `observe: 'response'` ; `missionId` envoyé seulement si une mission est choisie.
- [x] Lecture du nom du fichier (`Content-Disposition`) et de l'identifiant d'historique (`X-Document-Id`) dans `GeneratedFile`.
- [x] Pendant la génération : indicateur « Génération du PDF en cours… Cela peut prendre jusqu'à une vingtaine de secondes la première fois. », boutons désactivés (pas de double clic).
- [x] En cas d'erreur : message de l'API lu dans le blob, toast d'erreur, retour au récapitulatif avec toutes les valeurs.
- [x] Écran de succès « Document généré » : nom du PDF et boutons « Ouvrir le PDF » (nouvel onglet, `openFile()` dans `core/http/file-download.ts`), « Télécharger », « Voir dans l'historique », « Retour aux documents » et « Créer un autre document ».
- [x] 66 tests unitaires OK (service et page : succès, erreur, boutons bloqués, nouveau document).
- [x] Validation : faite avec `curl` sur le backend réel et par les tests unitaires du front (décision du 20/10/2026). La vérification dans le navigateur n'a pas pu être faite sur le poste de développement : le « Web Shield » d'Avast intercepte les téléchargements de PDF de `localhost` (requête rejouée, réponse vide). Pour l'éviter : exception Avast pour `http://localhost:*`. **À revérifier au déploiement**, sur les postes utilisateurs équipés d'Avast.
- **Validation :** le PDF s'ouvre dans le navigateur, les variables sont remplacées, la mise en page du modèle est respectée, et le document apparaît dans l'historique.

### Étape 8 — Types de documents (`/document-types`)

Cette étape crée les briques réutilisées par tous les écrans de gestion qui suivent.

- [x] **Cellules personnalisées dans `app-data-table`** : directive `appDataTableCell` (`shared/components/data-table/data-table-cell.directive.ts`). Une page fournit un gabarit pour une colonne (`<ng-template appDataTableCell="actif" let-row>…</ng-template>`) ; les autres colonnes restent en texte. Sert ici au statut et aux actions, et servira à tous les tableaux suivants.
- [x] Correction du tableau partagé : `overflow-wrap: break-word` au lieu de `anywhere`, pour que les dates et les codes ne soient plus coupés au milieu.
- [x] `app-status-badge` : input facultatif `label` pour remplacer le libellé en gardant les couleurs (« Actif » / « Inactif »).
- [x] **Formulaire dans `app-modal`** : `DocumentTypeFormModalComponent` (`features/document-types/components/`), utilisé pour la création et la modification. Il se réinitialise à chaque ouverture (`linkedSignal`) et valide les champs : code obligatoire (lettres, chiffres, `_`, `-`, 100 caractères maximum), nom obligatoire (255 caractères maximum). Les valeurs sont nettoyées, et une description vide est envoyée comme `null`.
- [x] **Confirmation avant suppression** avec `app-modal` (`confirmVariant="danger"`), qui rappelle qu'un type déjà utilisé ne peut pas être supprimé.
- [x] `DocumentTypeService` : `create()`, `update()`, `changeStatus()`, `delete()`.
- [x] Tableau des types : nom, code, description, statut (badge), date de création (jj/mm/aaaa) et actions. États chargement, erreur avec « Réessayer », et liste vide avec « Créer un type de document ».
- [x] Bouton « Créer un type de document » → `POST /document-types`, puis redirection vers sa configuration (`/document-types/:id`).
- [x] Actions par ligne :
  - « Configurer » : ouvre `/document-types/:id` ;
  - « Modifier » : modale pré-remplie → `PUT /document-types/{id}` ;
  - « Activer » / « Désactiver » → `PATCH /document-types/{id}/statut`, avec un message qui précise l'effet sur le catalogue ;
  - « Supprimer », avec confirmation → `DELETE /document-types/{id}`. Si le type a déjà servi, le message du backend (409) s'affiche et le type reste dans la liste.
- **Validation :** 80 tests unitaires OK. Parcours vérifié dans Chrome avec le backend réel : erreurs de validation, création (code mis en majuscules, accents corrects) puis redirection vers la configuration, modification, désactivation, suppression ; affichage vérifié sur ordinateur et tablette ; type de test supprimé.

### Étape 9 — Configuration d'un type (`/document-types/:id`)

Affichée dans un **tiroir qui glisse depuis la droite par-dessus la liste** (route enfant de `/document-types`), et non dans une page séparée. Onglets Détails / Champs / Vérification, actions Modifier et Tester la génération en bas du tiroir. Ce schéma liste + panneau de détail sert de modèle aux listes suivantes (historique, missions, documents métier).

Panneau en 4 sections, chargées à partir de `GET /document-types/{id}/form`. La gestion des champs (ajout, modification, suppression dans une liste) sert de modèle aux listes des documents métier.

- [x] **Informations :** code, nom, description et statut, avec un bouton « Modifier » qui réutilise la modale de l'étape 8.
- [x] **Modèle Word :**
  - afficher le modèle actif (nom du fichier, version, date, taille) ;
  - téléverser ou remplacer le fichier avec `app-file-upload` (`.docx`, 10 Mo) → `POST /document-types/{id}/template`.
- [x] **Champs :**
  - tableau des champs (ordre, nom technique, libellé, type, obligatoire) ;
  - ajout et modification dans une modale → `POST /document-fields` et `PUT /document-fields/{id}` ;
  - suppression avec confirmation → `DELETE /document-fields/{id}` ;
  - type choisi dans une liste limitée à `TEXT / TEXTAREA / DATE / NUMBER / BOOLEAN` ;
  - nom technique contrôlé (`[A-Za-z0-9_]+`, le même motif que les variables `{{ }}` du modèle).
- [x] **Vérification :** bouton « Vérifier le modèle » → `GET .../template/validate-variables`. Afficher les variables détectées, les champs absents du modèle, les variables inconnues et un statut valide ou invalide.
- [x] **Tester :** bouton « Tester la génération » qui ouvre `/documents/generer/:id`.
- [x] Backend : le nom technique d'un champ est contrôlé (`[A-Za-z0-9_]+`, erreur 400) et un nom déjà utilisé dans le même type renvoie une erreur 409 claire, au lieu du message générique « lié à d'autres données » (`DocumentFieldService`). À reporter dans audit-document-spring.
- [x] Briques réutilisables : `app-icon-button` (icônes Angular Material pour les actions des listes), pipe `fileSize`, `injectActionRunner()` (`core/http/action-runner.ts`) pour les appels API avec indicateur de chargement et toast d'erreur.
- **Validation :** créer un type, téléverser un modèle, ajouter les champs, obtenir un statut valide, puis générer le document.
- **Résultat :** build OK, 98 tests unitaires OK. Parcours complet validé dans Chrome sur le vrai backend (type temporaire supprimé à la fin) : téléversement, vérification invalide puis valide, ajout, modification, refus d'un doublon, suppression avec renumérotation, ouverture de la génération.

### Étape 10 — Historique des documents (`/document-history`)

- [x] `DocumentHistoryService` → `GET /documents-generes` (filtres facultatifs), `GET /documents-generes/{id}`, `GET /documents-generes/{id}/download` et `DELETE /documents-generes/{id}`, plus `saveCopy()` qui télécharge et enregistre le fichier avec son nom.
- [x] Tableau : nom du fichier (cliquable), type, mission, date de génération, taille et nombre de documents affichés.
- [x] Filtres par type de document et par mission (paramètres de l'API), recherche locale sans accents sur le nom du fichier, le type et la mission, bouton « Réinitialiser ».
- [x] Actions par ligne en icônes : voir le détail, télécharger, supprimer (avec confirmation).
- [x] Détail dans le **tiroir** (route enfant `/document-history/:id`, et non une fenêtre) : onglet Détails (type, mission, date, version du modèle, format, taille, carte du fichier) et onglet Valeurs saisies (`app-document-preview` avec les libellés actuels du type ; les valeurs d'un champ supprimé restent visibles sous leur nom technique, et tout reste lisible si le type a été supprimé). Pied : Supprimer et Télécharger.
- [x] « Voir dans l'historique » (écran de succès de la génération) ouvre directement le tiroir du document généré.
- [x] `normalizeForSearch()` déplacé dans `shared/utils/search.ts` (catalogue et historique).
- **Validation :** un document généré à l'étape 7 apparaît en tête de liste et se retélécharge à l'identique.
- **Résultat :** build OK, 122 tests unitaires OK. Vérifié dans Chrome sur le vrai backend avec un document de test (généré par l'API puis supprimé depuis le tiroir) : en tête de liste, recherche, filtre mission, tiroir et valeurs, PDF retéléchargé identique octet par octet, suppression (404 ensuite).

### Étape 11 — Missions d'audit (`/missions`) : la base des documents métier

L'ordre de mission correspond à la mission elle-même : sa gestion couvre ce premier document. Adapté aux règles d'interface décidées depuis : création et modification dans une **fenêtre** (grande taille), détail dans le **tiroir** (`/missions/:id`), et non dans des pages séparées.

- [x] `MissionService` (liste, détail, création, modification, suppression, équipe `/mission-personnes/mission/{id}`), `PersonneService`, `StructureService` et `StatisticsService` (`/statistiques`, `/statistiques/avancement`).
- [x] **Liste :** tableau (numéro, intitulé cliquable, structure, période, statut, taille de l'équipe), recherche sans accents, filtre par statut (À venir, En cours, Terminée, Sans dates : même règle que les statistiques du backend), icônes voir, modifier, supprimer (avec confirmation : les documents générés restent dans l'historique).
- [x] **Création et modification** (`MissionFormModalComponent`) : intitulé, objet, structure, dates de début, de fin et de signature ; équipe : personne + rôle parmi les 5 valeurs fixes (groupée par rôle), une même personne ne peut pas avoir deux fois le même rôle ; rappel « les représentants de l'entité auditée ont le rôle Point focal ». Contrôles : intitulé et structure obligatoires, date de fin après la date de début.
- [x] Création rapide dans une fenêtre par-dessus le formulaire : « + » à côté des structures (nom, description → sélectionnée automatiquement) et à côté des personnes (nom, prénom, matricule, fonction, service → ajoutée à l'équipe si un rôle est déjà choisi). Échap ne ferme que la fenêtre du dessus.
- [x] **Détail** dans le tiroir : onglets Informations (ordre de mission), Équipe (groupée par rôle), Dossier d'audit (avancement et les 12 documents dans l'ordre de l'audit, avec leur état) et Documents générés (ouvrent le tiroir de l'historique). Pied : Modifier, Générer un document.
- [ ] **Saisie des documents métier** : reportée aux étapes 12 à 22. L'onglet Dossier d'audit liste déjà les documents et l'étape qui les apportera. **À décider à l'étape 12** : où afficher la saisie d'un document métier (tiroir agrandi, ou espace de travail dédié pour les documents longs comme le rapport).
- [x] Listes de personnes pour les formulaires : `MissionService.getTeam()` renvoie l'équipe avec `missionPersonneId` (règle du 19/10/2026), prêt pour les étapes 12 et suivantes.
- [x] Backend :
  - `MissionRequestValidator` : intitulé obligatoire (500 caractères maximum), structure obligatoire, ordre des dates, pas de doublon personne + rôle (erreurs 400 claires au lieu d'erreurs techniques) ;
  - modification de l'équipe **sans recréer les membres conservés** : leur `missionPersonneId` reste le même (il est utilisé par les fiches de test et le PV d'affirmation, que l'ancien « tout supprimer puis recréer » aurait cassés) ;
  - `GET /missions` et `GET /missions/{id}` renvoient maintenant le `missionPersonneId` de chaque membre (il était vide) ;
  - création d'une personne (nom et prénom obligatoires) et d'une structure (nom obligatoire) contrôlée.
  - **À reporter dans audit-document-spring.**
- **Validation :** créer une mission avec son équipe, la modifier, générer un document lié, puis supprimer la mission (le document reste dans l'historique).
- **Résultat :** build OK, 142 tests unitaires OK, tests backend OK. Parcours complet validé dans Chrome sur le vrai backend : erreurs du formulaire vide, structure et personne créées à la volée, mission n° 005 créée et ouverte dans le tiroir, équipe modifiée (le chef de mission garde son `missionPersonneId`), document généré visible dans l'onglet, mission supprimée (404) et document conservé sans mission. Données de test supprimées.

### Étapes 12 à 22 — Documents métier d'une mission

Règles communes à ces 11 étapes :

- **espace de travail de la mission** (décidé le 22/10/2026) : la saisie des documents se fait dans une page pleine largeur propre à la mission (par exemple `/missions/:id/dossier/<document>`), ouverte par un bouton « Ouvrir le dossier » du tiroir de la mission. À gauche, les 12 documents dans l'ordre de l'audit avec leur état ; à droite, le document choisi en pleine largeur (liste, formulaire, aperçu A4 et « Imprimer / PDF »). Le tiroir reste réservé à la consultation. Cet espace est mis en place au début de l'étape 12 ;
- chaque document a sa liste, son formulaire de création et de modification, et sa suppression avec confirmation ;
- au début de chaque étape, relire le contrôleur, les DTO et le service du backend pour calquer les modèles TypeScript et repérer les règles métier (messages d'erreur, contraintes d'unicité) ;
- les listes internes d'un document (objectifs, participants, questions, lignes…) réutilisent le schéma « ajout, modification, suppression dans une liste » mis au point à l'étape 9. Si le même bloc revient dans plusieurs documents, en faire un composant partagé ;
- les personnes viennent de l'équipe de la mission, filtrée par rôle (`DIRECTEUR_AUDIT_INTERNE`, `CHEF_MISSION`, `SUPERVISEUR`, `AUDITEUR`, `POINT_FOCAL`) ;
- quand l'API ne propose pas de filtre par mission, filtrer la liste côté front sur `missionId`, et noter le besoin d'un endpoint dédié en section 4 ;
- **pas de modèle Word pour ces documents** (décidé le 20/10/2026) : le front affiche chaque document en reproduisant la mise en forme et le texte de `Document.docx` (en-tête du ministère, titres, formules, tableaux), remplis avec les données de la mission. Un composant partagé de « feuille de document » (format A4, en-tête officiel) sert aux 12 documents. **Sortie papier et PDF** (décidé le 20/10/2026) : un bouton « Imprimer / PDF » ouvre la fenêtre d'impression du navigateur (`window.print()`), où l'utilisateur choisit une imprimante ou « Enregistrer en PDF ». Une feuille de style d'impression (`@media print`, format A4) masque le menu, le header et les boutons pour ne garder que le document. Aucune bibliothèque supplémentaire.

#### Espace de travail de la mission (début de l'étape 12)

- [x] Route `/missions/:id/dossier/<document>` (`MissionWorkspaceComponent`) ouverte par « Ouvrir le dossier » dans le tiroir de la mission ; l'onglet « Dossier d'audit » du tiroir ouvre directement chaque document disponible.
- [x] Menu des 12 documents dans l'ordre de l'audit avec leur état (rempli, en partie, à faire) ; les documents des étapes suivantes sont grisés avec leur numéro d'étape.
- [x] `AuditFileStore` : la mission et ses documents chargés une fois, partagés par les pages (le backend n'a pas de filtre par mission : les listes sont filtrées côté front).
- [x] Briques partagées : `app-document-sheet` (feuille A4, en-tête du ministère, typographie des documents) et `app-document-toolbar` (titre, actions, « Imprimer / PDF »). Feuille de style d'impression `src/styles/_print.scss` : seule la feuille est imprimée (menu, en-tête, navigation et boutons masqués, mise en page libérée pour imprimer plusieurs pages).
- [x] **Ordre de mission** : établi automatiquement à partir de la mission (numéro N° xxx-année-MEF/DAI, date de signature, chefs de mission, auditeurs, directeur, superviseurs, structure), texte de `Document.docx`.

#### Étape 12 — Termes de référence (TDR)

- [x] API : `/tdrs` (un seul TDR par mission).
- [x] Saisie en pleine largeur : contexte, compétence, périmètre, période d'observation, lieu, méthodologie (préremplie avec les 3 phases), résultats attendus, livrables (prérempli) ; textes d'aide repris de `Document.docx`.
- [x] Liste interne des **objectifs** : ajout, modification, retrait ; un objectif conservé garde son numéro `OBJ-xx` (vérifié).
- [x] Aperçu A4 fidèle à `Document.docx` (sections, objectifs numérotés, « [À compléter] » pour les parties vides), impression, suppression avec confirmation.
- [x] Backend : mission obligatoire et description obligatoire pour chaque objectif (`MissionDocumentRules`).
- [x] **Date du TDR** (décidé le 23/10/2026, option A) : champ `dateTdr` ajouté au backend (colonne `date_tdr`, facultative) et au formulaire (aujourd'hui proposé pour un nouveau TDR) ; affichée en haut du document « Antananarivo, le … ». Même logique à appliquer aux autres documents qui ont une date en en-tête.

#### Étape 13 — Déclarations d'indépendance

- [x] API : `/declarations-independance`.
- [x] Une carte par membre de l'équipe d'audit (une seule fois par personne, point focal exclu) : « Signée le … » ou « À établir », établir (date proposée : aujourd'hui), modifier la date, supprimer.
- [x] Règle décidée le 23/10/2026 : le document est **terminé dès qu'un auditeur a fait sa déclaration** ; les autres auditeurs peuvent encore établir la leur. Pas de compteur « x / y » : le menu affiche le nombre de déclarations.
- [x] Aperçu de la **lettre** du membre choisi, texte complet de `Document.docx` (nom, prénoms, IM, fonction, service, mission, date). Phrase complétée : « je déclare, pour la mission n° … « … », être indépendant(e) et ne me trouver dans aucune situation de conflit d'intérêts ».
- [x] Backend : personne et date obligatoires, la personne doit appartenir à l'équipe d'audit de la mission (pas un point focal), une seule déclaration par personne et par mission (409 clair).

#### Étape 14 — PV de réunion d'ouverture

- [x] API : `/reunions` avec `type: OUVERTURE` (une seule par mission).
- [x] Saisie : date (obligatoire), début, fin et levée de séance, lieu, points abordés par la DAI et par les interlocuteurs (préremplis avec la trame de `Document.docx`), observations.
- [x] **Présents** : cases à cocher prises dans l'équipe de la mission, « Représentants de l'entité auditée » = points focaux (`ENTITE_AUDITEE`), « Équipe de la DAI » = les autres membres (`EQUIPE_DAI`) ; message et lien vers la mission s'il n'y a aucun point focal.
- [x] Aperçu A4 du PV (objet, horaires, présents des deux côtés, points abordés, « La séance a été levée à … », secrétaire de séance), impression, suppression.
- [x] Backend : chaque participant doit être dans l'équipe de la mission, un représentant de l'entité auditée doit être point focal et un membre DAI ne doit pas l'être, pas de doublon, type `ENTITE_AUDITEE` ou `EQUIPE_DAI`.

- **Résultat (étapes 12 à 14) :** build OK, 168 tests unitaires OK, tests backend OK. Parcours validé dans Chrome sur le vrai backend avec une mission temporaire (supprimée ensuite) : ouverture du dossier depuis le tiroir, ordre de mission, TDR créé avec 2 objectifs puis modifié (OBJ-02 garde son identifiant), déclaration établie (1 / 2), PV d'ouverture avec point focal et équipe DAI ; règles backend vérifiées (point focal refusé pour une déclaration et dans l'équipe DAI, déclaration en double refusée) ; PDF produits par Chrome : seule la feuille du document est imprimée.
- Toutes les corrections backend des étapes 9 à 14 sont reportées dans `audit-document-spring` (compilation et tests OK).

#### Étape 15 — Fiches d'interview

- [x] API : `/interviews` (pas de filtre par mission : filtré côté front). Plusieurs fiches par mission, référence `FI-xxx` attribuée par le backend.
- [x] Liste des fiches à gauche, fiche à droite (en-tête DAI / Audit de … / Référence, tableau des visas, interviewé, fonction, ancienneté, date, tableau des questions et réponses). Saisie pleine largeur : interviewé (les points focaux proposés en premier, fonction préremplie), visas « rédigé, supervisé, validé par » (équipe d'audit), questions et réponses en liste.
- [x] Backend : mission et interviewé obligatoires, texte obligatoire pour chaque question, visas donnés uniquement par l'équipe d'audit de la mission (`MissionDocumentRules.checkInterview`). Reporté dans spring.

#### Étape 16 — Programme de travail

- [x] API : `/programmes-travail` (un programme par mission ; filtré côté front). Lignes rattachées aux objectifs du TDR ; numéro de contrôle attribué par le backend, conservé quand on modifie.
- [x] Sans objectif dans le TDR : message et lien vers le TDR.
- [x] Aperçu fidèle au tableau de `Document.docx` (14 colonnes, lignes groupées par objectif dans l'ordre du TDR), feuille **paysage** : une page A4 paysage à l'impression, défilement horizontal à l'écran.

#### Étape 17 — Fiches de test

- [x] API : `/tests` (pas de `missionId` : les tests d'une mission sont ceux portant sur les lignes de son programme).
- [x] Saisie : ligne du programme, date, procédure réalisée, échantillons (anomalie oui/non, observation), résumé des anomalies, résultat (`EFFECTIF`, `PARTIELLEMENT_EFFECTIF`, `INEFFECTIF`), risque maîtrisé, recommandations, contrôle qualité (auditeur, chef de mission, superviseur : seuls les membres ayant ce rôle sont proposés, avec leurs dates et commentaires).
- [x] Fiche de test : `Document.docx` ne contient pas de texte pour ce modèle (image) ; mise en page établie à partir des champs : contrôle testé, travaux réalisés, échantillons, résultat, contrôle qualité.

#### Étape 18 — Fiches de constats

- [x] API : `/constats` (constats d'une mission = ceux de ses tests).
- [x] Saisie : test d'origine, description, niveau de risque (`FAIBLE`, `MOYEN`, `ELEVE`), direction ou service concerné, listes de causes, risques (avec niveau), conséquences et recommandations ; cocher « retenue » sur une recommandation décoche les autres (une seule retenue, règle du backend).
- [x] Deux présentations de `Document.docx` : **fiche par constat (modèle n°02)** « Résultats des travaux » et **tableau récapitulatif (modèle n°01)** de tous les constats groupés par objectif, en paysage.

#### Étape 19 — PV d'affirmation des constats

- [x] API : `/pv-affirmations` (un PV par mission ; `GET /mission/{id}` renvoie 404 tant qu'il n'y en a pas, traité comme « pas encore de PV »).
- [x] Saisie : date de l'entretien (obligatoire), lieu, présents (`AUDITEUR` = équipe d'audit, `ENTITE_AUDITEE` = points focaux, par `missionPersonneId`), une ligne par constat de la mission (à présenter ou non ; question préremplie avec le constat, réponse de l'entité, pièces justificatives, commentaires des auditeurs), observations complémentaires.
- [x] Aperçu fidèle à `Document.docx` : titre encadré avec l'OM, phrase d'introduction (mission, structure, période, date de l'entretien), présents des deux côtés, objet, tableau des constats et réponses, observations, « Fait à …, le … » à droite en fin de document (sans bloc de signature après, règle du 23/10/2026).

- **Briques partagées ajoutées :** `app-document-split` et `app-document-list-item` (liste à gauche + feuille à droite, utilisées aussi par les déclarations), mixin SCSS `document-form` (`src/styles/_document-form.scss`) pour les formulaires des documents, orientation paysage de `app-document-sheet`. `AuditFileStore` charge aussi interviews, programme, tests, constats et PV d'affirmation.
- **Résultat (étapes 15 à 19) :** build OK, 185 tests unitaires OK, tests backend OK (back et spring). Parcours complet validé dans Chrome sur le vrai backend avec une mission temporaire (supprimée ensuite) : interview FI, programme de 2 lignes, test avec échantillon et contrôle qualité, constat complet (une seule recommandation retenue), PV d'affirmation ; règles backend vérifiées (visa par un point focal, question vide, rôle du contrôle qualité, deux recommandations retenues, représentant de l'entité qui n'est pas point focal) ; PDF : programme et tableau des constats sur 1 page paysage, PV en portrait.

#### Étape 20 — Rapport d'audit

- [ ] API : `/rapports` (`POST`, `GET /mission/{missionId}`, `PUT /{id}`). Un seul rapport par mission, pas de suppression.
- [ ] Champs : motifs, nature, version, date d'émission, propriétaire, destinataires, classification. Le titre et la référence de l'ordre de mission viennent de la mission.
- **Validation :** créer puis modifier le rapport de la mission.

#### Étape 21 — PV de réunion de clôture

- [ ] API : `/reunions` avec `type: CLOTURE` (une seule par mission). Réutilise au maximum l'écran de l'étape 14.
- [ ] Champs : date, heures, heure de levée, lieu, remerciements, rappel du périmètre, synthèse des constats, points forts, résultats des vérifications, recommandations et plans d'actions, observations des interlocuteurs.
- **Validation :** créer le PV de clôture, le modifier et le supprimer.

#### Étape 22 — Tableau des recommandations

- [ ] API : `GET /tableau-recommandations/mission/{missionId}`, `/reponses` (`POST`, `PUT /{id}`, `DELETE /{id}`, `GET /recommandation/{id}`) et `PUT /recommandations/{id}/maintien`. Dépend des constats (étape 18).
- [ ] Tableau : anomalies constatées, recommandations retenues, réponses de l'entité, recommandation maintenue ou non.
- [ ] Actions : saisir ou modifier la réponse de l'entité, puis décider du maintien (possible seulement après une réponse).
- **Validation :** répondre à une recommandation retenue, puis décider de son maintien.

### Étape 23 — Tableau de bord (`/dashboard`)

- [ ] Source : `GET /statistiques` et `GET /statistiques/avancement`.
- [ ] Indicateurs avec des tuiles : missions (en cours, à venir, terminées, sans dates), documents générés et types actifs.
- [ ] Derniers documents générés (`derniersDocuments`), avec un lien vers l'historique.
- [ ] Avancement des missions : une barre de progression par mission, avec le détail des 7 documents, et un lien vers la mission.
- [ ] Liens rapides vers « Créer un document » et « Nouvelle mission ».
- **Validation :** les chiffres correspondent à la base.

### Étape 24 — Statistiques (`/statistics`)

- [ ] Source : `GET /statistiques` et `GET /statistiques/avancement`.
- [ ] Graphiques : documents générés par mois (12 derniers mois), documents par type, répartition des missions par état, avancement des missions.
- [ ] Choisir une approche sans dépendance lourde (SVG simple) ou ajouter une bibliothèque de graphiques. À décider au début de l'étape.
- **Validation :** les graphiques correspondent aux chiffres de l'API, y compris quand il n'y a encore aucun document (état vide).

### Étape 25 — Paramètres (`/settings`)

- [ ] Source : `GET /parametres`, en lecture seule.
- [ ] Afficher les informations générales, les paramètres de génération (formats, taille maximale, syntaxe `{{nomDuChamp}}`), les types de champs et les rôles de mission.
- [ ] Aucun paramètre modifiable : le backend n'en expose pas.
- **Validation :** les valeurs affichées correspondent à `application.properties`.

### Étape 26 — Templates et champs (`/templates`)

- [ ] Décider au début de l'étape : fusionner ce menu dans « Types de documents » (l'étape 9 couvre déjà la configuration) ou garder une vue d'ensemble légère.
- [ ] Si vue d'ensemble : pour chaque type, présence d'un modèle (nom et version), nombre de champs et statut de vérification, avec une action « Configurer » vers `/document-types/:id` (sans dupliquer la page de l'étape 9).
- [ ] ⛔ Il n'existe pas d'API qui liste les anciennes versions d'un modèle. On n'affiche que le modèle actif de chaque type.
- **Validation :** l'état affiché correspond à ce qui est configuré.

### Étape 27 — Recette complète

- [ ] Parcours A : un type existant → formulaire → récapitulatif → génération → téléchargement → historique, testé sur au moins 3 types différents.
- [ ] Parcours B : nouveau type → modèle → champs → vérification → apparition dans le catalogue → génération → désactivation → disparition du catalogue.
- [ ] Parcours C : une mission complète, de l'ordre de mission au tableau des recommandations, avec son avancement à 100 %.
- [ ] Responsive (téléphone, tablette, bureau), erreurs API (backend arrêté) et états vides.

---

## 4. Dépendances backend restantes

| Fonctionnalité | Ce qui manque côté backend |
|---|---|
| Filtrer certains documents métier par mission | Selon les DTO relus à chaque étape, des endpoints `?missionId=` pourront être utiles (TDR, déclarations, réunions, interviews, programmes, tests, constats) |
| Réordonner les champs | Le `PUT` d'un champ n'accepte pas `ordre` |
| Liste déroulante (`SELECT`) dans les formulaires dynamiques | Un type `SELECT` et une liste d'options sur `DocumentField` |
| Anciennes versions d'un modèle Word | Un endpoint qui liste les modèles d'un type (`DocumentTemplate`) |
| Paramètres modifiables | Une table de paramètres et un endpoint de mise à jour |

## 5. Périmètre

- **Dans le périmètre** (décidé le 20/10/2026) : la saisie et la consultation des 12 documents de `Document.docx`. L'ordre de mission correspond à la mission (étape 11), les 11 autres sont des onglets de la mission (étapes 12 à 22).
- **Rendu des documents métier** : affichés par le front d'après la mise en forme de `Document.docx`, **sans modèle Word ni génération backend**. Les modèles Word et la génération PDF par LibreOffice (étape 7) sont réservés aux types de documents dynamiques du catalogue.

---

## 6. Journal d'avancement

| Date | Étape | Statut | Notes |
|---|---|---|---|
| 19/10/2026 | Backend | Fait | Ajout de `/api/rapports`, du CORS global, de l'endpoint de génération DOCX et de la validation des rôles de mission |
| 19/10/2026 | Étape 0 | Fait | Upload jusqu'à 10 Mo ; ajout de la gestion des types (modification, statut, suppression), de l'historique, des statistiques et des paramètres ; noms de méthodes et commentaires du back passés en anglais |
| 19/10/2026 | Étape 0 | Fait | Codes HTTP d'erreur corrects et format JSON unique ; `/form` accessible sans modèle ; fichiers retrouvés même après déplacement du projet |
| 19/10/2026 | Étape 1 | Fait | Socle HTTP (`provideHttpClient`, URL de l'API, lecture des erreurs, téléchargement de fichiers), modèles TypeScript et types de champs alignés sur le backend |
| 20/10/2026 | Étape 2 | Fait | Sidebar à 8 menus, header sans « Admin », 11 routes avec titres d'onglet, menu mobile, 8 pages provisoires, `index.html` en français |
| 20/10/2026 | Étape 3 | Fait | Catalogue des documents relié à l'API : cartes, recherche sans accents, chargement, erreur avec « Réessayer », état vide. Retrait des données de démonstration reporté à l'étape 4 |
| 20/10/2026 | Étape 4 | Fait | Formulaire de génération chargé depuis l'API (vrais champs, dans l'ordre), mission associée facultative, cas sans modèle, sans champ, désactivé et introuvable. Données de démonstration supprimées |
| 20/10/2026 | Étape 5 | Fait | Formulaire dynamique : chargement, pré-remplissage, validation (obligatoire, nombre) avec focus sur la première erreur, saisie gardée au retour de l'aperçu. Bug des cases à cocher non envoyées corrigé |
| 20/10/2026 | Feuille de route | Réorganisée | Les 12 documents de `Document.docx` entrent dans le périmètre : missions (étape 11), puis un document métier par étape (12 à 22), avant le tableau de bord et les statistiques (23 à 26). Historique avancé en étape 10, recette en étape 27 |
| 20/10/2026 | Étape 6 | Fait | Récapitulatif avant génération (mission comprise), retour au formulaire sans perte. Deux bugs corrigés : mission non réaffichée au retour, ids en double sur les composants de champ |
| 20/10/2026 | Feuille de route | Mise à jour | Le document généré devient un **PDF** (modèles toujours en `.docx`). Étape 7 découpée en 7.0 (conversion PDF côté backend, outil à choisir) et 7.1 (front). Comparatif des outils de conversion ajouté |
| 20/10/2026 | Étape 7 | Fait | Génération PDF avec LibreOffice (backend) et écran de génération (front), validés par curl et par les tests unitaires ; reporté dans audit-document-spring. Vérification navigateur impossible sur le poste à cause d'Avast, à revoir au déploiement |
| 20/10/2026 | Feuille de route | Mise à jour | Les 12 documents métier n'ont pas de modèle Word : le front les affiche en reproduisant `Document.docx`. La dépendance backend « génération PDF des documents métier » est supprimée |
| 20/10/2026 | Feuille de route | Décision | Documents métier : sortie papier et PDF par l'impression du navigateur (« Imprimer / PDF »), avec une mise en page d'impression A4 |
| 21/10/2026 | Étape 8 | Fait | Écran « Types de documents » : tableau avec statut et actions, création et modification en fenêtre, activation et désactivation, suppression avec confirmation. Briques réutilisables : cellules personnalisées du tableau, badge à libellé libre |
| 21/10/2026 | Étape 8 | Ajustement | Actions des listes en icônes Angular Material (`app-icon-button`, police `material-icons` servie localement) au lieu de grands boutons texte |
| 21/10/2026 | Étape 9 | Fait | Page de configuration d'un type : informations, modèle Word (téléversement et remplacement, vérification automatique), champs (ajout, modification, suppression), vérification du modèle, test de la génération. Backend : contrôle du nom technique et des doublons |
| 21/10/2026 | Étape 9 | Ajustement | La configuration s'ouvre dans un panneau latéral (`app-side-panel`) à droite de la liste au lieu d'une page séparée ; tableau des champs resserré (obligatoire = `*`). Icônes affichées en texte chez l'utilisateur : serveur `ng serve` lancé avant l'ajout de la police, à relancer |
| 21/10/2026 | Étape 9 | Ajustement | D'après la maquette de l'utilisateur : le détail devient un tiroir par-dessus la liste (fond assombri, agrandissable), en-tête avec badges, onglets Détails / Champs / Vérification, lignes libellé-valeur, carte du fichier modèle, champs en liste compacte, actions en pied. Nouveaux composants partagés `app-tabs` et `app-detail-row` |
| 21/10/2026 | Étape 9 | Ajustement | Nouveau design des fenêtres (`app-modal`) : icône colorée (rouge pour une suppression), sous-titre avec le nom de l'élément, fond flouté, animation, boutons `app-button`, fermeture par Échap, tailles `sm / md / lg` |
| 22/10/2026 | Étape 10 | Fait | Historique : tableau, filtres type et mission, recherche, téléchargement, suppression, détail dans le tiroir (détails et valeurs saisies). « Voir dans l'historique » ouvre le document généré |
| 22/10/2026 | Étape 11 | Fait | Missions : liste, recherche, filtre statut, création et modification en fenêtre (équipe par rôle, création rapide de structure et de personne), détail en tiroir (ordre de mission, équipe, dossier d'audit, documents générés), suppression. Backend : validation des missions, personnes et structures, équipe modifiée sans recréer les membres, `missionPersonneId` renvoyé |
| 22/10/2026 | Interface | Ajustement | Recherche sans bouton « Rechercher » : filtrage automatique 300 ms après la frappe (ou Entrée), petit indicateur de chargement dans le champ. Icône Material devant chaque entrée du menu |
| 22/10/2026 | Feuille de route | Décision | Étapes 12 à 22 : saisie des documents métier dans un **espace de travail de la mission** (page pleine largeur), le tiroir restant pour la consultation |
| 23/10/2026 | Backend spring | Report | Corrections des étapes 9 à 14 reportées dans audit-document-spring : contrôle des champs, validation des missions, personnes et structures, équipe modifiée sans recréer les membres, missionPersonneId renvoyé, règles des TDR, déclarations et réunions |
| 23/10/2026 | Étapes 12 à 14 | Fait | Espace de travail de la mission (menu des 12 documents, feuille A4, impression), ordre de mission, TDR avec objectifs, déclarations d'indépendance, PV de réunion d'ouverture. Backend : `MissionDocumentRules` |
| 23/10/2026 | Étapes 12 à 14 | Ajustement | Déclarations : terminé dès la première déclaration (plus de « x / y »). Documents : logo minitere_economie_et_finance.png et en-tête centrés, lignes « Nom : … » compactes, date de fin à droite sans nom après. Titre de l'espace de travail et barre du document fixés au défilement |
| 23/10/2026 | Impression | Ajustement | Plus d'en-tête ni de pied de page du navigateur dans les documents imprimés (date et heure, titre d'onglet, adresse localhost, numéro de page) : page sans marge, marges blanches portées par la feuille du document et répétées sur chaque page. Vérifié sur un PDF de 2 pages produit avec en-têtes du navigateur activés |
| 23/10/2026 | Étape 12 | Ajustement | Date du TDR enregistrée et affichée en en-tête (back, spring, front). Espace de 22 px sous le titre fixé de l'espace de travail |
| 23/10/2026 | Backend | Correction | Création de mission : le numéro venant de la séquence `mission_numero_seq` pouvait déjà exister (numéros saisis à la main, ex. 007) et la création échouait ; les numéros déjà pris sont maintenant sautés (back et spring) |
| 26/10/2026 | Étapes 15 à 19 | Fait | Fiches d'interview, programme de travail (paysage), fiches de test, fiches de constats (modèles 01 et 02), PV d'affirmation des constats, dans l'espace de travail de la mission. Backend : contrôles des interviews (back et spring) |
| 26/10/2026 | Étape 15 | Ajustement | Fiche d'interview : date de chaque visa (rédigé, supervisé, validé le) saisie sous la personne et affichée dans le tableau des visas ; date de rédaction = aujourd'hui par défaut. Colonnes `date_redaction`, `date_supervision`, `date_validation` (back et spring) |
