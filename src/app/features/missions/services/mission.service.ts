import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { CreatedMission, Mission, MissionRequest } from '../models/mission.model';
import { MissionPersonne } from '../models/mission-personne.model';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/missions`;

  getAll(): Observable<Mission[]> {
    return this.http.get<Mission[]>(this.baseUrl);
  }

  getById(missionId: number): Observable<Mission> {
    return this.http.get<Mission>(`${this.baseUrl}/${missionId}`);
  }

  create(request: MissionRequest): Observable<CreatedMission> {
    return this.http.post<CreatedMission>(this.baseUrl, request);
  }

  update(missionId: number, request: MissionRequest): Observable<Mission> {
    return this.http.put<Mission>(`${this.baseUrl}/${missionId}`, request);
  }

  delete(missionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${missionId}`);
  }

  // Team with the missionPersonneId expected by the business documents (steps 12 to 22).
  getTeam(missionId: number): Observable<MissionPersonne[]> {
    return this.http.get<MissionPersonne[]>(`${API_BASE_URL}/mission-personnes/mission/${missionId}`);
  }
}
