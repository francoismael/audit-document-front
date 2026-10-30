import { Component, computed, input } from '@angular/core';

// Horizontal progress bar, from 0 to 100 %.
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  // 'sm': a thin bar, for lists (dashboard).
  readonly size = input<'sm' | 'md'>('md');

  readonly percent = computed(() => Math.min(100, Math.max(0, this.value())));
}
