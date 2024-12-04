'use client'

import { useState } from 'react';
import { ImageData } from '@/lib/types';

interface GenerateImageParams {
  prompt: string;
  creativity: number;
  steps: number;
  seed: string;
  model:string;
  refImage?: string;
  numberOfImages: number;
}

interface GeneratedImage {
  id:string;
  url: string;
  metadata: Record<string, string>;
  bookmark?:boolean;
}

export function useAIPlayground() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhancePrompt = async (prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      return data.enhancedPrompt;
    } catch (error) {
      setError('Failed to enhance prompt');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createImage = async (imageData: GenerateImageParams & GeneratedImage) => {
    setIsLoading(true);
    setError(null);
    const { url, prompt,creativity, steps, seed, model, metadata, bookmark } = imageData;
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, prompt, creativity, steps, seed, model, metadata, bookmark }),
      });

      if (!response.ok) {
        throw new Error('Failed to save image to database');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      setError('Failed to save image to database');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async (params: GenerateImageParams): Promise<GeneratedImage> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      // return data.image;
      // Save the generated image to the database
      const savedImage = await createImage({
        ...params,
        url: data.image.url,
        metadata: data.image.metadata,
        bookmark: false, 
        id:"",
      });
      return { ...data.image, id: savedImage.id };
    } catch (error) {
      setError('Failed to generate image');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const upscaleImage = async (id: string): Promise<GeneratedImage> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/images/${id}/upscale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor:8 }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to upscale image');
      }
  
      const newImage = await response.json();
      return newImage;
    } catch (error) {
      setError('Failed to upscale image');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      setError('Failed to delete image');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateImage = async (id: string, updates: Partial<GeneratedImage>): Promise<GeneratedImage> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      const updatedImage = await response.json();
      return updatedImage;
    } catch (error) {
      setError('Failed to update image');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getImages = async (isPublic: boolean=false, offset?: number, limit?: number): Promise<ImageData[]> => {
    setIsLoading(true);
    setError(null);
  
    try {
      // Determine the API route based on whether the request is public
      const apiRoute = isPublic
        ? `/api/public/images?${new URLSearchParams({ ...(offset && { offset: offset.toString() }), ...(limit && { limit: limit.toString() }) })}`
        : `/api/images`;
  
      const response = await fetch(apiRoute);
  
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
  
      const generatedImages:ImageData[] = []
      const images:[] = await response.json();
      images.forEach((image) => {
          const { id, url, prompt, model, creativity, steps, seed, refImage, metadata, bookmark} = image
          generatedImages.push({
            id, url, prompt, model, creativity, steps, seed, metadata, bookmark,
            numberOfImages:1,
            refImage: refImage?? undefined,
          })
        }
      )
      return generatedImages;
    } catch (error) {
      setError('Failed to fetch images');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createImage,
    enhancePrompt,
    generateImage,
    updateImage,
    deleteImage,
    upscaleImage,
    getImages,
    isLoading,
    error,
  };
}

