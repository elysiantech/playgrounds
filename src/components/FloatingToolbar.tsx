'use client'

import React, { useState } from 'react'
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, ImageIcon, Video, Wand2, ArrowRight, Camera, Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'

import { GenerateImageParams, GenerateVideoParams, aspectRatios, imageModelMap, videoModelMap } from '@/lib/types';
import { useApi } from "@/hooks/use-api"

interface FloatingToolbarProps {
  params?: GenerateImageParams | GenerateVideoParams
  onGenerate: (params: GenerateImageParams | GenerateVideoParams) => void
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ params, onGenerate }) => {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [creativity, setCreativity] = useState(5)
  const [numberOfImages, setNumberOfImages] = React.useState(1)
  const [maskImage, setMaskImage] = useState<string | null>(null)
  const [refImage, setRefImage] = useState<string | null>(null)
  const [steps, setSteps] = useState(50)
  const [model, setModel] = useState(Object.values(imageModelMap)[0])
  const [seed, setSeed] = useState<'random' | 'fixed'>('random')
  const [fixedSeed, setFixedSeed] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { enhancePrompt, promptFromImage } = useApi()

  const [mode, setMode] = useState<'image' | 'video'>('image')
  const [length, setLength] = useState(5)
  const [motionGuidance, setMotionGuidance] = useState('Zoom')
  const [isGenerating, setIsGenerating] = useState(false)

  // handle updating generation parameters
  React.useEffect(() => {
    if (!params) return

    setPrompt(params.prompt!)
    setCreativity(params.creativity)
    setSteps(params.steps)
    setAspectRatio(params.aspectRatio!)

    // Conditional handling for GenerateImageParams | GenerateVideoParams
    const isVideoParams = ('duration' in params);
    if (mode === 'video' && isVideoParams) {
      setLength(params.duration!);
      setModel(params.model);
    } else if (mode === 'image' && !isVideoParams) {
      setModel(params.model);
    }
    
    
    if (params.seed !== 'random') {
      setSeed('fixed')
      setFixedSeed(params.seed)
    }
    
    setNumberOfImages(params.numberOfImages)
    setRefImage(params.refImage!)
    setMaskImage(params.maskImage!)

  }, [params])

  const handleGenerate = () => {
    const baseParams: GenerateImageParams = {
      prompt,
      aspectRatio,
      creativity,
      numberOfImages,
      seed: seed === 'fixed' ? fixedSeed : seed,
      model,
      steps,
      ...(refImage && { refImage }),
      ...(maskImage && { maskImage }),
    } 

    // Extend params for video mode
    const params: GenerateImageParams | GenerateVideoParams =
    mode === 'video'
      ? { ...baseParams, duration: length }
      : baseParams;

    setIsGenerating(true)
    onGenerate(params)
    setIsGenerating(false)
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

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = (event.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
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
    input.onchange = async () => {
      if (!input.files?.length) return;
      const file = input.files[0];
      setIsProcessing(true)
      const newPrompt = await promptFromImage(file)
      setPrompt(newPrompt);
      setIsProcessing(false)
    }
    input.click()
  }

  const handleEnhancePrompt = async () => {
    try {
      setIsProcessing(true)
      const enhancedPrompt = await enhancePrompt(prompt)
      setPrompt(enhancedPrompt)
      setIsProcessing(false)
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      setIsProcessing(false)
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (!input.files?.length) return;
      const file = input.files[0];
      const reader = new FileReader()
      reader.onloadend = () => {
        setRefImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const placeholderText = mode === 'image'
    ? "Describe your idea (e.g., A glowing forest at sunset)."
    : "Describe your video idea (e.g., A 3-second loop of stars spinning)."

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`w-full p-4`}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="relative">
          <Textarea //Input
            //type="text"
            placeholder={placeholderText}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handlePaste}
            className={`w-full pr-24 pl-10 py-3 text-lg`}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  onClick={handleAttachImage}
                >
                  {isProcessing
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Camera className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
                <TooltipContent><p>Turn an image into a prompt</p></TooltipContent>
              </Tooltip>
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  onClick={handleEnhancePrompt}
                >
                  {isProcessing
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Sparkles className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
                <TooltipContent><p>Enhance your idea!</p></TooltipContent>
              </Tooltip>
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setPrompt('')}>
                  <X className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
                <TooltipContent><p>Clear prompt</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex rounded-md overflow-hidden">
                  <Button
                    variant={mode === 'image' ? 'default' : 'outline'}
                    className={`rounded-r-none ${mode === 'image' ? 'bg-gray-500 shadow-md' : ''}`}
                    onClick={() => { setMode('image'); setModel(Object.values(imageModelMap)[0]) }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    variant={mode === 'video' ? 'default' : 'outline'}
                    className={`rounded-l-none ${mode === 'video' ? 'bg-gray-500 shadow-md' : ''}`}
                    onClick={() => { setMode('video'); setModel(Object.values(videoModelMap)[0]) }}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose between Image or Video creation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[4.5rem] items-center justify-center" title="Aspect ratio" id="aspect-ratio-trigger">
                      <AspectRatioIcon ratio={aspectRatio} />
                      {aspectRatio}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set aspect ratio</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent
              className="w-80"
              sideOffset={5} // Adds some spacing between the button and the popup
            >
              <div className="flex flex-col space-y-2">
                {aspectRatios.map((ar) => (
                  <Button
                    key={ar.ratio}
                    variant={aspectRatio === ar.ratio ? 'default' : 'outline'}
                    onClick={() => {
                      setAspectRatio(ar.ratio);
                      document.getElementById('aspect-ratio-trigger')?.click();
                    }}
                  >
                    <div className="flex justify-start">
                      <AspectRatioIcon ratio={ar.ratio} />
                      <span className="ml-2">{ar.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="outline">{model}</Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select an AI model</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">AI Model</h4>
                <div className="grid grid-cols-2 gap-2">
                  {mode === 'video'
                    ? Object.values(videoModelMap).map((value) => (
                      <Button key={value} variant={model === value ? 'default' : 'outline'} className="justify-start"
                        onClick={() => setModel(value)}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        {value}
                      </Button>))
                    : Object.values(imageModelMap).map((value) => (
                      <Button key={value} variant={model === value ? 'default' : 'outline'} className="justify-start"
                        onClick={() => setModel(value)}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        {value}
                      </Button>))
                  }
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {mode === 'video' && (
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button variant="outline">{motionGuidance}</Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add motion guidance</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Motion Guidance</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Zoom', 'Pan Left', 'Pan Right', 'Rotate'].map((motion) => (
                      <Button
                        key={motion}
                        variant={motionGuidance === motion ? 'default' : 'outline'}
                        onClick={() => setMotionGuidance(motion)}
                        className="justify-start"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {motion}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  {!refImage ? (
                    <Button
                      variant="outline"
                      onClick={handleImageUpload}
                      className="flex items-center space-x-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {mode === 'image' ? 'Reference' : '1st Frame'}
                    </Button>
                  ) : (
                    <div className="relative flex items-center">
                      {/* Preview the uploaded image */}
                      <Button variant="outline" className="flex items-center space-x-2" onClick={() => setRefImage(null)}>
                      <Image
                        src={refImage.startsWith('data:image') ? refImage : `/share/${refImage}`}
                        alt="Uploaded"
                        width={25}
                        height={25}
                        className="rounded-md object-cover border border-gray-300 x-5 w-5"
                      />
                      </Button>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {mode === 'image'
                    ? 'Upload an image to guide style or composition'
                    : 'Upload an image to define the first frame of your video'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Advanced settings">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
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
              <div className="space-y-2">
                <Label>Steps</Label>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={[steps]}
                  onValueChange={(value) => setSteps(value[0])}
                />
                <div className="flex justify-between text-xs">
                  <span>Fast</span>
                  <span>Balanced</span>
                  <span>High</span>
                </div>
              </div>
              {mode === 'video' && (
                <div className="space-y-2">
                  <Label>Video Length</Label>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[length]}
                    onValueChange={(value) => setLength(value[0])}
                  />
                  <div className="flex justify-between text-xs">
                    <span>1s</span>
                    <span>10s</span>
                  </div>
                </div>
              )}
              <div className="flex items-center space-y-2">
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

            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleGenerate}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Creating Magic...' : 'Generate'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create your masterpiece!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  )
}

export default FloatingToolbar
