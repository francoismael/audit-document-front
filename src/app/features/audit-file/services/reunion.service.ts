import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { MissionReunions, Reunion, ReunionRequest } from '../models/reunion.model';

@Injectable({
  providedIn: 'root'
})
export class ReunionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/reunions`;

  // The API has no mission filter: the list is filtered here (one meeting of each type per mission).
  getByMission(missionId: number): Observable<MissionReunions> {
    return this.http.get<Reunion[]>(this.baseUrl).pipe(
      map((reunions) => {
        const ofMission = reunions.filter((reunion) => reunion.missionId === missionId);

        return {
          ouverture: ofMission.find((reunion) => reunion.type === 'OUVERTURE') ?? null,
          cloture: ofMission.find((reunion) => reunion.type === 'CLOTURE') ?? null
        };
      })
    );
  }

  create(request: ReunionRequest): Observable<Reunion> {
    return this.http.post<Reunion>(this.baseUrl, request);
  }

  update(reunionId: number, request: ReunionRequest): Observable<Reunion> {
    return this.http.put<Reunion>(`${this.baseUrl}/${reunionId}`, request);
  }

  delete(reunionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reunionId}`);
  }
}
