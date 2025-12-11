export interface ExtractedPanel {
  id: string;
  index: number; // 0-8
  originalUrl: string; // The extracted base64 image (upscaled via canvas)
  aiGeneratedUrl?: string; // The result from Gemini re-imagination
  aiDescription?: string; // The result from Gemini analysis
  status: 'idle' | 'analyzing' | 'generating' | 'error' | 'success';
}

export type Resolution = '1K' | '2K' | '4K';
export type AspectRatio = '16:9' | '1:1';
export type ProcessingMode = 'fidelity' | 'creative';
export type GridLayout = '3x3' | '2x2' | 'irregular';

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface GridConfig {
  rows: number;
  cols: number;
  targetWidth: number;
  targetHeight: number;
  boundingBoxes?: BoundingBox[];
}

export enum GeminiAction {
  DESCRIBE = 'DESCRIBE',
  REIMAGINE = 'REIMAGINE'
}