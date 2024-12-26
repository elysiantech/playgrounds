'use client'

import React, { Suspense } from 'react'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useApi } from "@/hooks/use-api"
import { ImageData, GenerateImageParams } from '@/lib/types';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/Sidebar';
import { GeneratedImage } from '@/components/GeneratedImage'
import { ImageGallery } from '@/components/ImageGallery'
import { useSession } from 'next-auth/react'
import { generatePlaceholderImage } from '@/lib/utils'
import { aspectRatios } from '@/lib/types';
import { pusherClient } from "@/lib/pusher-client";
import { ImageNavigation } from "@/components/ImageNavigation"
import { AIExpandModal } from "@/components/AIExpand"

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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [canBookmark, setCanBookmark] = React.useState(false);
  const [isExpandModalOpen, setIsExpandModalOpen] = React.useState(false)
  const { data: session, status } = useSession()
  const { generateImage, getImages, updateImage, deleteImage, upscaleImage, fillImage } = useApi()

  const aspectRatioMap = Object.fromEntries(
    aspectRatios.map((ar) => [ar.ratio, { width: ar.width, height: ar.height }])
  );

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
    if (!session.user?.id) return
    setCanBookmark(session.user?.role === "ADMIN");

    const sessionId = session.user?.id;

    pusherClient
      .subscribe(sessionId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .bind('imageUpdated', (updateImage: any) => {
        setGeneratedImages((prev) => {
          const updatedImages = prev.map((image) =>
            image.id === updateImage.id
              ? { ...image, url: `${updateImage.url}`, metadata: updateImage.metadata }
              : image
          );

          // If the selected image matches the updated one, update it
          const matchingImage = updatedImages.find((image) => image.id === updateImage.id);
          if (matchingImage && selectedImage?.id === updateImage.id) {
            setSelectedImage({ ...matchingImage });
          }

          return updatedImages;
        });
      });

    return () => pusherClient.unsubscribe(sessionId);
  }, [session, status, selectedImage]);

  React.useEffect(() => {
    if (searchParams.get('id')) {
      const id = searchParams.get('id');
      fetch(`/api/public/images/${id}`)
        .then(response => response.json())
        .then(imageParams => {
          const params: GenerateImageParams = {
            prompt: imageParams.prompt || undefined,
            creativity: imageParams.creativity,
            steps: imageParams.steps,
            seed: imageParams.seed,
            model: imageParams.model,
            numberOfImages: 1,
            aspectRatio: imageParams.aspectRatio,
            refImage: imageParams.refImage || undefined,
            maskImage: imageParams.style || undefined,
          };
          setGenerateParams((prev) => ({ ...prev, ...params }));
        });
    }
  }, [searchParams])

  const handleGenerateImage = async (params: GenerateImageParams) => {
    const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3']
    const imageUrl = generatePlaceholderImage('Generating Magic...', 'almost there', width, height)
    const newImages: ImageData[] = Array.from({ length: params.numberOfImages }, () => {
      const uniqueSeed = params.seed === 'random' ? Math.floor(Math.random() * 2 ** 32) : parseInt(params.seed);
      return {
        url: imageUrl,
        prompt: params.prompt!,
        model: params.model,
        creativity: params.creativity,
        steps: params.steps,
        seed: String(uniqueSeed),
        numberOfImages: params.numberOfImages,
        metadata: {},
        aspectRatio: params.aspectRatio,
        refImage: params.refImage,
        maskImage: params.maskImage,
        likes: 0,
      };
    });

    try {
      // Temporarily set placeholder images
      setGeneratedImages(prev => [...newImages, ...prev]);
      setSelectedImage(newImages[0]);

      // Generate images using the useApi hook
      const imageFunction = params.maskImage && params.refImage ? fillImage : generateImage;
      const generatedImages = await Promise.all(
        newImages.map((image) =>
          imageFunction({
            prompt: image.prompt,
            model: image.model,
            creativity: image.creativity,
            steps: image.steps,
            seed: image.seed,
            aspectRatio: image.aspectRatio,
            refImage: image.refImage || undefined,
            maskImage: image.maskImage || undefined,
            numberOfImages: 1
          })
        ) 
      )
      
      // Update newImages with the generated URLs
      const updatedImages = newImages.map((image, index) => ({
        ...image,
        id: generatedImages[index].id,
        url: generatedImages[index].url || image.url,
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
            maskImage: selectedImage.maskImage || undefined,
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
      case 'aiExpand':
        if (process.env.NODE_ENV !== 'production' && selectedImage) {
          setIsExpandModalOpen(true)
        }
        break;
      case 'upscale':
        if (process.env.NODE_ENV !== 'production' && selectedImage) {
          await handleUpscaleImage(selectedImage)
        }
        break;
      default:
        console.log(`Performing ${action} on the image`)
    }
  }

  const handleUpscaleImage = async (image: ImageData) => {
    const { width, height } = aspectRatioMap[image.aspectRatio ?? '4:3']
    const imageUrl = generatePlaceholderImage('Upscaling...', '', width, height)
    const newImage: ImageData = {
      ...image,
      id: undefined,
      url: imageUrl,
    };

    try {
      // Temporarily set placeholder images
      setGeneratedImages(prev => [newImage, ...prev]);
      setSelectedImage(newImage);

      const upscaledImage = await upscaleImage(image.id!);

      // Update newImages with the generated URLs
      newImage.id = upscaledImage.id;
      newImage.url = upscaledImage.url || imageUrl;
      newImage.metadata = upscaledImage.metadata

      // Update the placeholder with the generated images
      setGeneratedImages((prev) => {
        return prev.map((image) =>
          image.id === newImage.id
            ? { ...image, url: newImage.url, metadata: newImage.metadata }
            : image
        );
      });
      setSelectedImage({ ...newImage });

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

  const handleExpand = async (aspectRatio:string, refImage: string, maskImage: string) => {
    if (!selectedImage) return;
    const params: GenerateImageParams = {
      prompt: selectedImage.prompt,
      creativity: selectedImage.creativity,
      steps: selectedImage.steps,
      seed: selectedImage.seed,
      model: selectedImage.model,
      numberOfImages: 1,
      aspectRatio: aspectRatio,
      refImage: refImage,
      maskImage: maskImage,
    };

    setGenerateParams((prev) => ({
      ...prev,
      ...params,
    }));
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
            {selectedImage ? (
              <ImageNavigation images={generatedImages} selectedImage={selectedImage} setSelectedImage={setSelectedImage} />)
              : (null)}
          </div>
          {/* Generated images row */}
          <ImageGallery generatedImages={generatedImages} onImageSelect={setSelectedImage} />
        </main>
        {selectedImage && isExpandModalOpen && (<AIExpandModal isOpen={isExpandModalOpen} onClose={() => setIsExpandModalOpen(false)} image={selectedImage!} onGenerate={handleExpand} />)}
      </div>
    </div>
  )
}

