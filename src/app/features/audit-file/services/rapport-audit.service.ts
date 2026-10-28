import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { RapportAudit, RapportAuditRequest } from '../models/rapport-audit.model';

@Injectable({
  providedIn: 'root'
})
export class RapportAuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/rapports`;

  // One report per mission. The API answers 404 while there is none: that is "no report yet", not an error.
  getByMission(missionId: number): Observable<RapportAudit | null> {
    return this.http.get<RapportAudit>(`${this.baseUrl}/mission/${missionId}`).pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error)
      )
    );
  }

  create(request: RapportAuditRequest): Observable<RapportAudit> {
    return this.http.post<RapportAudit>(this.baseUrl, request);
  }

  // The API has no deletion of a report.
  update(rapportId: number, request: RapportAuditRequest): Observable<RapportAudit> {
    return this.http.put<RapportAudit>(`${this.baseUrl}/${rapportId}`, request);
  }
}
