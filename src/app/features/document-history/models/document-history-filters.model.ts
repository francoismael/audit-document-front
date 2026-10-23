// Filters sent to the API; null means "all".
export interface DocumentHistoryFilters {
  documentTypeId: number | null;
  missionId: number | null;
}
