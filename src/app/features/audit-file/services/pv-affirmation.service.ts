import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { PvAffirmation, PvAffirmationRequest } from '../models/pv-affirmation.model';

@Injectable({
  providedIn: 'root'
})
export class PvAffirmationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/pv-affirmations`;

  // One PV per mission. The API answers 404 while there is none: that is "no PV yet", not an error.
  getByMission(missionId: number): Observable<PvAffirmation | null> {
    return this.http.get<PvAffirmation>(`${this.baseUrl}/mission/${missionId}`).pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error)
      )
    );
  }

  create(request: PvAffirmationRequest): Observable<PvAffirmation> {
    return this.http.post<PvAffirmation>(this.baseUrl, request);
  }

  update(pvId: number, request: PvAffirmationRequest): Observable<PvAffirmation> {
    return this.http.put<PvAffirmation>(`${this.baseUrl}/${pvId}`, request);
  }

  delete(pvId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${pvId}`);
  }
}
