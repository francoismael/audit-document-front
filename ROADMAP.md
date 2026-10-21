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

- [ ] `DocumentHistoryService` → `GET /documents-generes`, `GET /documents-generes/{id}`, `GET /documents-generes/{id}/download` et `DELETE /documents-generes/{id}`.
- [ ] Tableau : nom du fichier, type, mission, date de génération et taille.
- [ ] Filtres par type de document et par mission (paramètres de l'API), plus une recherche locale sur le nom du fichier.
- [ ] Actions par ligne :
  - « Détails » : modale avec le récapitulatif des `valeurs` saisies (réutilise `app-document-preview`) ;
  - « Télécharger » ;
  - « Supprimer », avec confirmation.
- **Validation :** un document généré à l'étape 7 apparaît en tête de liste et se retélécharge à l'identique.

### Étape 11 — Missions d'audit (`/missions`) : la base des documents métier

L'ordre de mission correspond à la mission elle-même : sa gestion couvre ce premier document.

- [ ] `MissionService`, `PersonneService` et `StructureService` connectés aux API existantes.
- [ ] **Liste :** tableau (numéro, intitulé, structure, dates), recherche, et suppression avec confirmation.
- [ ] **Création et modification** (`/missions/nouvelle`, `/missions/:id/modifier`) :
  - champs : intitulé, objet, dates et structure (liste déroulante) ;
  - équipe : ajout de personnes avec un rôle parmi les 5 valeurs fixes ;
  - les représentants de l'entité auditée sont ajoutés comme `POINT_FOCAL`.
- [ ] Création rapide dans une modale (décidé le 19/10/2026), sans page de référentiel séparée :
  - à côté de la liste des structures, un bouton « + » ouvre une modale (nom, description) → `POST /structures`, puis la nouvelle structure est sélectionnée automatiquement ;
  - à côté de la liste des personnes, un bouton « + » ouvre une modale (nom, prénom, matricule, fonction, service) → `POST /personnes`, puis la nouvelle personne est ajoutée à l'équipe.
- [ ] **Détail** (`/missions/:id`) : informations, équipe groupée par rôle, avancement (`GET /statistiques/avancement`), documents générés pour cette mission (`GET /documents-generes?missionId=`).
- [ ] **Onglets des documents métier** sur la page de détail, un onglet par document dans l'ordre d'un audit (routes enfants `/missions/:id/<document>`). Chaque onglet est rempli à son étape (12 à 22) ; en attendant, il affiche « Page en préparation ».
- [ ] Listes de personnes selon les formulaires : source `/mission-personnes/mission/{id}` filtrée par rôle, en envoyant `personneId` ou `missionPersonneId` selon le formulaire (règle décidée le 19/10/2026).
- **Validation :** créer une mission avec son équipe, la modifier, générer un document lié, puis supprimer la mission (le document reste dans l'historique).

### Étapes 12 à 22 — Documents métier d'une mission

Règles communes à ces 11 étapes :

- chaque document est un onglet de la page de détail de la mission (étape 11), avec sa liste, son formulaire de création et de modification, et sa suppression avec confirmation ;
- au début de chaque étape, relire le contrôleur, les DTO et le service du backend pour calquer les modèles TypeScript et repérer les règles métier (messages d'erreur, contraintes d'unicité) ;
- les listes internes d'un document (objectifs, participants, questions, lignes…) réutilisent le schéma « ajout, modification, suppression dans une liste » mis au point à l'étape 9. Si le même bloc revient dans plusieurs documents, en faire un composant partagé ;
- les personnes viennent de l'équipe de la mission, filtrée par rôle (`DIRECTEUR_AUDIT_INTERNE`, `CHEF_MISSION`, `SUPERVISEUR`, `AUDITEUR`, `POINT_FOCAL`) ;
- quand l'API ne propose pas de filtre par mission, filtrer la liste côté front sur `missionId`, et noter le besoin d'un endpoint dédié en section 4 ;
- **pas de modèle Word pour ces documents** (décidé le 20/10/2026) : le front affiche chaque document en reproduisant la mise en forme et le texte de `Document.docx` (en-tête du ministère, titres, formules, tableaux), remplis avec les données de la mission. Un composant partagé de « feuille de document » (format A4, en-tête officiel) sert aux 12 documents. **Sortie papier et PDF** (décidé le 20/10/2026) : un bouton « Imprimer / PDF » ouvre la fenêtre d'impression du navigateur (`window.print()`), où l'utilisateur choisit une imprimante ou « Enregistrer en PDF ». Une feuille de style d'impression (`@media print`, format A4) masque le menu, le header et les boutons pour ne garder que le document. Aucune bibliothèque supplémentaire.

#### Étape 12 — Termes de référence (TDR)

- [ ] API : `/tdrs` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`). Un seul TDR par mission.
- [ ] Champs : contexte, compétence, périmètre, période d'observation, lieu, méthodologie, résultats attendus, livrables.
- [ ] Liste interne : **objectifs** (description ; numéro `OBJ-01`… attribué par le backend).
- **Validation :** créer, modifier et supprimer le TDR d'une mission, ajouter et retirer des objectifs.

#### Étape 13 — Déclarations d'indépendance

- [ ] API : `/declarations-independance` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`).
- [ ] Champs : personne déclarante (équipe de la mission, `personneId`) et date de déclaration.
- **Validation :** une déclaration par membre de l'équipe, visible dans la liste de la mission.

#### Étape 14 — PV de réunion d'ouverture

- [ ] API : `/reunions` avec `type: OUVERTURE` (une seule réunion de ce type par mission).
- [ ] Champs : date, heures de début et de fin, lieu, observations, points abordés par la DAI (introduction, présentation de la mission, méthodologie) et par les interlocuteurs (introduction, processus, organisation).
- [ ] Liste interne : **participants** (personne, rôle, `ENTITE_AUDITEE` ou `EQUIPE_DAI`).
- **Validation :** créer le PV d'ouverture avec ses participants, le modifier et le supprimer.

#### Étape 15 — Fiches d'interview

- [ ] API : `/interviews` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`).
- [ ] Champs : personne interviewée, date, fonction, ancienneté ; rédigé, supervisé et validé par (équipe de la mission).
- [ ] Liste interne : **questions et réponses**.
- **Validation :** plusieurs interviews par mission, avec leurs questions, référence `FIxxx` affichée.

#### Étape 16 — Programme de travail

- [ ] API : `/programmes-travail` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`). Dépend des objectifs du TDR (étape 12).
- [ ] Liste interne : **lignes du programme** (objectif, tâche, faiblesse à confirmer, responsable, fréquence, type de contrôle, domaine, risque, procédure de test, échantillon, techniques d'audit et d'échantillonnage).
- **Validation :** créer le programme avec plusieurs lignes rattachées aux objectifs du TDR.

