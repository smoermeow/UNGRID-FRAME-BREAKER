
export interface ExtractedPanel {
  id: string;
  index: number; // 0-24
  originalUrl: string; // The extracted base64 image (upscaled via canvas)
  aiGeneratedUrl?: string; // The result from Gemini re-imagination
  aiDescription?: string; // The result from Gemini analysis
  status: 'idle' | 'analyzing' | 'generating' | 'error' | 'success';
}

export type FixType = 'face' | 'line';

export interface FaceTarget {
  id: string;
  targetUrl: string;    // The cropped face or body
  referenceUrl: string; // The reference for this specific character
  fixType: FixType;     // The mode selected for this job
  position: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  result: string | null;
}

export interface ChainStep {
  id: string;
  instruction: string; // e.g. "Denoise", "Fix Eyes"
  status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
  resultUrl?: string; // The image resulting from this specific step
}

export type Resolution = '1K' | '2K' | '4K';
export type AspectRatio = '16:9' | '1:1' | '9:16' | '21:9';
export type ProcessingMode = 'fidelity' | 'creative';
export type GridLayout = '3x3' | '2x2' | '1x3' | '1x4' | '2x4' | '5x5' | 'irregular';

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
