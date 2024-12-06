'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from "next/image"
import { useTheme } from 'next-themes'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Mail } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const { theme } = useTheme()
  const searchParams = useSearchParams()
  const [callbackUrl, setCallbackUrl] = useState<string>('/');

  useEffect(() => {
    const queryCallbackUrl = searchParams?.get('callbackUrl');
    setCallbackUrl(queryCallbackUrl || '/');
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="mb-8">
      <Image
          src={theme === 'dark' ? '/logo-white-black.png' : '/logo-black-white.png'}
          alt="Origam.ai Logo"
          width={64}
          height={64}
          className="rounded-md"
        />
      </div>
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={() => signIn('google', { callbackUrl })}>
            <Mail className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button variant="outline" onClick={() => signIn('github', { callbackUrl })}>
            <Github className="mr-2 h-4 w-4" />
            Github
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}