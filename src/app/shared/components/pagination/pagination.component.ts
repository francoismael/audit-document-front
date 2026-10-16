import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  readonly currentPage = input<number>(1);
  readonly totalItems = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => {
    const size = this.pageSize();

    if (size <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = Math.min(
      Math.max(1, this.currentPage()),
      total
    );

    const start = Math.max(
      1,
      Math.min(current - 2, total - 4)
    );

    const end = Math.min(total, start + 4);
    const pages: number[] = [];

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  });

  readonly firstItem = computed(() => {
    if (this.totalItems() === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly lastItem = computed(() => {
    return Math.min(
      this.currentPage() * this.pageSize(),
      this.totalItems()
    );
  });

  goToPage(page: number): void {
    if (
      page >= 1 &&
      page <= this.totalPages() &&
      page !== this.currentPage()
    ) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const newSize = Number(target.value);

    if (
      this.pageSizeOptions().includes(newSize) &&
      newSize > 0 &&
      newSize !== this.pageSize()
    ) {
      this.pageSizeChange.emit(newSize);
    }
  }
}