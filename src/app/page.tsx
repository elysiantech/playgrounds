'use client';

import { Suspense } from 'react';
import { Playgrounds } from '@/components/playgrounds'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<div>Loading...</div>}>
      <Playgrounds />
      </Suspense>
    </main>
  )
}