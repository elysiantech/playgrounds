'use client'

import * as React from 'react'
import { Moon, Sun, LogOut, Upload, X, Sparkles, RefreshCw, ArrowUpToLine, CuboidIcon as Cube, Info, Trash2, Download } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useSession, signOut } from "next-auth/react"
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function Playgrounds() {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()
  const [prompt, setPrompt] = React.useState('')
  const [negativePrompt, setNegativePrompt] = React.useState('')
  const [creativity, setCreativity] = React.useState(50)
  const [steps, setSteps] = React.useState(50)
  const [seed, setSeed] = React.useState<'random' | 'fixed'>('random')
  const [fixedSeed, setFixedSeed] = React.useState('')
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = React.useState<string[]>([])
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [showTools, setShowTools] = React.useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const enhancePrompt = () => {
    // Implement prompt enhancement logic here
    console.log('Enhancing prompt:', prompt)
  }

  const generateImage = () => {
    // Simulate image generation
    const newImage = `/placeholder.svg?height=512&width=512&text=${encodeURIComponent(prompt)}`
    // const newImage = `https://placehold.co/512x512/000000/FFF?text=image`;
    setGeneratedImages(prev => [newImage, ...prev])
    setSelectedImage(newImage)
  }

  const handleImageAction = (action: string) => {
    console.log(`Performing ${action} on the image`)
    // Implement the actual functionality for each action here
  }
  const handleDownload = () => {
    if (selectedImage) {
      const link = document.createElement('a')
      link.href = selectedImage
      link.download = 'generated-image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r p-4 flex flex-col space-y-4">
        <Card className="w-full">
          <CardContent className="p-4 flex flex-col items-center">
            <Label htmlFor="image-upload" className="cursor-pointer">
              {uploadedImage ? (
                <Image
                  src={uploadedImage}
                  alt="Uploaded"
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <span className="mt-2 text-sm font-medium">Image</span>
          </CardContent>
        </Card>

        <div className="relative">
          <Textarea
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          {prompt && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => setPrompt('')}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-2 right-2"
                onClick={enhancePrompt}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label>Creativity</Label>
          <Slider
            value={[creativity]}
            onValueChange={(values) => setCreativity(values[0])}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-xs">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Textarea
                placeholder="Negative prompt..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
              <div className="space-y-2">
                <Label>Steps</Label>
                <Slider
                  value={[steps]}
                  onValueChange={(values) => setSteps(values[0])}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-xs">
                  <span>Fast</span>
                  <span>Balanced</span>
                  <span>High</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="seed-mode"
                  checked={seed === 'fixed'}
                  onCheckedChange={(checked) => setSeed(checked ? 'fixed' : 'random')}
                />
                <Label htmlFor="seed-mode">Seed: {seed === 'random' ? 'Random' : 'Fixed'}</Label>
              </div>
              {seed === 'fixed' && (
                <Input
                  type="number"
                  placeholder="Enter seed"
                  value={fixedSeed}
                  onChange={(e) => setFixedSeed(e.target.value)}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button className="w-full" onClick={generateImage}>
          <Sparkles className="mr-2 h-4 w-4" /> Generate
        </Button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8">
              <Image
                src={theme === 'dark' ? '/logo-white-black.png' : '/logo-black-white.png'}
                alt="Playgrounds Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
            </div>
            <h1 className="text-xl font-bold">Playgrounds</h1>
          </div>
          {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem className="flex items-center">
              <Avatar className="mr-2 h-8 w-8">
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span>{session.user.email || ''}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Selected image area */}
          <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
            <div 
              className="relative max-w-full max-h-full" 
              onMouseEnter={() => setShowTools(true)} 
              onMouseLeave={() => setShowTools(false)}
            >
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt="Generated image"
                  width={512}
                  height={512}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-full min-h-[300px] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Generate an image to see it here</p>
                </div>
              )}
              {showTools && selectedImage && (
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 flex space-x-2">
                <TooltipProvider>
                  {[
                    { icon: RefreshCw, label: 'Reimagine', action: 'reimagine' },
                    { icon: ArrowUpToLine, label: 'Upscale', action: 'upscale' },
                    { icon: Cube, label: 'Make 3D', action: 'make3d' },
                    { icon: Info, label: 'Info', action: 'info' },
                    { icon: Download, label: 'Download', action: 'download' },
                    { icon: Trash2, label: 'Delete', action: 'delete' },
                  ].map(({ icon: Icon, label, action }) => (
                    <Tooltip key={action}>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => action === 'download' ? handleDownload() : handleImageAction(action)}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="sr-only">{label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
              )}
            </div>
          </div>

          {/* Generated images row */}
          <div className="h-[120px] border-t">
            <ScrollArea className="w-full h-full">
              <div className="flex p-2 gap-2">
                {generatedImages.map((image, index) => (
                  <Image
                    key={index}
                    src={image}
                    alt={`Generated image ${index + 1}`}
                    width={100}
                    height={100}
                    className="rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(image)}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </main>
      </div>
    </div>
  )
}