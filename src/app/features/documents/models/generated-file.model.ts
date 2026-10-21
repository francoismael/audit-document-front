export interface GeneratedFile {
  fileName: string;
  // Id of the entry created in the document history.
  documentId: number | null;
  content: Blob;
}
