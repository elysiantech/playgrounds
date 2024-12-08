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
  const [offset, setOffset] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { getImages } = useApi();

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  const fetchMoreImages = async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);

    try {
      const limit = 20; // Define how many images to fetch per batch
      const newImages = await getImages(true, offset, limit);
      const parsedImages = newImages.map((image) => { 
        return { ...image, url: `/share/${image.url}`}
      });
      if (parsedImages.length > 0) {
        setImages((prevImages) => [...prevImages, ...parsedImages]);
        setOffset((prevOffset) => prevOffset + parsedImages.length);
      } else {
        setHasMore(false); // No more images to fetch
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Load initial images on component mount
  useEffect(() => {
    fetchMoreImages();
  }, []);

  return (
    <div onScroll={(e) => {
      const target = e.target as HTMLElement;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight * 1.5 && !isFetching) {
        fetchMoreImages();
      }
    }} className="overflow-y-auto h-screen">
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
      {isFetching && <p className="text-center my-4">Loading...</p>}
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
    rootMargin: '200px 0px',
  });
  const prompt = image.prompt.replace(/^["\s]+|["\s]+$/g, '')
  const width = 500;//Math.floor(Math.random() * (800 - 200) + 200); 
  const height = 500;//Math.floor(width * (Math.random() * 0.5 + 0.75)); 
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
      {inView && (
        <>
          <Image
            // src={`${image.url}?width=${width}&quality=75`}
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

