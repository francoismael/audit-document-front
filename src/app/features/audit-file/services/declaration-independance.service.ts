import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import {
  DeclarationIndependance,
  DeclarationIndependanceRequest
} from '../models/declaration-independance.model';

@Injectable({
  providedIn: 'root'
})
export class DeclarationIndependanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/declarations-independance`;

  // The API has no mission filter: the list is filtered here.
  getByMission(missionId: number): Observable<DeclarationIndependance[]> {
    return this.http
      .get<DeclarationIndependance[]>(this.baseUrl)
      .pipe(map((declarations) => declarations.filter((declaration) => declaration.missionId === missionId)));
  }

  create(request: DeclarationIndependanceRequest): Observable<DeclarationIndependance> {
    return this.http.post<DeclarationIndependance>(this.baseUrl, request);
  }

  update(declarationId: number, request: DeclarationIndependanceRequest): Observable<DeclarationIndependance> {
    return this.http.put<DeclarationIndependance>(`${this.baseUrl}/${declarationId}`, request);
  }

  delete(declarationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${declarationId}`);
  }
}
