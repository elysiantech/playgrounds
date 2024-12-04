'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { MasonryGrid } from '@/components/masonry'
import { ScrollToTopButton } from '@/components/scroll'
import { ImageData } from '@/lib/types'

// const imageData = [
//   { url: 'https://picsum.photos/800/600', prompt: 'A beautiful sunset over the ocean' },
//   { url: 'https://picsum.photos/600/800', prompt: 'A majestic mountain range' },
//   { url: 'https://picsum.photos/700/700', prompt: 'A bustling city street at night' },
//   { url: 'https://picsum.photos/900/600', prompt: 'A serene forest landscape' },
//   { url: 'https://picsum.photos/600/900', prompt: 'A colorful hot air balloon festival' },
//   { url: 'https://picsum.photos/800/800', prompt: 'An ancient ruins exploration' },
//   { url: 'https://picsum.photos/700/900', prompt: 'A vibrant coral reef' },
//   { url: 'https://picsum.photos/900/700', prompt: 'A snowy mountain peak' },
// ]
// const images: ImageData[] = imageData.map((data) => ({
//   url: data.url,
//   prompt: data.prompt,
//   model: '',  creativity: 5, steps: 4, seed: 'random', numberOfImages: 1, metadata: {}, 
// }));
    
export default function Home() {
  const router = useRouter();

  const handleSelectedImage = (image: ImageData) => { 
    const params = new URLSearchParams({
      prompt: image.prompt,
      model: image.model,
      creativity: image.creativity.toString(),
      steps: image.steps.toString(),
      seed: String(image.seed),
      numberOfImages: "1",
    }).toString();
    router.push(`/playground?${params}`);
    
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Explore Image Playgrounds</h2>
          <MasonryGrid selectedImage={handleSelectedImage} />
        </div>
      </main>
      <ScrollToTopButton />
    </div>
  )
}