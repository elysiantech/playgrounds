'use client';

import { useRef } from 'react'
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { MasonryGrid } from '@/components/masonry'
import { ScrollToTopButton } from '@/components/scroll'
    
export default function Home() {
  const masonryGridRef = useRef<HTMLElement>(null)
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Header transparent={true}/>
      <main className="flex-grow">
        <Hero nextSectionRef={masonryGridRef} />
        <section className="relative">
        <div className="sticky top-0 bg-black mx-auto px-4 py-2 z-10">
          <h2 className="text-xl font-light mb-4 text-center">Explore, Get inspired. Create your own.</h2>
        </div>
        <div className="container mx-auto px-4 overflow-y-auto">
        <MasonryGrid ref={masonryGridRef} selectedImage={(image) => router.push(`/images/${image.id}`)} />
        </div>
      </section>
      </main>
      <ScrollToTopButton />
    </div>
  )
}