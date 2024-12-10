'use client'

import React, { Suspense } from 'react'
import { Upload, X, Sparkles, Trash2, Download, Expand, EyeOff, Eye, WandSparkles, ChevronLeft, ChevronRight, Info, Paperclip, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import { useApi } from "@/hooks/use-api"
import { processWithConcurrencyLimit } from '@/lib/utils'
import { ImageData, aspectRatios } from '@/lib/types';
import { SharePopover } from '@/components/share'
import { Header } from '@/components/header';
import { useSession } from 'next-auth/react'

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Playground />
    </Suspense>
  );
}

function Playground() {
  const { setTheme } = useTheme()
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
  const [galleryHeight, setGalleryHeight] = React.useState(128);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [aspectRatio, setAspectRatio] = React.useState('4:3');
  const [canBookmark, setCanBookmark] = React.useState(false);
  const { data:session, status} = useSession()
  const { enhancePrompt, generateImage, getImages, updateImage, deleteImage, upscaleImage, promptFromImage } = useApi()

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
    getImages().then((images) => {
      const parsedImages = images.map((image) => {
        return { ...image, url: `${image.url}` }
      });
      setGeneratedImages(parsedImages)
    })
  }, []);

  React.useEffect(() => {
    if (!session) return;
    if (status !== 'authenticated') return
    setCanBookmark(session.user?.role === "ADMIN");
  },[session, status]);
  React.useEffect(() => {
    const promptParam = searchParams.get('prompt')
    const modelParam = searchParams.get('model')
    const creativityParam = searchParams.get('creativity')
    const stepsParam = searchParams.get('steps')
    const seedParam = searchParams.get('seed')
    const numberOfImagesParam = searchParams.get('numberOfImages')
    const aspectRatioParam = searchParams.get('aspectRatio')

    if (promptParam) setPrompt(promptParam)
    if (modelParam) setModel(modelParam)
    if (creativityParam) setCreativity(parseInt(creativityParam))
    if (stepsParam) setSteps(parseInt(stepsParam))
    if (seedParam) {
      setSeed('fixed')
      setFixedSeed(seedParam)
    }
    if (numberOfImagesParam) setNumberOfImages(parseInt(numberOfImagesParam))
    if(aspectRatioParam) setAspectRatio(aspectRatioParam)
  }, [searchParams])

  const customLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
    return `${src}?width=${width}&quality=${quality || 75}`;
  };

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

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = (event.clipboardData).items;
    for(let i=0; i < items.length; i++){
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file){
          setIsProcessing(true)
          const newPrompt = await promptFromImage(file);
          setPrompt(newPrompt);
          setIsProcessing(false)
        }
        // Handle pasted image
        event.preventDefault();
        return
      }
    }
  };

  const handleAttachImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange =async () => {
      if (!input.files?.length) return;
      const file = input.files[0];
      setIsProcessing(true)
      const newPrompt = await promptFromImage(file)
      setPrompt(newPrompt);
      setIsProcessing(false)
    }
    input.click()
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
        seed: String(uniqueSeed),
        numberOfImages,
        metadata: {},
        aspectRatio
      };
    });

    try {
      // Temporarily set placeholder images
      setGeneratedImages(prev => [...newImages, ...prev]);
      setSelectedImage(newImages[0]);

      // Generate images using the useApi hook
      const generatedImages = await processWithConcurrencyLimit(
        newImages,
        2, // max 2 concurrently lower costs
        (image) => generateImage({
          prompt: image.prompt,
          model: image.model,
          creativity: image.creativity,
          steps: image.steps,
          seed: image.seed,
          aspectRatio: image.aspectRatio,
          refImage: refImage || undefined,
          numberOfImages: 1
        })
      );

      // Update newImages with the generated URLs
      const updatedImages = newImages.map((image, index) => ({
        ...image,
        id: generatedImages[index].id,
        url: `${generatedImages[index].url}`,
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
  const handleUpscaleImage = async (image: ImageData) => {

    const newImage: ImageData = {
      ...image,
      id: undefined,
      url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' dy='.3em' fill='%23999'%3EUpscaling...%3C/text%3E%3C/svg%3E`,
    };

    try {
      // Temporarily set placeholder images
      setGeneratedImages(prev => [newImage, ...prev]);
      setSelectedImage(newImage);

      const upscaledImage = await upscaleImage(image.id!);

      // Update newImages with the generated URLs
      newImage.id = upscaledImage.id;
      newImage.url = `${upscaledImage.url}`;
      newImage.metadata = upscaledImage.metadata

      // Update the state with the generated images
      setGeneratedImages(prev => [newImage, ...prev.slice(1)]);
      setSelectedImage(newImage);

    } catch (error) {
      console.error('Error generating image:', error)
      // Remove set placeholder image
      setGeneratedImages(prev => [...prev.slice(1)]);
      setSelectedImage(null);
      toast({
        title: "Error",
        description: "Failed to upscale image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageAction = async (action: string) => {
    switch (action) {
      case 'remix':
        if (selectedImage) {
          setPrompt(selectedImage.prompt)
          setModel(selectedImage.model)
          setCreativity(selectedImage.creativity)
          setSteps(selectedImage.steps)
          setSeed('fixed')
          setFixedSeed(String(selectedImage.seed))
          setAspectRatio(selectedImage.aspectRatio?? '4:3')
          setNumberOfImages(1)
        }
        break;
      case 'delete':
        if (selectedImage) {
          handleDeleteImage(selectedImage)
        }
        break;
      case 'bookmark':
        if (selectedImage) {
          const updatedImages = generatedImages.map(image =>
            image.id === selectedImage.id ? { ...image, bookmark: !image.bookmark } : image
          );
          setGeneratedImages(updatedImages);
          setSelectedImage({ ...selectedImage, bookmark: !selectedImage.bookmark });
          try {
            const isBookmarked = !selectedImage.bookmark;
            await updateImage(selectedImage.id!, { bookmark: isBookmarked });
            toast({
              title: isBookmarked ? "Visible to Public" : "Not Published",
              description: `The image has been ${isBookmarked ? "bookmarked" : "unbookmarked"}.`,
            });
          } catch (error) {
            console.error('Failed to update bookmark in database:', error);
            toast({
              title: "Error",
              description: "Failed to update bookmark. Please try again.",
              variant: "destructive",
            });
          }
        }
        break;
      case 'info':
        setShowInfoPanel(!showInfoPanel)
        break;
      case 'upscale':
      case 'aiExpand':
        if (process.env.NODE_ENV !== 'production' && selectedImage) {
          await handleUpscaleImage(selectedImage)
        }
        break;
      default:
        console.log(`Performing ${action} on the image`)
    }
  }

  const handleDeleteImage = async (imageToDelete: ImageData) => {
    try {
      await deleteImage(imageToDelete.id!);
      setGeneratedImages(prev => prev.filter(img => img.id !== imageToDelete.id))
      if (selectedImage && selectedImage.id === imageToDelete.id) {
        let nextImage = null;
        generatedImages.forEach((image: ImageData, index: number) => {
          if (image.id === imageToDelete.id) {
            nextImage = (index + 1) <= generatedImages.length ? generatedImages[index + 1] : null
            return;
          }
        })
        setSelectedImage(nextImage)
      }


      toast({
        title: "Image Deleted",
        description: "The image has been deleted successfully.",
      });
    } catch (error) {
      console.error('Failed to delete image from database:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleDownload = async () => {
    if (selectedImage) {
      try {
        const response = await fetch(`/share/${selectedImage.url}`, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = selectedImage.url;
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

  function AspectRatioIcon({ ratio }: { ratio: string }) {
    const [width, height] = ratio.split(':').map(Number);
  
    // Calculate the scaling factor and offsets for centering
    const maxSize = 16; // Max size for the rect within the SVG
    const scale = maxSize / Math.max(width, height);
    const rectWidth = width * scale;
    const rectHeight = height * scale;
    const offsetX = (20 - rectWidth) / 2; // Center horizontally
    const offsetY = (20 - rectHeight) / 2; // Center vertically
  
    return (
      <svg
        width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
        className="text-foreground"
      >
        <rect x={offsetX} y={offsetY} width={rectWidth} height={rectHeight} stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Sidebar */}
      <aside className={`w-full md:w-64 border-r p-4 flex flex-col space-y-4 ${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <Label>Prompt</Label>
          {prompt && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setPrompt('')}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Delete prompt</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear prompt</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
    </div>
          <Textarea
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handlePaste}
            className="min-h-[100px]"
          />
          <TooltipProvider>
          <div className="absolute bottom-2 left-2 bg-background/50 rounded-full p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleAttachImage}
              >
                 {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                <span className="sr-only">Attach an image</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach an image</p>
            </TooltipContent>
          </Tooltip>
        </div>
          {prompt && (
            <>
              <div className="absolute bottom-2 right-2 bg-background/50 rounded-full p-1">
              <Tooltip>
              <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={handleEnhancePrompt}
              >
                 {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                
                <span className="sr-only">Enhance prompt</span>
              </Button>
              </TooltipTrigger>
                <TooltipContent>
                  <p>Enhance prompt</p>
                </TooltipContent>
              </Tooltip>
              </div>
            </>
          )}
          </TooltipProvider>
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
          <AccordionItem value="outputsize">
            <AccordionTrigger>Output Size</AccordionTrigger>
            <AccordionContent className="space-y-4">
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger key={aspectRatio} className="w-full flex items-center">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ar) => (
                  <SelectItem key={ar.ratio} value={ar.ratio}>
                    <div className="flex items-center">
                      <AspectRatioIcon ratio={ar.ratio} />
                      <span className="ml-2">{ar.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced</AccordionTrigger>
            <AccordionContent className="space-y-4">
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
        <Header toggleSidebar={toggleSidebar} />
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
                    src={selectedImage.url.startsWith('data:image')? selectedImage.url: `/share/${selectedImage.url}`}
                    alt="Generated image"
                    className="object-contain rounded-lg shadow-lg"
                    fill
                    sizes="100vw"
                    priority
                  />
                  {showTools && selectedImage && (
                    <>
                      <div className="absolute top-2 right-2 bg-background/40 backdrop-blur-md rounded-lg p-2 flex space-x-2">
                        <SharePopover url={`${window.location.origin}/images/${selectedImage.id}`} />
                        <TooltipProvider>
                          {[
                            { icon: Expand, label: 'Super Resolution', action: 'aiExpand' },
                            { icon: Download, label: 'Download', action: 'download' },
                            { icon: WandSparkles, label: 'Remix', action: 'remix' },
                            { icon: Info, label: 'Info', action: 'info' },
                            ...(canBookmark
                              ? [{ 
                                  icon: selectedImage.bookmark ? Eye : EyeOff, 
                                  label: selectedImage.bookmark ? 'Visible to Public' : 'Hidden From Public', 
                                  action: 'bookmark' 
                                }]
                              : []),
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
                      const currentIndex = generatedImages.findIndex(img => img.id === selectedImage.id);
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
                      const currentIndex = generatedImages.findIndex(img => img.id === selectedImage.id);
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
          <div
            className="relative border-t"
            style={{
              height: `${galleryHeight}px`,
              maxHeight: `${galleryHeight}px`, // Constrain ScrollArea height
              maxWidth: "100vw", // Constrain to viewport width
            }}
          >
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
                      loader={customLoader}
                      src={image.url.startsWith('data:image')? image.url: `/share/${image.url}`}
                      alt={`Generated image ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                      style={{ height: `${galleryHeight - 16}px`, width: 'auto' }}
                    //unoptimized
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

