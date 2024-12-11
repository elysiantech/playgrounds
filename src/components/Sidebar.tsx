import React from 'react'
import { Upload, X, Sparkles,  Paperclip, Loader2 } from 'lucide-react'
import Image from 'next/image'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useApi } from "@/hooks/use-api"
import { GenerateImageParams, aspectRatios } from '@/lib/types';


interface FloatingToolbarProps {
    params?: GenerateImageParams
    isOpen?: boolean
    onGenerate: (params: GenerateImageParams) => void
  }
  
export const Sidebar: React.FC<FloatingToolbarProps> = ({ params, onGenerate, isOpen=true }) => {  
  const [prompt, setPrompt] = React.useState('')
  const [creativity, setCreativity] = React.useState(5)
  const [steps, setSteps] = React.useState(50)
  const [seed, setSeed] = React.useState<'random' | 'fixed'>('random')
  const [fixedSeed, setFixedSeed] = React.useState('')
  const [numberOfImages, setNumberOfImages] = React.useState(1)
  const [model, setModel] = React.useState('Flux.1-Schnell')
  const [refImage, setRefImage] = React.useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = React.useState('4:3');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { enhancePrompt, promptFromImage } = useApi()

  React.useEffect(() => {
    if (params){
        setPrompt(params.prompt!)
        setModel(params.model)
        setCreativity(params.creativity)
        setSteps(params.steps)
        if (params.seed !== 'random') {
            setSeed('fixed')
            setFixedSeed(params.seed)
        }
        setNumberOfImages(params.numberOfImages)
        setAspectRatio(params.aspectRatio!)
        setRefImage(params.refImage!)
    }
  }, [params])

  const handleGenerateImage = () => {
    const params: GenerateImageParams = {
      prompt,
      aspectRatio,
      creativity,
      numberOfImages,
      seed,
      model,
      steps,
      refImage:refImage!,
    }
    onGenerate(params)
  }

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
        <rect x={offsetX} y={offsetY} width={rectWidth} height={rectHeight} stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

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

  return (
    <aside className={`w-full md:w-64 border-r p-4 flex flex-col space-y-4 ${isOpen ? 'block' : 'hidden'} md:block`}>
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
  )
}

