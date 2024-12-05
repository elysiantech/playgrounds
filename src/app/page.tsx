'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { MasonryGrid } from '@/components/masonry'
import { ScrollToTopButton } from '@/components/scroll'
    
export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Header transparent={true}/>
      <main className="flex-grow">
        <Hero />
        <section className="relative">
        <div className="sticky top-0 bg-black mx-auto px-4 py-2 z-10">
          <h2 className="text-xl mb-4 text-center">Explore Images for Inspiration</h2>
        </div>
        <div className="container mx-auto px-4 overflow-y-auto">
        <MasonryGrid selectedImage={(image) => router.push(`/images/${image.id}`)} />
        </div>
      </section>
      </main>
      <ScrollToTopButton />
    </div>
  )
}