import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative  h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/1920/1080"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="opacity-50"
        />
      </div>
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl font-bold mb-4 text-white">Welcome to Image Origam.ai</h1>
        <p className="text-xl mb-8 text-white">Create and remix amazing images with AI</p>
        <Link
          href="/playground"
          className="px-6 py-3 text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold"
        >
          Generate an Image
        </Link>
      </div>
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-white text-sm">Scroll down</span>
          <ArrowDown className="text-white animate-bounce w-6 h-6" />
        </div>
      </div>
    </section>
  )
}

