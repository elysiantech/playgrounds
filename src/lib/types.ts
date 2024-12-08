
export interface ImageData {
  id?: string;
  url: string;
  prompt: string;
  creativity: number;
  steps: number;
  seed: string;
  refImage?: string;
  aspectRatio?:string;
  numberOfImages: number;
  bookmark?: boolean;
  metadata: Record<string, string | number>;
  model: string
}

export interface GenerateImageParams {
  prompt?: string;
  creativity: number;
  steps: number;
  seed: string;
  refImage?: string; 
  model: string;
  numberOfImages: number;
  aspectRatio?:string;
}
