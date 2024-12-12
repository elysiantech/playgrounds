import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageData } from '@/lib/types';

interface ImageNavigationProps {
  images: ImageData[];
  selectedImage: ImageData;
  setSelectedImage: (image: ImageData) => void;
}

export const ImageNavigation: React.FC<ImageNavigationProps> = ({
  images,
  selectedImage,
  setSelectedImage,
}) => {
  const currentIndex = images.findIndex(img => img.id === selectedImage.id);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/40 backdrop-blur-md rounded-full"
        onClick={() => {
          if (currentIndex > 0) {
            setSelectedImage(images[currentIndex - 1]);
          }
        }}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous image</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/40 backdrop-blur-md rounded-full"
        onClick={() => {
          if (currentIndex < images.length - 1) {
            setSelectedImage(images[currentIndex + 1]);
          }
        }}
        disabled={currentIndex === images.length - 1}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next image</span>
      </Button>
    </>
  );
};