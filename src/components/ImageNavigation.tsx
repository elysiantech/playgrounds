import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageData, VideoData } from '@/lib/types';

interface ImageNavigationProps {
  images: ImageData[] | VideoData[];
  selectedImage: ImageData | VideoData;
  setSelectedImage: (image: ImageData | VideoData) => void;
}

export const ImageNavigation: React.FC<ImageNavigationProps> = ({
  images,
  selectedImage,
  setSelectedImage,
}) => {
  const currentIndex = images.findIndex(img => img.id === selectedImage.id);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-between">
      {/* Left Chevron */}
      <div className="pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/40 backdrop-blur-md rounded-full ml-2"
          onClick={() => {
            if (currentIndex > 0) {
              setSelectedImage(images[currentIndex - 1]);
            }
          }}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Chevron */}
      <div className="pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/40 backdrop-blur-md rounded-full mr-2"
          onClick={() => {
            if (currentIndex < images.length - 1) {
              setSelectedImage(images[currentIndex + 1]);
            }
          }}
          disabled={currentIndex === images.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};