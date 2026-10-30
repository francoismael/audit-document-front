import { GeneratedDocument } from '../../document-history/models/generated-document.model';
import { MissionProgress, Statistics } from '../models/statistics.model';

const DOCUMENT: GeneratedDocument = {
  id: 1,
  documentTypeId: 1,
  documentTypeCode: 'NOTE',
  documentTypeNom: 'Note de service',
  missionId: 10,
  missionNumero: '005',
  missionIntitule: 'Audit de la gestion financière',
  nomFichier: 'note-de-service.pdf',
  taille: 2048,
  templateVersion: 1,
  dateGeneration: '2026-10-20T14:30:00',
  valeurs: {}
};

export const TEST_DOCUMENTS: GeneratedDocument[] = [
  DOCUMENT,
  { ...DOCUMENT, id: 2, nomFichier: 'note-2.pdf', dateGeneration: '2026-10-05T09:00:00' },
  { ...DOCUMENT, id: 3, documentTypeId: 2, documentTypeNom: 'Lettre', nomFichier: 'lettre.pdf', dateGeneration: '2026-09-12T11:00:00' },
  { ...DOCUMENT, id: 4, missionId: null, missionNumero: null, missionIntitule: null, dateGeneration: '2025-12-01T08:00:00' }
];

// 12 months ending in October 2026, as GET /statistiques gives them.
const MONTHS = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

export const TEST_STATISTICS: Statistics = {
  nombreMissions: 8,
  missionsEnCours: 3,
  missionsAVenir: 2,
  missionsTerminees: 2,
  missionsSansDates: 1,
  nombreTypesDocuments: 3,
  nombreTypesActifs: 2,
  nombreDocumentsGeneres: 4,
  documentsParType: [
    { documentTypeId: 1, code: 'NOTE', nom: 'Note de service', nombre: 3 },
    { documentTypeId: 2, code: 'LETTRE', nom: 'Lettre', nombre: 1 }
  ],
  documentsParMois: MONTHS.map((mois) => ({ mois, nombre: { '2025-12': 1, '2026-09': 1, '2026-10': 2 }[mois] ?? 0 })),
  derniersDocuments: TEST_DOCUMENTS.slice(0, 3)
};

const PROGRESS: MissionProgress = {
  missionId: 10,
  missionNumero: '005',
  missionIntitule: 'Audit de la gestion financière',
  documentsCompletes: 3,
  documentsAttendus: 7,
  pourcentage: 42.9,
  tdr: true,
  programme: true,
  tests: true,
  constats: false,
  rapport: false,
  pvAffirmation: false,
  pvCloture: false
};

export const TEST_PROGRESS: MissionProgress[] = [
  PROGRESS,
  {
    ...PROGRESS,
    missionId: 11,
    missionNumero: '006',
    missionIntitule: 'Audit des marchés publics',
    documentsCompletes: 7,
    pourcentage: 100,
    constats: true,
    rapport: true,
    pvAffirmation: true,
    pvCloture: true
  },
  { ...PROGRESS, missionId: 12, missionNumero: '007', missionIntitule: 'Audit SI', documentsCompletes: 1, pourcentage: 14.3, programme: false, tests: false }
];