#### Étape 17 — Fiches de test

- [ ] API : `/tests` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `GET /ligne-programme/{id}`). Dépend des lignes du programme (étape 16).
- [ ] Champs : ligne du programme, date, procédure réalisée, résumé des anomalies, résultat (`EFFECTIF`, `INEFFECTIF`…), risque maîtrisé, recommandations, commentaires, contrôle qualité (auditeur, chef de mission, superviseur avec leurs dates, via `missionPersonneId` et le rôle correspondant).
- [ ] Liste interne : **échantillons** (anomalie détectée, observation ; référence attribuée par le backend).
- **Validation :** créer un test sur une ligne du programme, avec ses échantillons et son contrôle qualité.

#### Étape 18 — Fiches de constats

- [ ] API : `/constats` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `GET /test/{testId}`). Dépend des tests (étape 17).
- [ ] Champs : test, description, niveau de risque, direction ou service concerné.
- [ ] Listes internes : **causes**, **risques** (avec niveau), **conséquences**, **recommandations** (une seule peut être retenue).
- **Validation :** créer un constat complet sur un test, et vérifier la règle « une seule recommandation retenue ».

#### Étape 19 — PV d'affirmation des constats

- [ ] API : `/pv-affirmations` (`POST`, `GET /{id}`, `GET /mission/{missionId}`, `PUT /{id}`, `DELETE /{id}`). Dépend des constats (étape 18).
- [ ] Champs : date de l'entretien, lieu, observations complémentaires.
- [ ] Listes internes : **participants** (`missionPersonneId`, `AUDITEUR` ou `ENTITE_AUDITEE` ; l'entité auditée doit avoir le rôle `POINT_FOCAL`) et **lignes** (constat, question, réponse de l'entité, pièces justificatives, commentaires des auditeurs).
- **Validation :** créer le PV d'affirmation de la mission avec ses participants et ses lignes.

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
