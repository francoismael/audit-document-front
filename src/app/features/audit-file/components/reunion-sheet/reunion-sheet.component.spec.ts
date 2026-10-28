import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reunion } from '../../models/reunion.model';
import { TEST_CLOSING_REUNION } from '../../testing/audit-file-test-data';
import { ReunionSheetComponent } from './reunion-sheet.component';

@Component({
  standalone: true,
  imports: [ReunionSheetComponent],
  template: `
    <app-reunion-sheet [reunion]="reunion" title="PV de test" objet="Restitution">
      <p class="projected">Points abordés</p>
    </app-reunion-sheet>
  `
})
class HostComponent {
  reunion: Reunion = { ...TEST_CLOSING_REUNION, participants: [] };
}

describe('ReunionSheetComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should show the meeting, its projected points and placeholders for missing attendees', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';

    expect(text).toContain('- 15/12/2026 -');
    expect(text).toContain('Objet : Restitution');
    expect(text).toContain('Points abordés');
    expect(text).toContain('[Aucun représentant indiqué]');
    expect(text).toContain('La séance a été levée à 11h00.');
  });
});
