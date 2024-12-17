'use client'

import { useState } from 'react';
import { ImageData } from '@/lib/types';
import { GenerateImageParams } from '@/lib/types';

interface GeneratedImage {
  id:string;
  url: string;
  metadata: Record<string, string>;
  bookmark?:boolean;
}

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base function to handle fetch requests
  const baseFetch = async <T>(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    body?: object | FormData,
    headers: Record<string, string> = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
  
    try {
      const isFormData = body instanceof FormData;
      const response = await fetch(url, {
        method,
        headers: isFormData ? undefined : { 'Content-Type': 'application/json', ...headers },
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      });
  
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
  
      return (await response.json()) as T;
    } catch (err) {
      setError((err as Error).message || 'Request failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const enhancePrompt = async (prompt: string): Promise<string> => {
    const data = await baseFetch<{ enhancedPrompt: string }>('/api/ai/enhance-prompt', 'POST', { prompt });
    return data.enhancedPrompt;
  };

  const generateImage = async (params: GenerateImageParams): Promise<GeneratedImage> => {
    return baseFetch<GeneratedImage>('/api/ai/generate-image', 'POST', params);
  };

  const upscaleImage = async (id: string): Promise<GeneratedImage> => {
    return baseFetch<GeneratedImage>(`/api/ai/images/${id}/upscale`, 'POST', { factor: 8 });
  };

  const fillImage = async (params: GenerateImageParams): Promise<GeneratedImage> => {
    return baseFetch<GeneratedImage>('/api/ai/fill-image', 'POST', params);
  };

  const deleteImage = async (id: string): Promise<void> => {
    await baseFetch<void>(`/api/images/${id}`, 'DELETE');
  };

  const updateImage = async (id: string, updates: Partial<GeneratedImage>): Promise<GeneratedImage> => {
    return baseFetch<GeneratedImage>(`/api/images/${id}`, 'PATCH', updates);
  };

  const getImages = async (
    isPublic: boolean = false,
    offset?: number,
    limit?: number
  ): Promise<ImageData[]> => {
    const query = new URLSearchParams();
    if (offset) query.set('offset', offset.toString());
    if (limit) query.set('limit', limit.toString());
  
    const apiRoute = isPublic
      ? `/api/public/images?${query.toString()}`
      : `/api/images`;
  
    // Fetch images using baseFetch
    const images = await baseFetch<ImageData[]>(apiRoute, 'GET');
    
    // Process and map image data
    return images
      .filter((image) => image.url)
      .map((image) => ({
        id: image.id,
        url: image.url,
        prompt: image.prompt,
        model: image.model,
        creativity: image.creativity,
        steps: image.steps,
        seed: image.seed,
        refImage: image.refImage ?? undefined,
        metadata: image.metadata,
        bookmark: image.bookmark,
        numberOfImages: 1,
        createdAt: image.createdAt ?? undefined,
      }));
  };

  const promptFromImage = async (file: File): Promise<string> => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the maximum allowed size of 10MB");
      return Promise.reject("File size too large");
    }
    const formData = new FormData();
    formData.append('file', file);
    const data = await baseFetch<{ prompt: string }>('/api/ai/analyze-image', 'POST', formData);  
    return data.prompt;
  };

  return {
    enhancePrompt,
    promptFromImage,
    generateImage,
    updateImage,
    deleteImage,
    upscaleImage,
    getImages,
    fillImage,
    isLoading,
    error,
  };
}

