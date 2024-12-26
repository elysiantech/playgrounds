'use client'

import { useState, useEffect, RefObject } from 'react'
import Image from 'next/image'
import { ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface HeroProps {
  nextSectionRef?: RefObject<HTMLElement>
}

export const Hero: React.FC<HeroProps> = ({ nextSectionRef }) => {
  const router = useRouter()

  return (
    <section className="relative  h-[100vh] flex items-center justify-center overflow-hidden">
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
          src="/b9efe6ca-b8ea-48e0-9168-9479c4d030b8.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="opacity-60"// filter brightness-75"
        />
        </div>
      </div>
      <div className="relative z-10 text-center text-white px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold mb-4"
        >
          Unleash Your Creativity!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl mb-8"
        >
          Create amazing images and videos for school projects, t-shirts, and more!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-x-4"
        >
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
          onClick={()=> router.push('/playground')}
          >
            Start Creating
          </button>
          <button className="border-2 border-white text-white px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-white hover:text-purple-500"
          onClick={()=> nextSectionRef?.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Creations
          </button>
        </motion.div>
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

