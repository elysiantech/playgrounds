'use client'

import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';
import { ImageData } from '@/lib/types'
import { useApi } from '@/hooks/use-api'; 
import Image from 'next/image';

interface MasonryGridProps {
  selectedImage: (image: ImageData) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({ selectedImage }) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const { getImages } = useApi();

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  // Fetch all images on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const allImages = await getImages(true); // Fetch all ImageData
        const parsedImages = allImages.map((image) => ({
          ...image,
          url: `/share/${image.url}`, // Adjust URL if necessary
        }));
        setImages(parsedImages);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="overflow-y-auto h-screen">
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-background"
      >
        {images.map((image, index) => (
          <LazyImage
            key={index}
            image={image}
            index={index}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            selectedImage={selectedImage}
          />
        ))}
      </Masonry>
    </div>
  );
};

interface LazyImageProps {
  image: ImageData;
  index: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  selectedImage: (image: ImageData) => void;
}

const LazyImage: React.FC<LazyImageProps> = ({ image, index, hoveredIndex, setHoveredIndex, selectedImage }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // Preload slightly before entering the viewport
  });
  const preloadCount = 10; 
  const prompt = image.prompt.replace(/^["\s]+|["\s]+$/g, '');
  const width = 500;
  const height = 500;
  const customLoader = ({ src, width, quality }:{src:string, width:number, quality?:number}) => {
    return `${src}?width=${width}&quality=${quality || 75}`;
  };

  return (
    <div
      ref={ref}
      className="relative mb-4 overflow-hidden rounded-lg shadow-md transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      onClick={() => selectedImage(image)}
    >
      {(inView || index < preloadCount)  && (
        <>
          <Image
            loader={customLoader}
            src={image.url}
            alt={image.prompt}
            width={width}
            height={height}
            className="w-full h-auto object-cover transition-opacity duration-300 ease-in-out"
            style={{ opacity: hoveredIndex === index ? 0.7 : 1 }}
          />
          {hoveredIndex === index && (
            <div className="absolute inset-0 flex flex-col justify-between p-4 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
              <p className="text-white text-xs md:text-sm">
                {prompt.length > 100 ? `${prompt.slice(0, 100)}...` : prompt}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};