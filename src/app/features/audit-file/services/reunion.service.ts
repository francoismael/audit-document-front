import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { OpeningReunionRequest, Reunion, ReunionType } from '../models/reunion.model';

@Injectable({
  providedIn: 'root'
})
export class ReunionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/reunions`;

  // The API has no mission filter: the list is filtered here (one meeting of each type per mission).
  getByMission(missionId: number, type: ReunionType): Observable<Reunion | null> {
    return this.http
      .get<Reunion[]>(this.baseUrl)
      .pipe(
        map((reunions) => reunions.find((reunion) => reunion.missionId === missionId && reunion.type === type) ?? null)
      );
  }

  create(request: OpeningReunionRequest): Observable<Reunion> {
    return this.http.post<Reunion>(this.baseUrl, request);
  }

  update(reunionId: number, request: OpeningReunionRequest): Observable<Reunion> {
    return this.http.put<Reunion>(`${this.baseUrl}/${reunionId}`, request);
  }

  delete(reunionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reunionId}`);
  }
}
