
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
  createdAt?: Date
  maskImage?: string
  likes:number;
}

export interface Generation {
  images: ImageData[],
  createdAt: Date
}

export interface GenerateImageParams {
  prompt?: string;
  creativity: number;
  steps: number;
  seed: string;
  model: string;
  numberOfImages: number;
  aspectRatio?:string;
  refImage?: string; 
  maskImage?: string;
}

export interface GenerateVideoParams extends GenerateImageParams {
  duration?: number;
}

export interface VideoData extends ImageData {
  duration?: number;
};


interface AspectRatio {
  ratio: string;
  label: string;
  width: number;
  height: number;
}
export const aspectRatios: AspectRatio[] = [
  { ratio: "1:1", label: "Square (Social Media)", width: 768, height: 768 },
  { ratio: "3:2", label: "Photo (35mm Still)", width: 1216, height: 832 },
  { ratio: "4:3", label: "Classic (Standard TV)", width: 1024, height: 768 },
  { ratio: "5:4", label: "Photo (Large Format)", width: 1120, height: 896 },
  { ratio: "16:9", label: "Widescreen (Desktop)", width: 1376, height: 768 },
  { ratio: "21:9", label: "Ultrawide (Cinematic/Monitor)", width: 1536, height: 640 },
  { ratio: "9:16", label: "Portrait (Mobile)", width: 736, height: 1344 },
];

type ModelType = 'Flux.1-Schnell' | 'Flux.1-dev' | 'Flux.1-Pro' | 'Recraft 20B' | 'Nvidia Sana';
export const imageModelMap: Record<ModelType, string> = {
  "Flux.1-Schnell": "Flux.1-Schnell",
  "Flux.1-dev": "Flux.1-dev",
  "Flux.1-Pro": "Flux.1-Pro",
  "Recraft 20B": "Recraft 20B",
  "Nvidia Sana": "Nvidia Sana",
}

type VideoModelType = 'MiniMax' | 'Kling-1' | 'CogVideoX-5B' | 'Hapier-v2';
export const videoModelMap: Record<VideoModelType, string> = {
  'MiniMax': 'MiniMax',
  'Kling-1': 'Kling-1',
  'CogVideoX-5B': 'CogVideoX-5B',
  'Hapier-v2': 'Hapier-v2'
}
export const StyleToPromptMap = {
  none: '',
  photorealistic: ', photorealistic, highly detailed, 8k, sharp focus, perfect lighting, high quality, professional',
  'comic-book': 'comic book, bold outlines, flat colors, action lines',
  'neon-punk': ', cyberpunk, neon lights, high contrast, futuristic',
  isometric: 'isometric projection, 3D geometric style',
  'line-art': 'line art, black and white, clean lines, minimalist',
  'pixel-art': 'pixel art, pixel illustration, pixel drawing, pixel graphic novel, pixel superhero',
  '3d-model': '3d model, realistic textures, studio lighting',
}