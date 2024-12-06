import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Origam.ai - Free AI Image Generator | Create Stunning Visuals Instantly',
  description: 'Transform your ideas into breathtaking visuals with Origam.ai. Leverage state-of-the-art AI models to generate high-quality images for free. Perfect for creators, designers, and dreamers.',
  keywords: 'AI image generator, free image generator, create images online, AI art, image creation tool, Origam.ai, AI-powered visuals',
}

export default function RootLayout({children,}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}