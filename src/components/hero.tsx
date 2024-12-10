import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative  h-[90vh] flex items-center justify-center overflow-hidden">
      <style jsx>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(-2%, -2%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        .kenburns-bg {
          animation: kenburns 20s ease-in-out infinite;
        }
      `}</style>
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full kenburns-bg">
        <Image
          src="/b9efe6ca-b8ea-48e0-9168-9479c4d030b8.png"//"https://picsum.photos/1920/1080"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="opacity-60"// filter brightness-75"
        />
        </div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-light mb-2 sm:mb-4 text-white tracking-wide">
          <span className="italic">Unleash Your Creativity</span> 
        </h1>
        <p className="text-lg sm:text-xl mb-8 text-white/90 font-light tracking-wide max-w-2xl mx-auto">
          Explore, remix, and create amazing images with AI. Transform your ideas into stunning visuals using our powerful image generation tools.
        </p>
        <Link
          href="/playground"
          className="px-6 py-3 text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold"
        >
          Create for Free Today!
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

