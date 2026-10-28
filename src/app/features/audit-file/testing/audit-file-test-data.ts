import { Mission } from '../../missions/models/mission.model';
import { AuditTest } from '../models/audit-test.model';
import { Constat } from '../models/constat.model';
import { ProgrammeTravail } from '../models/programme-travail.model';
import { RapportAudit } from '../models/rapport-audit.model';
import { Reunion } from '../models/reunion.model';
import { TableauRecommandations } from '../models/tableau-recommandations.model';
import { Tdr } from '../models/tdr.model';

// Mission shared by the tests of the workspace: a full team, with one point focal.
export const TEST_MISSION: Mission = {
  id: 10,
  numero: '005',
  intitule: 'Audit de la gestion financière',
  objet: 'Contrôle des procédures comptables.',
  dateDebut: '2026-11-02',
  dateFin: '2026-11-27',
  dateSignature: '2026-10-30',
  structureId: 3,
  structureNom: 'Direction des Ressources Humaines',
  personnes: [
    { missionPersonneId: 1, personneId: 1, nom: 'Rakoto', prenom: 'Jean', fonction: 'Directeur', services: 'DAI', roles: 'DIRECTEUR_AUDIT_INTERNE' },
    { missionPersonneId: 2, personneId: 2, nom: 'Rabe', prenom: 'Aina', fonction: 'Chef de service', services: 'DAI', roles: 'CHEF_MISSION' },
    { missionPersonneId: 3, personneId: 3, nom: 'Rasoa', prenom: 'Lova', fonction: 'Inspecteur', services: 'DAI', roles: 'SUPERVISEUR' },
    { missionPersonneId: 4, personneId: 4, nom: 'Randria', prenom: 'Hery', fonction: 'Auditeur', services: 'DAI', roles: 'AUDITEUR' },
    { missionPersonneId: 5, personneId: 4, nom: 'Randria', prenom: 'Hery', fonction: 'Auditeur', services: 'DAI', roles: 'CHEF_MISSION' },
    { missionPersonneId: 6, personneId: 5, nom: 'Ravelo', prenom: 'Tiana', fonction: 'Directeur des RH', services: 'DRH', roles: 'POINT_FOCAL' }
  ]
};

export const TEST_TDR: Tdr = {
  id: 1,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  missionObjet: null,
  structureId: 3,
  structureNom: 'Direction des Ressources Humaines',
  contexte: null,
  competence: null,
  perimetre: null,
  periodeObservation: null,
  lieu: null,
  methodologieTravail: null,
  resultatsAttendus: null,
  livrables: null,
  dateTdr: null,
  objectifs: [
    { id: 7, numero: 'OBJ-01', descriptions: 'S’assurer de la fiabilité des comptes.' },
    { id: 8, numero: 'OBJ-02', descriptions: 'S’assurer du respect des procédures.' }
  ]
};

const EMPTY_LINE_FIELDS = {
  faiblesseAConfirmer: null,
  responsable: 'Secrétaire DAAF',
  frequence: 'Hebdo',
  typeControle: 'Manuel',
  domaineCycle: 'Remboursements',
  risque: 'Perte des données',
  procedureTest: null,
  echantillonDescription: null,
  techniqueAudit: 'Interview',
  techniqueEchantillonnage: 'N/A'
};

export const TEST_PROGRAMME: ProgrammeTravail = {
  id: 20,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  missionObjet: null,
  structureId: 3,
  structureNom: 'Direction des Ressources Humaines',
  lignes: [
    {
      ...EMPTY_LINE_FIELDS,
      id: 31,
      numeroControle: 'C-02',
      objectifId: 8,
      objectifNumero: 'OBJ-02',
      objectifDescription: 'S’assurer du respect des procédures.',
      tacheOperation: 'T06 - Validation des paiements'
    },
    {
      ...EMPTY_LINE_FIELDS,
      id: 30,
      numeroControle: 'C-01',
      objectifId: 7,
      objectifNumero: 'OBJ-01',
      objectifDescription: 'S’assurer de la fiabilité des comptes.',
      tacheOperation: 'T05 - Enregistrement sous Excel'
    }
  ]
};

export const TEST_AUDIT_TEST: AuditTest = {
  id: 40,
  reference: 'TEST-001',
  ligneProgrammeId: 30,
  numeroControle: 'C-01',
  objectifId: 7,
  objectifNumero: 'OBJ-01',
  objectifDescription: 'S’assurer de la fiabilité des comptes.',
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  missionObjet: null,
  structureNom: 'Direction des Ressources Humaines',
  lieu: null,
  periodeObservation: null,
  tacheOperation: 'T05 - Enregistrement sous Excel',
  faiblesseAConfirmer: null,
  risque: 'Perte des données',
  domaineCycle: 'Remboursements',
  typeControle: 'Manuel',
  responsable: 'Secrétaire DAAF',
  frequence: 'Hebdo',
  echantillonDescription: null,
  techniqueEchantillonnage: null,
  procedureTest: null,
  dateTest: '2026-11-05',
  procedureRealisee: 'Vérification sur place.',
  resumeAnomalies: 'Pas d’antivirus.',
  resultatTest: 'INEFFECTIF',
  risqueMaitrise: false,
  recommandations: null,
  commentairesChefMission: null,
  commentairesSuperviseur: null,
  auditeurMissionPersonneId: 4,
  auditeurNom: 'Randria',
  auditeurPrenom: 'Hery',
  dateAudit: '2026-11-05',
  chefMissionMissionPersonneId: null,
  chefMissionNom: null,
  chefMissionPrenom: null,
  dateRevueChefMission: null,
  superviseurMissionPersonneId: null,
  superviseurNom: null,
  superviseurPrenom: null,
  dateRevueSuperviseur: null,
  echantillons: [{ id: 50, numero: 1, reference: 'ECH-001', anomalieDetectee: true, observation: 'Ordinateur sans mot de passe.' }]
};

