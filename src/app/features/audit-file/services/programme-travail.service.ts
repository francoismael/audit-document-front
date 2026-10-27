import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { ProgrammeTravail, ProgrammeTravailRequest } from '../models/programme-travail.model';

@Injectable({
  providedIn: 'root'
})
export class ProgrammeTravailService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/programmes-travail`;

  // One programme per mission; the API has no mission filter.
  getByMission(missionId: number): Observable<ProgrammeTravail | null> {
    return this.http
      .get<ProgrammeTravail[]>(this.baseUrl)
      .pipe(map((programmes) => programmes.find((programme) => programme.missionId === missionId) ?? null));
  }

  create(request: ProgrammeTravailRequest): Observable<ProgrammeTravail> {
    return this.http.post<ProgrammeTravail>(this.baseUrl, request);
  }

  update(programmeId: number, request: ProgrammeTravailRequest): Observable<ProgrammeTravail> {
    return this.http.put<ProgrammeTravail>(`${this.baseUrl}/${programmeId}`, request);
  }

  delete(programmeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${programmeId}`);
  }
}
