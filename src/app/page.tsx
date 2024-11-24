'use client';

import { Suspense } from 'react';
import { Playgrounds } from '@/components/playgrounds'

export default function Home() {
  return (
    <main className="min-h-screen h-full bg-background">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>}>
        <Playgrounds />
      </Suspense>
    </main>
  )
}