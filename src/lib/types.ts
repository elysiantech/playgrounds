
export interface ImageData {
  id?: string;
  url: string;
  prompt: string;
  creativity: number;
  steps: number;
  seed: string;
  refImage?: string;
  numberOfImages: number;
  bookmark?: boolean;
  metadata: Record<string, string | number>;
  model: string
}
