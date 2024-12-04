'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { MasonryGrid } from '@/components/masonry'
import { ScrollToTopButton } from '@/components/scroll'
import { ImageData } from '@/lib/types'
    
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
      <Header transparent={true}/>
      <main className="flex-grow">
        <Hero />
        <section className="relative">
        <div className="sticky top-0 bg-black mx-auto px-4 py-2 z-10">
          <h2 className="text-2xl font-bold mb-4 text-center">Explore Images for Inspiration</h2>
        </div>
        <div className="container mx-auto px-4 overflow-y-auto">
        <MasonryGrid selectedImage={handleSelectedImage} />
        </div>
        {/* <div className="container mx-auto px-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
          <MasonryGrid selectedImage={handleSelectedImage} />
        </div> */}
      </section>
      </main>
      <ScrollToTopButton />
    </div>
  )
}