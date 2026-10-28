import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TEST_MISSION } from '../../testing/audit-file-test-data';
import { AttendeeToggle, ReunionAttendeesComponent } from './reunion-attendees.component';

describe('ReunionAttendeesComponent', () => {
  let fixture: ComponentFixture<ReunionAttendeesComponent>;
  let element: HTMLElement;

  const pointsFocaux = TEST_MISSION.personnes.filter((member) => member.roles === 'POINT_FOCAL');
  const dai = TEST_MISSION.personnes.filter((member) => member.roles === 'CHEF_MISSION');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReunionAttendeesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ReunionAttendeesComponent);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('idPrefix', 'pv');
    fixture.componentRef.setInput('entiteMembers', pointsFocaux);
    fixture.componentRef.setInput('daiMembers', dai);
    fixture.componentRef.setInput('selectedEntite', new Set([5]));
    fixture.componentRef.setInput('selectedDai', new Set<number>());
    fixture.detectChanges();
  });

  it('should check the selected attendees and tell which one was toggled', () => {
    const toggles: AttendeeToggle[] = [];
    fixture.componentInstance.toggled.subscribe((toggle) => toggles.push(toggle));

    expect((element.querySelector('#pv-entite-5') as HTMLInputElement).checked).toBeTrue();

    const daiBox = element.querySelector('#pv-dai-2') as HTMLInputElement;
    daiBox.click();

    expect(toggles).toEqual([{ type: 'EQUIPE_DAI', personneId: 2, checked: true }]);
  });

  it('should tell how to add a point focal when the mission has none', () => {
    fixture.componentRef.setInput('entiteMembers', []);
    fixture.detectChanges();

    expect(element.textContent).toContain("Aucun point focal dans l'équipe de la mission.");
  });
});
