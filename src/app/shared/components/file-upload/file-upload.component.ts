import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  readonly acceptedExtensions = input<string[]>(['.docx']);
  readonly maxSizeMB = input<number>(10);
  readonly disabled = input<boolean>(false);
  readonly title = input<string>('Déposer votre fichier ici');
  readonly description = input<string>(
    'Glissez-déposez un fichier ou sélectionnez-le depuis votre ordinateur.'
  );

  readonly fileSelected = output<File>();
  readonly fileRemoved = output<void>();

  readonly selectedFile = signal<File | null>(null);
  readonly errorMessage = signal('');
  readonly isDragging = signal(false);

  onFileInput(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const file = target.files?.item(0);

    if (file) {
      this.processFile(file);
    }

    // Allows selecting the same file again.
    target.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    if (!this.disabled()) {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    if (this.disabled()) {
      return;
    }

    const file = event.dataTransfer?.files.item(0);

    if (file) {
      this.processFile(file);
    }
  }

  removeFile(): void {
    if (this.disabled()) {
      return;
    }

    this.selectedFile.set(null);
    this.errorMessage.set('');
    this.fileRemoved.emit();
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} octets`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} Ko`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} Mo`;
  }

  get acceptAttribute(): string {
    return this.acceptedExtensions().join(',');
  }

  private processFile(file: File): void {
    if (this.disabled()) {
      return;
    }

    this.errorMessage.set('');

    const extension = this.getExtension(file.name);
    const allowedExtensions = this.acceptedExtensions().map(
      (item) => item.toLowerCase()
    );

    if (!allowedExtensions.includes(extension)) {
      this.errorMessage.set(
        `Format non autorisé. Formats acceptés : ${allowedExtensions.join(', ')}.`
      );
      return;
    }

    if (this.maxSizeMB() <= 0) {
      this.errorMessage.set(
        'La taille maximale configurée est invalide.'
      );
      return;
    }

    const maxSizeBytes = this.maxSizeMB() * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      this.errorMessage.set(
        `Le fichier dépasse la taille maximale de ${this.maxSizeMB()} Mo.`
      );
      return;
    }

    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  private getExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');

    if (lastDotIndex < 0) {
      return '';
    }

    return fileName.substring(lastDotIndex).toLowerCase();
  }
}