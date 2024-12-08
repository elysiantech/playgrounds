
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

interface AspectRatio {
  ratio: string;
  label: string;
  width: number;
  height: number;
}
export const aspectRatios: AspectRatio[] = [
  { ratio: "1:1", label: "Square (Social Media)", width: 768, height: 768 },
  { ratio: "4:3", label: "Classic (Standard)", width: 1024, height: 768 },
  { ratio: "5:4", label: "Photo (Large Format)", width: 1120, height: 896 },
  { ratio: "16:9", label: "Widescreen (Desktop)", width: 1344, height: 736 },
  { ratio: "9:16", label: "Portrait (Mobile)", width: 736, height: 1344 },
];