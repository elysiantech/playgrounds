'use client'

import { useState } from 'react';

interface GenerateImageParams {
  prompt: string;
  creativity: number;
  steps: number;
  seed: number;
  model:string;
  refImage?: string;
  numberOfImages: number;
  userId: string;
}

interface GeneratedImage {
  id:string;
  url: string;
  metadata: Record<string, string>;
  bookmark?:boolean;
}

interface ShareLinkParams {
  imageUrl: string;
  redirectUrl: string;
  description: string;
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

  const createImage = async (imageData: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: imageData,
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

  const generateImage = async (params: GenerateImageParams & { userId: string }): Promise<GeneratedImage> => {
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
      // Save the generated image to the database
      const savedImage = await createImage(JSON.stringify({
        url: data.image.url,
        metadata: data.image.metadata,
        prompt: params.prompt,
        model: params.model,
        creativity: params.creativity,
        steps: params.steps,
        seed: params.seed,
        refImage: params.refImage || null,
        userId: params.userId,
        bookmark: false, // Default to unbookmarked
      }));
      return { ...data.image, id: savedImage.id };
    } catch (error) {
      setError('Failed to generate image');
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


  const generateShareLink = async (params: ShareLinkParams): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.error || 'Failed to create shareable link.');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      setError('Failed to generate share link');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    enhancePrompt,
    generateImage,
    updateImage,
    deleteImage,
    generateShareLink,
    isLoading,
    error,
  };
}

