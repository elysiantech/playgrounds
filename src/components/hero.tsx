import Link from 'next/link'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative py-20 overflow-hidden">
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
      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Image Playgrounds</h1>
        <p className="text-xl mb-8">Create and remix amazing images with AI</p>
        <Link
          href="/playground"
          className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
        >
          Get Started
        </Link>
      </div>
    </section>
  )
}

