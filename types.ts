
export enum FileStatus {
  PENDING = 'Pending Analysis',
  ANALYZING = 'Analyzing',
  ANALYZED = 'Analysis Complete',
  RENAMED = 'Downloaded',
  ERROR = 'Error',
}

export interface ProcessedFile {
  id: string;
  originalFile: File;
  originalName: string;
  suggestedName: string;
  status: FileStatus;
  progress: number; // 0-100
  isSelected: boolean;
  errorMessage?: string; // Optional error message for individual files
}
    