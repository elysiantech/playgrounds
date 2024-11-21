'use client';

import { useEffect } from 'react';
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation"
import { Playgrounds } from '@/components/playgrounds'

export default function Home() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect('/signin');
    }
  }, [status]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      <Playgrounds />
    </main>
  )
}