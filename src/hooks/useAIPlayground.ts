'use client'

import { useState } from 'react';

interface GenerateImageParams {
  prompt: string;
  negativePrompt: string;
  creativity: number;
  steps: number;
  seed: number;
  refImage?: string;
  numberOfImages: number;
}

interface GeneratedImage {
  url: string;
  metadata: Record<string, string>;
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
      return data.image;
    } catch (error) {
      setError('Failed to generate image');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    enhancePrompt,
    generateImage,
    isLoading,
    error,
  };
}

