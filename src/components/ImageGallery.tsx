import React from 'react'
import Image from 'next/image'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { ImageData } from '@/lib/types';

interface ImageGalleryProps {
  generatedImages: ImageData[];
  onImageSelect: (image: ImageData) => void;
  direction?: 'horizontal' | 'vertical'; // New prop to control direction
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ generatedImages, onImageSelect, direction = 'horizontal' }) => {
  const isHorizontal = direction === 'horizontal';
  const gallerySize = isHorizontal ? 128 : 200;
  const customLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `${src}?width=${width}&quality=${quality || 75}`;
  };

  return (
    <div
      className="relative"
      style={{
        height: isHorizontal ? `${gallerySize}px` : 'auto',
        width: isHorizontal ? '100%' : `${gallerySize}px`,
        maxHeight: isHorizontal ? `${gallerySize}px` : '100vh',
        maxWidth: isHorizontal ? '100vw' : `${gallerySize}px`,
      }}
    >
      <ScrollArea className={`w-full h-full ${isHorizontal ? 'overflow-x-auto' : 'overflow-y-auto'}`}>
        <div
          className={`flex p-2 gap-2 ${isHorizontal ? 'flex-row' : 'flex-col'}`}

        >
          {generatedImages.map((image, index) => (
            <div key={index} className="relative group flex-shrink-0">
              <Image
                loader={customLoader}
                src={image.url.startsWith('data:image') ? image.url : `/share/${image.url}`}
                alt={`Generated image ${index + 1}`}
                width={gallerySize}
                height={gallerySize}
                className="rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onImageSelect(image)}
                style={{
                  height: isHorizontal ? `${gallerySize}px` : 'auto',
                  width: isHorizontal ? 'auto' : `${gallerySize}px`,
                }}
              />
            </div>
          ))}
        </div>
        <ScrollBar orientation={isHorizontal ? 'horizontal' : 'vertical'} />
      </ScrollArea>
    </div>
  );
};