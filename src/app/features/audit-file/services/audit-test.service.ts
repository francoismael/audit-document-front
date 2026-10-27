import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { AuditTest, AuditTestRequest } from '../models/audit-test.model';

@Injectable({
  providedIn: 'root'
})
export class AuditTestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/tests`;

  // A test has no mission id: the tests of a mission are those on the lines of its programme.
  getByProgrammeLines(ligneProgrammeIds: number[]): Observable<AuditTest[]> {
    const ids = new Set(ligneProgrammeIds);

    return this.http
      .get<AuditTest[]>(this.baseUrl)
      .pipe(map((tests) => tests.filter((test) => ids.has(test.ligneProgrammeId))));
  }

  create(request: AuditTestRequest): Observable<AuditTest> {
    return this.http.post<AuditTest>(this.baseUrl, request);
  }

  update(testId: number, request: AuditTestRequest): Observable<AuditTest> {
    return this.http.put<AuditTest>(`${this.baseUrl}/${testId}`, request);
  }

  delete(testId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${testId}`);
  }
}
