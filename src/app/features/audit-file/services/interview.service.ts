import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { Interview, InterviewRequest } from '../models/interview.model';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/interviews`;

  // The API has no mission filter: the list is filtered here.
  getByMission(missionId: number): Observable<Interview[]> {
    return this.http
      .get<Interview[]>(this.baseUrl)
      .pipe(map((interviews) => interviews.filter((interview) => interview.missionId === missionId)));
  }

  create(request: InterviewRequest): Observable<Interview> {
    return this.http.post<Interview>(this.baseUrl, request);
  }

  update(interviewId: number, request: InterviewRequest): Observable<Interview> {
    return this.http.put<Interview>(`${this.baseUrl}/${interviewId}`, request);
  }

  delete(interviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${interviewId}`);
  }
}
