'use client'

import * as React from 'react'
import { Moon, Sun, LogOut, Upload, X, Sparkles, Trash2, Download, RefreshCw, Bookmark, BookmarkCheck, Share2 as Share, Menu, Settings2 as Edit, Expand, Layers, ImageOff, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useSession, signOut } from "next-auth/react"
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/hooks/use-toast'
import { useAIPlayground } from "@/hooks/useAIPlayground"
import { processWithConcurrencyLimit } from '@/lib/utils'

interface ImageData {
  id?: string;
  url: string;
  prompt: string;
  creativity: number;
  steps: number;
  seed: number;
  numberOfImages: number;
  bookmark?: boolean;
  metadata: Record<string, string | number>;
  model:string
}

export function Playgrounds() {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = React.useState('')
  const [creativity, setCreativity] = React.useState(5)
  const [steps, setSteps] = React.useState(50)
  const [seed, setSeed] = React.useState<'random' | 'fixed'>('random')
  const [fixedSeed, setFixedSeed] = React.useState('')
  const [numberOfImages, setNumberOfImages] = React.useState(1)
  const [model, setModel] = React.useState('Flux.1-Schnell')
  const [refImage, setRefImage] = React.useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = React.useState<ImageData[]>([])
  const [selectedImage, setSelectedImage] = React.useState<ImageData | null>(null)
  const [showTools, setShowTools] = React.useState(false)
  const [showInfoPanel, setShowInfoPanel] = React.useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [galleryHeight, setGalleryHeight] = React.useState(120);
  const { enhancePrompt, generateImage, generateShareLink } = useAIPlayground()

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  React.useEffect(() => {
    // Load generated images from sessionStorage on component mount
    const savedGeneratedImages = sessionStorage.getItem('generatedImages');
    if (savedGeneratedImages) {
      setGeneratedImages(JSON.parse(savedGeneratedImages) as ImageData[]);
    }

    // Load bookmarked images from localStorage on component mount
    const savedBookmarks = localStorage.getItem('bookmarkedImages');
    if (savedBookmarks) {
      const bookmarkedImages = (JSON.parse(savedBookmarks) as ImageData[]).map((bookmark) => ({
        ...bookmark,
        bookmark: true,
      }));
      setGeneratedImages((prev) => {
        const combined = [...prev];
        bookmarkedImages.forEach((bookmark) => {
          const existingIndex = combined.findIndex(
            (image) => image.url === bookmark.url
          );
          if (existingIndex !== -1) {
            combined[existingIndex] = { ...combined[existingIndex], bookmark: true };
          } else {
            combined.push(bookmark);
          }
        });
        return combined;
      });
    }
  }, []);

  React.useEffect(() => {
    // Save generated images to sessionStorage whenever they change
    sessionStorage.setItem('generatedImages', JSON.stringify(generatedImages));
  }, [generatedImages]);

  React.useEffect(() => {
    // Save bookmarked images to localStorage whenever they change
    const bookmarkedImages = generatedImages.filter((image) => image.bookmark);
    localStorage.setItem('bookmarkedImages', JSON.stringify(bookmarkedImages));
  }, [generatedImages]);

  React.useEffect(() => {
    const promptParam = searchParams.get('prompt')
    const modelParam = searchParams.get('model')
    const creativityParam = searchParams.get('creativity')
    const stepsParam = searchParams.get('steps')
    const seedParam = searchParams.get('seed')
    const numberOfImagesParam = searchParams.get('numberOfImages')

    if (promptParam) setPrompt(promptParam)
    if (modelParam) setModel(modelParam)
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
        setRefImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearRefImage = () => {
    setRefImage(null)
  }

  const handleEnhancePrompt = async () => {
    try {
      const enhancedPrompt = await enhancePrompt(prompt)
      setPrompt(enhancedPrompt)
    } catch (error) {
      console.error('Error enhancing prompt:', error)
    }
  }

  const handleGenerateImage = async () => {
    
    const newImages: ImageData[] = Array.from({ length: numberOfImages }, () => {
      const uniqueSeed = seed === 'fixed' ? parseInt(fixedSeed) : Math.floor(Math.random() * 2 ** 32);
      return {
        url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' dy='.3em' fill='%23999'%3EGenerating...%3C/text%3E%3C/svg%3E`,
        prompt,
        model,
        creativity,
        steps,
        seed: uniqueSeed,
        numberOfImages,
        metadata: {}
      };
    });

    try {
      // Temporarily set placeholder images
      setGeneratedImages(prev => [...newImages, ...prev]);
      setSelectedImage(newImages[0]);

      // Generate images using the useAIPlayground hook
      const generatedImages = await processWithConcurrencyLimit(
        newImages,
        2, // max 2 concurrently lower costs
        (image) => generateImage({
          prompt: image.prompt,
          model: image.model,
          creativity: image.creativity,
          steps: image.steps,
          seed: image.seed,
          refImage: refImage || undefined,
          numberOfImages: 1,
        })
      );

      // Update newImages with the generated URLs
      const updatedImages = newImages.map((image, index) => ({
        ...image,
        url: generatedImages[index].url,
        metadata: generatedImages[index].metadata
      }));

      // Update the state with the generated images
      setGeneratedImages(prev => [...updatedImages, ...prev.slice(numberOfImages)]);
      setSelectedImage(updatedImages[0]);
    } catch (error) {
      console.error('Error generating image:', error)
      // Remove set placeholder images
      setGeneratedImages(prev => [...prev.slice(numberOfImages)]);
      setSelectedImage(null);
      toast({
        title: "Error",
        description: "Failed to generate images. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageAction = (action: string) => {
    switch (action) {
      case 'remix':
        if (selectedImage) {
          setPrompt(selectedImage.prompt)
          setModel(selectedImage.model)
          setCreativity(selectedImage.creativity)
          setSteps(selectedImage.steps)
          setSeed('fixed')
          setFixedSeed(String(selectedImage.seed))
          setNumberOfImages(1)
        }
        break;
      case 'delete':
        if (selectedImage) {
          handleDeleteImage(selectedImage)
        }
        break;
      case 'share':
        if (selectedImage) {
          const params = new URLSearchParams({
            prompt: selectedImage.prompt,
            model: selectedImage.model,
            creativity: selectedImage.creativity.toString(),
            steps: selectedImage.steps.toString(),
            seed: String(selectedImage.seed),
            numberOfImages: "1",//selectedImage.numberOfImages.toString(),
          })
          const redirectUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`
          generateShareLink({ imageUrl: selectedImage.url, redirectUrl, description: "Playgrounds AI-generated image."})
          .then((url:string) => {
            navigator.clipboard.writeText(url)
            toast({
              title: "URL Copied",
              description: "The share URL has been copied to your clipboard.",
            })
          })
        }
        break;
      case 'bookmark':
        if (selectedImage) {
          const updatedImages = generatedImages.map(image =>
            image.url === selectedImage.url ? { ...image, bookmark: !image.bookmark } : image
          );
          setGeneratedImages(updatedImages);
          setSelectedImage({ ...selectedImage, bookmark: !selectedImage.bookmark });
        }
        break;
      case 'info':
        setShowInfoPanel(!showInfoPanel)
        break;
      case 'upscale':
      case 'make3D':
      case 'aiExpand':
      case 'removeBackground':
        toast({
          title: "Feature not implemented",
          description: `The ${action} feature is not yet implemented.`,
        })
        break;
      default:
        console.log(`Performing ${action} on the image`)
    }
  }

  const handleDeleteImage = (imageToDelete: ImageData) => {
    setGeneratedImages(prev => prev.filter(img => img.url !== imageToDelete.url))
    if (selectedImage && selectedImage.url === imageToDelete.url) {
      let nextImage = null;
      generatedImages.forEach((image: ImageData, index: number) => {
        if (image.url === imageToDelete.url) {
          nextImage = (index + 1) <= generatedImages.length ? generatedImages[index + 1] : null
          return;
        }
      })
      setSelectedImage(nextImage)
    }
  }

  const handleDownload = async () => {
    if (selectedImage) {
      try {
        const response = await fetch(selectedImage.url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'generated-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Error downloading the image:', error);
      }
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleGalleryResize = (e: React.MouseEvent<HTMLDivElement>) => {
    const startY = e.clientY;
    const startHeight = galleryHeight;

    const doDrag = (e: MouseEvent) => {
      const newHeight = Math.max(100, Math.min(200, startHeight - (e.clientY - startY)));
      setGalleryHeight(newHeight);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Mobile header */}
      <header className="md:hidden h-16 border-b flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="w-8 h-8">
            <Image
              src={theme === 'dark' ? '/logo-white-black.png' : '/logo-black-white.png'}
              alt="Playgrounds Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
          </div>
          <h1 className="text-xl font-semibold">Playgrounds</h1>
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
              <DropdownMenuItem onClick={() => { setTheme('light'); localStorage.setItem('theme', 'light') }}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTheme('dark'); localStorage.setItem('theme', 'dark') }}>
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

      {/* Sidebar */}
      <aside className={`w-full md:w-64 border-r p-4 flex flex-col space-y-4 ${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <Card className="w-full">
          <CardContent className="p-4 flex flex-col items-center relative">
            <Label htmlFor="image-upload" className="cursor-pointer">
              {refImage ? (
                <Image
                  src={refImage}
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
            {refImage && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={clearRefImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <span className="mt-2 text-sm font-medium">Image</span>
          </CardContent>
        </Card>

        <div className="relative">
          <Label>Prompt</Label>
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
                className="absolute top-4 right-0"
                onClick={() => setPrompt('')}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-1 right-0"
                onClick={handleEnhancePrompt}
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
            max={10}
            step={1}
          />
          <div className="flex justify-between text-xs">
            <span>Creative</span>
            <span>Balanced</span>
            <span>Precise</span>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced</AccordionTrigger>
            <AccordionContent className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flux.1-Schnell">Flux.1-Schnell</SelectItem>
                    <SelectItem value="Flux.1-dev">Flux.1-dev</SelectItem>
                    <SelectItem value="Flux.1-Redux">Flux.1-Redux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

        <Button className="w-full" onClick={handleGenerateImage}>
          <Sparkles className="mr-2 h-4 w-4" /> Generate
        </Button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* Desktop header */}
        <header className="hidden md:flex h-16 border-b items-center justify-between px-4">
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
            <h1 className="text-xl font-semibold">Playgrounds</h1>
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
          <div className="flex-1 p-4 flex items-center justify-center overflow-hidden" style={{ height: `calc(100% - ${galleryHeight}px)` }}>
            <div
              className="relative max-w-full max-h-full flex items-center justify-center"
              style={{ height: '100%', width: '100%' }}
              onMouseEnter={() => setShowTools(true)}
              onMouseLeave={() => setShowTools(false)}
            >
              {selectedImage ? (
                <div className="relative w-full h-full max-w-full max-h-full overflow-hidden" style={{ height: '100%' }}>
                  <Image
                    src={selectedImage.url}
                    alt="Generated image"
                    className="object-contain rounded-lg shadow-lg"
                    fill
                    sizes="100vw"
                    priority
                  />
                  {showTools && selectedImage && (
                    <>
                      <div className="absolute top-2 right-2 bg-background/40 backdrop-blur-md rounded-lg p-2 flex space-x-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-foreground/90 hover:text-foreground">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit options</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40">
                            <div className="flex flex-col space-y-2">
                              {[
                                { icon: Layers, label: 'Make 3D', action: 'make3D' },
                                { icon: Expand, label: 'AI Expand', action: 'aiExpand' },
                                { icon: ImageOff, label: 'Remove BG', action: 'removeBackground' },
                              ].map(({ icon: Icon, label, action }) => (
                                <Button
                                  key={action}
                                  variant="ghost"
                                  className="justify-start text-foreground/90 hover:text-foreground"
                                  onClick={() => handleImageAction(action)}
                                >
                                  <Icon className="mr-2 h-4 w-4" />
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <TooltipProvider>
                          {[
                            { icon: Share, label: 'Share', action: 'share' },
                            { icon: Download, label: 'Download', action: 'download' },
                            { icon: RefreshCw, label: 'Remix', action: 'remix' },
                            { icon: Info, label: 'Info', action: 'info' },
                            { icon: selectedImage.bookmark ? BookmarkCheck : Bookmark, label: 'Bookmark', action: 'bookmark' },
                            { icon: Trash2, label: 'Delete', action: 'delete' },
                          ].map(({ icon: Icon, label, action }) => (
                            <Tooltip key={action}>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant='ghost'
                                  className="text-foreground/90 hover:text-foreground"
                                  onClick={() => action === 'download' ? handleDownload() : handleImageAction(action)}
                                >
                                  <Icon className={`h-4 w-4`} />
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
                    </>
                  )}
                  {/* Info Panel */}
                  <div
                    className={cn(
                      "absolute top-0 right-0 h-full w-80 bg-background border-l transform transition-transform duration-300 ease-in-out",
                      showInfoPanel ? "translate-x-0" : "translate-x-full"
                    )}
                  >
                    <div className="p-4 h-full overflow-y-auto relative">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => setShowInfoPanel(false)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </Button>
                      <h2 className="text-lg font-semibold mb-4">Image Information</h2>
                      {selectedImage && (
                        <div className="space-y-4">
                          <div>
                            <Label>Prompt</Label>
                            <p className="text-sm">{selectedImage.prompt}</p>
                          </div>
                          <div>
                            <Label>Creativity</Label>
                            <p className="text-sm">{selectedImage.creativity}</p>
                          </div>
                          <div>
                            <Label>Steps</Label>
                            <p className="text-sm">{selectedImage.steps}</p>
                          </div>
                          <div>
                            <Label>Seed</Label>
                            <p className="text-sm">{selectedImage.seed}</p>
                          </div>
                          <div>
                            <Label>Model</Label>
                            <p className="text-sm">{selectedImage.model}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-muted-foreground">Generate an image to see it here</p>
                </div>
              )}

              {selectedImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/40 backdrop-blur-md rounded-full"
                    onClick={() => {
                      const currentIndex = generatedImages.findIndex(img => img.url === selectedImage.url);
                      if (currentIndex > 0) {
                        setSelectedImage(generatedImages[currentIndex - 1]);
                      }
                    }}
                    disabled={generatedImages.indexOf(selectedImage) === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous image</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/40 backdrop-blur-md rounded-full"
                    onClick={() => {
                      const currentIndex = generatedImages.findIndex(img => img.url === selectedImage.url);
                      if (currentIndex < generatedImages.length - 1) {
                        setSelectedImage(generatedImages[currentIndex + 1]);
                      }
                    }}
                    disabled={generatedImages.indexOf(selectedImage) === generatedImages.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next image</span>
                  </Button>
                </>
              )}
            </div>
          </div>


          {/* Generated images row */}
          <div className="relative border-t" style={{ height: `${galleryHeight}px` }}>
            <ScrollArea className="w-full h-full">
              <div
                className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-border "
                style={{ cursor: 'ns-resize' }}
                onMouseDown={handleGalleryResize}
              />
              <div className="flex p-2 gap-2 overflow-x-auto">
                {generatedImages.map((image, index) => (
                  <div key={index} className="relative group flex-shrink-0">
                    <Image
                      src={image.url}
                      alt={`Generated image ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                      style={{ height: `${galleryHeight - 16}px`, width: 'auto' }}
                      unoptimized
                    />
                  </div>
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

