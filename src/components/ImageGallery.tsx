import React from 'react'
import Image from 'next/image'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { ImageData } from '@/lib/types';

interface ImageGenerationGalleryProps {
    generatedImages: ImageData[]
    onImageSelect: (image: ImageData) => void
  }
  
export const ImageGallery: React.FC<ImageGenerationGalleryProps> = ({ generatedImages, onImageSelect}) => {
    const galleryHeight = 128;
    const customLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
      return `${src}?width=${width}&quality=${quality || 75}`;
    };
  
return (
        <div className="relative border-t" style={{ height: `${galleryHeight}px`, maxHeight: `${galleryHeight}px`, maxWidth: "100vw", }}>
        <ScrollArea className="w-full h-full">
            <div className="flex p-2 gap-2 overflow-x-auto">
            {generatedImages.map((image, index) => (
                <div key={index} className="relative group flex-shrink-0">
                <Image
                    loader={customLoader}
                    src={image.url.startsWith('data:image')? image.url: `/share/${image.url}`}
                    alt={`Generated image ${index + 1}`}
                    width={100}
                    height={100}
                    className="rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageSelect(image)}
                    style={{ height: `${galleryHeight}px`, width: 'auto' }}
                //unoptimized
                />
                </div>
            ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        </div>
    )
}