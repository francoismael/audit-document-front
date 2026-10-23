import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { Tdr, TdrRequest } from '../models/tdr.model';

@Injectable({
  providedIn: 'root'
})
export class TdrService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/tdrs`;

  // The API has no mission filter: the list is filtered here (one TDR per mission).
  getByMission(missionId: number): Observable<Tdr | null> {
    return this.http
      .get<Tdr[]>(this.baseUrl)
      .pipe(map((tdrs) => tdrs.find((tdr) => tdr.missionId === missionId) ?? null));
  }

  create(request: TdrRequest): Observable<Tdr> {
    return this.http.post<Tdr>(this.baseUrl, request);
  }

  update(tdrId: number, request: TdrRequest): Observable<Tdr> {
    return this.http.put<Tdr>(`${this.baseUrl}/${tdrId}`, request);
  }

  delete(tdrId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tdrId}`);
  }
}
