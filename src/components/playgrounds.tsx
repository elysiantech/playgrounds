'use client'

import * as React from 'react'
import { Moon, Sun, LogOut, Upload, X, Sparkles, Scale, Trash2, Download, RefreshCw, Bookmark, Share } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useSession, signOut } from "next-auth/react"
import { useSearchParams } from 'next/navigation'
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
import { toast } from '@/hooks/use-toast'

interface ImageData {
  url: string;
  prompt: string;
  negativePrompt: string;
  creativity: number;
  steps: number;
  seed: string;
  numberOfImages: number;
}

export function Playgrounds() {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = React.useState('')
  const [negativePrompt, setNegativePrompt] = React.useState('')
  const [creativity, setCreativity] = React.useState(50)
  const [steps, setSteps] = React.useState(50)
  const [seed, setSeed] = React.useState<'random' | 'fixed'>('random')
  const [fixedSeed, setFixedSeed] = React.useState('')
  const [numberOfImages, setNumberOfImages] = React.useState(2)
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = React.useState<ImageData[]>([])
  const [selectedImage, setSelectedImage] = React.useState<ImageData | null>(null)
  const [showTools, setShowTools] = React.useState(false)

  React.useEffect(() => {
    const promptParam = searchParams.get('prompt')
    const negativePromptParam = searchParams.get('negativePrompt')
    const creativityParam = searchParams.get('creativity')
    const stepsParam = searchParams.get('steps')
    const seedParam = searchParams.get('seed')
    const numberOfImagesParam = searchParams.get('numberOfImages')

    if (promptParam) setPrompt(promptParam)
    if (negativePromptParam) setNegativePrompt(negativePromptParam)
    if (creativityParam) setCreativity(parseInt(creativityParam))
    if (stepsParam) setSteps(parseInt(stepsParam))
    if (seedParam) {
      setSeed('fixed')
      setFixedSeed(seedParam)
    }
    if (numberOfImagesParam) setNumberOfImages(parseInt(numberOfImagesParam))
  }, [searchParams])

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

  const clearUploadedImage = () => {
    setUploadedImage(null)
  }

  const enhancePrompt = () => {
    // Implement prompt enhancement logic here
    console.log('Enhancing prompt:', prompt)
  }

  const generateImage = async () => {
    // Placeholder SVG data URL
    const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' dy='.3em' fill='%23999'%3EGenerating...%3C/text%3E%3C/svg%3E`;

    const newImages: ImageData[] = Array(numberOfImages).fill(null).map(() => ({
      url: placeholderSvg,
      prompt,
      negativePrompt,
      creativity,
      steps,
      seed: seed === 'fixed' ? fixedSeed : 'random',
      numberOfImages,
    }));

    setGeneratedImages(prev => [...newImages, ...prev]);
    setSelectedImage(newImages[0]);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate receiving generated image URLs from the API
    const updatedImages = newImages.map((image, index) => ({
      ...image,
      url: `/generated-image-${Date.now()}-${index}.png`,
    }));

    setGeneratedImages(prev => [...updatedImages, ...prev.slice(numberOfImages)]);
    setSelectedImage(updatedImages[0]);
  };

  const handleImageAction = (action: string) => {
    switch (action) {
      case 'remix':
        if (selectedImage) {
          setPrompt(selectedImage.prompt)
          setNegativePrompt(selectedImage.negativePrompt)
          setCreativity(selectedImage.creativity)
          setSteps(selectedImage.steps)
          if (selectedImage.seed !== 'random') {
            setSeed('fixed')
            setFixedSeed(selectedImage.seed)
          } else {
            setSeed('random')
          }
          setNumberOfImages(selectedImage.numberOfImages)
        }
        break;
      case 'delete':
        if (selectedImage) {
          setGeneratedImages(prev => prev.filter(img => img.url !== selectedImage.url))
          setSelectedImage(null)
        }
        break;
      case 'share':
        if (selectedImage) {
          const params = new URLSearchParams({
            prompt: selectedImage.prompt,
            negativePrompt: selectedImage.negativePrompt,
            creativity: selectedImage.creativity.toString(),
            steps: selectedImage.steps.toString(),
            seed: selectedImage.seed,
            numberOfImages: selectedImage.numberOfImages.toString(),
          })
          const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
          navigator.clipboard.writeText(url)
          toast({
            title: "URL Copied",
            description: "The share URL has been copied to your clipboard.",
          })
        }
        break;
      default:
        console.log(`Performing ${action} on the image`)
    }
  }

  const handleDownload = () => {
    if (selectedImage) {
      const link = document.createElement('a')
      link.href = selectedImage.url
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
          <CardContent className="p-4 flex flex-col items-center relative">
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
            {uploadedImage && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={clearUploadedImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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

        <div className="space-y-2">
          <Label>Number of images</Label>
          <Slider
            value={[numberOfImages]}
            onValueChange={(values) => setNumberOfImages(values[0])}
            min={1}
            max={8}
            step={1}
          />
          <div className="flex justify-between">
            <span>{numberOfImages}</span>
          </div>
        </div>

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
                  src={selectedImage.url}
                  alt="Generated image"
                  width={512}
                  height={512}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  unoptimized={selectedImage.url.startsWith('data:')}
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
                      { icon: RefreshCw, label: 'Remix', action: 'remix' },
                      { icon: Scale, label: 'Upscale', action: 'upscale' },
                      { icon: Bookmark, label: 'Bookmark', action: 'bookmark' },
                      { icon: Share, label: 'Share', action: 'share' },
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
                    src={image.url}
                    alt={`Generated image ${index + 1}`}
                    width={100}
                    height={100}
                    className="rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(image)}
                    unoptimized={image.url.startsWith('data:')}
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