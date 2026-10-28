import { Component, effect, input, signal } from '@angular/core';

type ScrollPosition = 'none' | 'top' | 'middle' | 'bottom';

// Distance (px) from an end under which the area is considered at that end.
const EDGE = 8;

// Round button that replaces the vertical scrollbar of an area: ↓ at the top, ↑ at the bottom, both in one circle in between.
// The parent of the component must be positioned (position: relative), and must not be the scrolling area itself.
@Component({
  selector: 'app-scroll-navigator',
  standalone: true,
  templateUrl: './scroll-navigator.component.html',
  styleUrl: './scroll-navigator.component.scss'
})
export class ScrollNavigatorComponent {
  readonly target = input.required<HTMLElement>();

  readonly position = signal<ScrollPosition>('none');

  constructor() {
    effect((onCleanup) => {
      const target = this.target();
      const update = (): void => this.position.set(readPosition(target));

      // The content changes height when the page changes or loads its data.
      const resizeObserver = new ResizeObserver(update);
      const mutationObserver = new MutationObserver(update);

      target.addEventListener('scroll', update, { passive: true });
      resizeObserver.observe(target);
      mutationObserver.observe(target, { childList: true, subtree: true });
      update();

      onCleanup(() => {
        target.removeEventListener('scroll', update);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      });
    });
  }

  scrollToTop(): void {
    this.target().scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom(): void {
    const target = this.target();
    target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' });
  }
}

function readPosition(target: HTMLElement): ScrollPosition {
  const maxScroll = target.scrollHeight - target.clientHeight;

  if (maxScroll <= EDGE) {
    return 'none';
  }

  if (target.scrollTop <= EDGE) {
    return 'top';
  }

  return target.scrollTop >= maxScroll - EDGE ? 'bottom' : 'middle';
}
