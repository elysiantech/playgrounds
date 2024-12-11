'use client'

import React, { Suspense } from 'react'
import {ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useApi } from "@/hooks/use-api"
import { processWithConcurrencyLimit } from '@/lib/utils'
import { ImageData, GenerateImageParams } from '@/lib/types';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/Sidebar';
import { GeneratedImage } from '@/components/GeneratedImage'
import { ImageGallery } from '@/components/ImageGallery'
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
  const [generateParams, setGenerateParams] = React.useState<GenerateImageParams | null>(null)
  const [generatedImages, setGeneratedImages] = React.useState<ImageData[]>([])
  const [selectedImage, setSelectedImage] = React.useState<ImageData | null>(null)
  const [showInfoPanel, setShowInfoPanel] = React.useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [canBookmark, setCanBookmark] = React.useState(false);
  const { data:session, status} = useSession()
  const { generateImage, getImages, updateImage, deleteImage, upscaleImage } = useApi()

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
    if (searchParams.size > 0) {
      const params: GenerateImageParams = {
        prompt: searchParams.get('prompt') || undefined,
        creativity: parseFloat(searchParams.get('creativity') || '0'),
        steps: parseInt(searchParams.get('steps') || '0', 10),
        seed: searchParams.get('seed') || 'random',
        model: searchParams.get('model') || 'Flux.1-Schnell',
        numberOfImages: parseInt(searchParams.get('numberOfImages') || '0', 10),
        aspectRatio: searchParams.get('aspectRatio') || undefined,
        refImage: searchParams.get('refImage') || undefined,
        style: searchParams.get('style') || undefined,
        pose: searchParams.get('pose') || undefined,
        composition: searchParams.get('composition') || undefined,
      };
      
      setGenerateParams((prev) => ({
        ...prev,
        ...params,
      }));
    }
  }, [searchParams])

  const handleGenerateImage = async (params:GenerateImageParams) => {
    
    const newImages: ImageData[] = Array.from({ length: params.numberOfImages }, () => {
      const uniqueSeed = params.seed === 'random' ? Math.floor(Math.random() * 2 ** 32) : parseInt(params.seed);
      return {
        url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' dy='.3em' fill='%23999'%3EGenerating...%3C/text%3E%3C/svg%3E`,
        prompt: params.prompt!,
        model: params.model,
        creativity: params.creativity,
        steps: params.steps,
        seed: String(uniqueSeed),
        numberOfImages: params.numberOfImages,
        metadata: {},
        aspectRatio: params.aspectRatio,
        refImage: params.refImage,
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
          refImage: image.refImage || undefined,
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
      setGeneratedImages(prev => [...updatedImages, ...prev.slice(params.numberOfImages)]);
      setSelectedImage(updatedImages[0]);
    } catch (error) {
      console.error('Error generating image:', error)
      // Remove set placeholder images
      setGeneratedImages(prev => [...prev.slice(params.numberOfImages)]);
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
          const params: GenerateImageParams = {
            prompt: selectedImage.prompt,
            creativity: selectedImage.creativity,
            steps: selectedImage.steps,
            seed: selectedImage.seed,
            model: selectedImage.model,
            numberOfImages: 1,
            aspectRatio: selectedImage.aspectRatio || '4:3',
            refImage: selectedImage.refImage || undefined,
            style: selectedImage.style || undefined,
            pose: selectedImage.pose || undefined,
            composition: selectedImage.composition || undefined,
          };
          
          setGenerateParams((prev) => ({
            ...prev,
            ...params,
          }));
        }
        break;
      case 'delete':
        if (selectedImage) {
          handleDeleteImage(selectedImage)
        }
        break;
      case 'download':
        if (selectedImage) {
          handleDownload() 
        }
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Sidebar */}
      <div className="h-full w-full md:w-64 md:flex-shrink-0 overflow-y-auto bg-sidebar">
        <Sidebar isOpen={isSidebarOpen} params={generateParams!} onGenerate={handleGenerateImage} />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header toggleSidebar={toggleSidebar} />
        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="relative w-full h-full">
  
          {/* Selected image area */}
          <GeneratedImage 
            selectedImage={selectedImage!}
            onAction={handleImageAction} 
            canBookmark={canBookmark} 
          />
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
          {/* Generated images row */}
          <ImageGallery generatedImages={generatedImages} onImageSelect={setSelectedImage} />
        </main>
      </div>
    </div>
  )
}

