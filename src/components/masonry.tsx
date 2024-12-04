'use client'

import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';
import { ImageData } from '@/lib/types'
import Image from 'next/image';

interface MasonryGridProps {
  images: ImageData[];
  selectedImage: (image: ImageData) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({ images, selectedImage }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
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
    rootMargin: '200px 0px',
  });

  return (
    <div
      ref={ref}
      className="relative mb-4 overflow-hidden rounded-lg shadow-md transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      onClick={() => selectedImage(image)}
    >
      {inView && (
        <>
          <Image
            src={image.url}
            alt={image.prompt}
            width={500}
            height={500}
            className="w-full h-auto object-cover transition-opacity duration-300 ease-in-out"
            style={{ opacity: hoveredIndex === index ? 0.7 : 1 }}
          />
          {hoveredIndex === index && (
            <div className="absolute inset-0 flex flex-col justify-between p-4 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
              <p className="text-white text-sm md:text-base">{image.prompt}</p>
              <p className="text-white text-sm md:text-base self-start">Remix</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

