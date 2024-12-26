import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Amazing Images and Videos with AI - Art Generator for Kids and School',
  description: 'Empower kids and students to create AI-generated images and videos for school projects, t-shirts, social media, and more! Fun, easy-to-use, and perfect for young creators, educators, and families.',
  keywords: 'AI art for kids, school project art generator, AI image generator for students, kid-friendly AI tools, AI video creator for kids, creative tools for schools, art creation platform for families',
};

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