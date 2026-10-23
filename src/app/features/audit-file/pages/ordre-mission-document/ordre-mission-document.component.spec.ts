import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION } from '../../testing/audit-file-test-data';
import { OrdreMissionDocumentComponent } from './ordre-mission-document.component';

describe('OrdreMissionDocumentComponent', () => {
  let fixture: ComponentFixture<OrdreMissionDocumentComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdreMissionDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    TestBed.inject(AuditFileStore).mission.set(TEST_MISSION);
    fixture = TestBed.createComponent(OrdreMissionDocumentComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should write the mission order from the team of the mission', () => {
    const text = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';

    expect(text).toContain('N° 005-2026-MEF/DAI');
    expect(text).toContain('Antananarivo, le 30/10/2026');
    expect(text).toContain('Les Chefs de mission');
    expect(text).toContain('Rabe Aina');
    expect(text).toContain("Sous l'égide de Rakoto Jean, Directeur de l'Audit Interne, et sous la supervision de Rasoa Lova, Inspecteur ;");
    expect(text).toContain('auprès de Direction des Ressources Humaines');
    // The point focal belongs to the audited entity, not to the audit team.
    expect(text).not.toContain('Ravelo');
  });
});
