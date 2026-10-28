import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { Reponse, ReponseRequest, TableauRecommandations } from '../models/tableau-recommandations.model';

@Injectable({
  providedIn: 'root'
})
export class TableauRecommandationsService {
  private readonly http = inject(HttpClient);

  // The retained recommendation of each constat of the mission, built by the backend.
  getByMission(missionId: number): Observable<TableauRecommandations> {
    return this.http.get<TableauRecommandations>(`${API_BASE_URL}/tableau-recommandations/mission/${missionId}`);
  }

  createReponse(request: ReponseRequest): Observable<Reponse> {
    return this.http.post<Reponse>(`${API_BASE_URL}/reponses`, request);
  }

  updateReponse(reponseId: number, request: ReponseRequest): Observable<Reponse> {
    return this.http.put<Reponse>(`${API_BASE_URL}/reponses/${reponseId}`, request);
  }

  // Deleting the last response also clears the maintenance decision (backend rule).
  deleteReponse(reponseId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/reponses/${reponseId}`);
  }

  // Only possible once the entity has answered.
  decideMaintien(recommandationId: number, maintenue: boolean): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/recommandations/${recommandationId}/maintien`, { maintenue });
  }
}
