'use client'

import Image from "next/image"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Mail } from 'lucide-react'

export default function SignIn() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="mb-8">
        <Image
          src="/logo-white-black.png"
          alt="Logo"
          width={64}
          height={64}
          className="dark:hidden"
        />
        <Image
          src="/logo-black-white.png"
          alt="Logo"
          width={64}
          height={64}
          className="hidden dark:block"
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
          <Button variant="outline" onClick={() => signIn('google', { callbackUrl: '/' })}>
            <Mail className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button variant="outline" onClick={() => signIn('github', { callbackUrl: '/' })}>
            <Github className="mr-2 h-4 w-4" />
            Github
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}