export const TEST_CONSTAT: Constat = {
  id: 60,
  testId: 40,
  testReference: 'TEST-001',
  numeroControle: 'C-01',
  domaineCycle: 'Remboursements',
  objectifId: 7,
  objectifNumero: 'OBJ-01',
  objectifDescription: 'S’assurer de la fiabilité des comptes.',
  reference: 'CST-001',
  descriptions: 'Les ordinateurs ne sont pas protégés.',
  niveauRisque: 'ELEVE',
  directionServiceConcerne: 'DAAF',
  causes: [{ id: 1, descriptions: 'Absence de politique de sécurité.' }],
  risques: [{ id: 2, descriptions: 'Intrusion non autorisée.', niveau: 'ELEVE' }],
  consequences: [{ id: 3, descriptions: 'Modification des données.' }],
  recommandations: [
    { id: 4, description: 'Installer un antivirus.', retenue: true, maintenue: null },
    { id: 5, description: 'Former les agents.', retenue: false, maintenue: null }
  ]
};

export const TEST_CLOSING_REUNION: Reunion = {
  id: 41,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  type: 'CLOTURE',
  dateReunion: '2026-12-15',
  heureDebut: '09:00:00',
  heureFin: '11:00:00',
  heureLevee: '11:00:00',
  lieu: 'Salle de réunion de la DRH',
  observations: null,
  pointsDaiIntroduction: null,
  pointsDaiPresentationMission: null,
  pointsDaiMethodologie: null,
  pointsInterlocuteursIntroduction: null,
  pointsInterlocuteursProcessus: null,
  pointsInterlocuteursOrganisation: null,
  remerciements: 'Remerciements à la DRH.',
  rappelPerimetre: 'Gestion financière 2025.',
  syntheseConstats: 'CST-001 : Les ordinateurs ne sont pas protégés.',
  pointsFortsIdentifies: 'Équipe disponible.',
  resumeResultatsVerification: null,
  resumeRecommandationsPlansActions: 'Installer un antivirus.',
  observationsCommentaires: 'La DRH accepte les recommandations.',
  participants: [
    { id: 1, personneId: 5, nom: 'Ravelo', prenom: 'Tiana', matricule: null, fonction: 'Directeur des RH', service: 'DRH', role: 'POINT_FOCAL', typeParticipant: 'ENTITE_AUDITEE' },
    { id: 2, personneId: 2, nom: 'Rabe', prenom: 'Aina', matricule: null, fonction: 'Chef de service', service: 'DAI', role: 'CHEF_MISSION', typeParticipant: 'EQUIPE_DAI' }
  ]
};

export const TEST_RAPPORT: RapportAudit = {
  rapportId: 80,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  missionObjet: TEST_MISSION.objet,
  missionDateSignature: '2026-10-30',
  structureId: 3,
  structureNom: 'Direction des Ressources Humaines',
  titre: 'RAPPORT D’AUDIT SUR Contrôle des procédures comptables.',
  motifs: 'Programme annuel de la DAI.',
  nature: 'Audit de conformité',
  referenceOm: '005',
  dateOm: '2026-10-30',
  versionRapport: 'definitif',
  dateEmission: '2026-12-20',
  proprietaireDocument: 'Direction de l’Audit Interne',
  destinataires: 'Autorités Supérieures\nDirection des Ressources Humaines',
  classification: 'Non public'
};

export const TEST_TABLEAU: TableauRecommandations = {
  missionId: 10,
  missionIntitule: TEST_MISSION.intitule,
  structureId: 3,
  structureNom: 'Direction des Ressources Humaines',
  lignes: [
    {
      constatId: 60,
      constatReference: 'CST-001',
      anomalie: 'Les ordinateurs ne sont pas protégés.',
      recommandationId: 4,
      recommandation: 'Installer un antivirus.',
      reponseId: null,
      reponse: null,
      dateReponse: null,
      recommandationMaintenue: null
    },
    {
      constatId: 62,
      constatReference: 'CST-002',
      anomalie: 'Pas de sauvegarde.',
      recommandationId: 9,
      recommandation: 'Sauvegarder chaque semaine.',
      reponseId: 90,
      reponse: 'Sauvegarde mise en place.',
      dateReponse: '2026-12-10',
      recommandationMaintenue: false
    }
  ]
};