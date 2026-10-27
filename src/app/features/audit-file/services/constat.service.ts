import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { Constat, ConstatRequest } from '../models/constat.model';

@Injectable({
  providedIn: 'root'
})
export class ConstatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/constats`;

  // A constat has no mission id: the constats of a mission are those on its tests.
  getByTests(testIds: number[]): Observable<Constat[]> {
    const ids = new Set(testIds);

    return this.http
      .get<Constat[]>(this.baseUrl)
      .pipe(map((constats) => constats.filter((constat) => ids.has(constat.testId))));
  }

  create(request: ConstatRequest): Observable<Constat> {
    return this.http.post<Constat>(this.baseUrl, request);
  }

  update(constatId: number, request: ConstatRequest): Observable<Constat> {
    return this.http.put<Constat>(`${this.baseUrl}/${constatId}`, request);
  }

  delete(constatId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${constatId}`);
  }
}
