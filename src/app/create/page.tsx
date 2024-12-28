'use client'

import React, { useState, useRef, Suspense } from 'react'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useApi } from "@/hooks/use-api"
import { ImageData, GenerateImageParams, VideoData, GenerateVideoParams, videoModelMap } from '@/lib/types';
import { Header } from '@/components/header';
import FloatingToolbar from '@/components/FloatingToolbar'
import { GeneratedImage } from '@/components/GeneratedImage'
import { ImageGallery } from '@/components/ImageGallery'
import { useSession } from 'next-auth/react'
import { generatePlaceholderImage } from '@/lib/utils'
import { aspectRatios } from '@/lib/types';
import { pusherClient } from "@/lib/pusher-client";
import { ImageNavigation } from "@/components/ImageNavigation"
import { AIExpandModal } from "@/components/AIExpand"

export default function CreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Create />
    </Suspense>
  );
}

function Create() {
  const { setTheme } = useTheme()
  const searchParams = useSearchParams()
  const [generateParams, setGenerateParams] = React.useState<GenerateImageParams | GenerateVideoParams | null>(null)
  const [generatedImages, setGeneratedImages] = React.useState<ImageData[] | VideoData[]>([])
  const [selectedImage, setSelectedImage] = React.useState<ImageData | VideoData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [canBookmark, setCanBookmark] = React.useState(false);
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false)
  const { data: session, status } = useSession()
  const recentGenerationRef = useRef<HTMLDivElement | null>(null);
  const { generateImage, getImages, updateImage, deleteImage, upscaleImage, fillImage, generateVideo } = useApi()
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)
  
  const aspectRatioMap = Object.fromEntries(
    aspectRatios.map((ar) => [ar.ratio, { width: ar.width, height: ar.height }])
  );


  React.useEffect(() => {
    if (toolbarRef.current) setToolbarHeight(toolbarRef.current.offsetHeight)
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight)
    
  }, [])

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
    getImages({includeVideo:true}).then((images) => {
      const parsedImages = images.map((image) => {
        return { ...image, url: `${image.url}` }
      });
      setGeneratedImages(parsedImages)

      setTimeout(() => {
        if (recentGenerationRef.current) {
          recentGenerationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
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

  const handleGenerateImage = async (params: GenerateImageParams | GenerateVideoParams) => {
    const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3']
    const imageUrl = generatePlaceholderImage('Generating Something Amazing', 'One moment, magic is happening…', width, height)
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

      // Generate images/video using the useApi hook
      const imageFunction = params.maskImage && params.refImage ? fillImage : generateImage;
      const isVideo = ('duration' in params);

      const generatedImages = await Promise.all(
        newImages.map((image) => {
          const baseParams = {
            prompt: image.prompt,
            model: image.model,
            creativity: image.creativity,
            steps: image.steps,
            seed: image.seed,
            aspectRatio: image.aspectRatio,
            refImage: image.refImage || undefined,
            maskImage: image.maskImage || undefined,
            numberOfImages: 1
          }
          if (!isVideo) 
            return imageFunction(baseParams)
          else return generateVideo({...baseParams, duration: params.duration})
        })
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
      console.error('Error generating:', error)
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
      case 'remix-to-video':
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
          if (action === 'remix-to-video' && !('duration' in selectedImage)){
            params.refImage = selectedImage.url;
            params.maskImage = undefined;
            params.model = Object.values(videoModelMap)[0];
            params.seed = 'random'
            const remixParams: GenerateVideoParams = { ...params, duration:5}
            setGenerateParams(remixParams);
            return 
          }
          setGenerateParams(params);
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
    const imageUrl = generatePlaceholderImage('Upscaling Your Creation', 'One moment, magic is happening…', width, height)
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
            ? { ...image, url: newImage.url || image.url, metadata: newImage.metadata }
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

  return (
    <div className="min-h-screen flex flex-col">
      <div ref={headerRef}>
      <Header />
      </div>
      <div className="flex-grow flex overflow-hidden" style={{ height: `calc(100vh - ${toolbarHeight + headerHeight}px)` }}>
        <div className="flex-grow overflow-auto">
          <GeneratedImage selectedImage={selectedImage!} onAction={handleImageAction} canBookmark={false} />
          {selectedImage ? (
            <ImageNavigation images={generatedImages} selectedImage={selectedImage} setSelectedImage={setSelectedImage} />)
            : (null)}
        </div>
        <div className="mt-4 mb-4 border rounded-lg overflow-auto">
          <ImageGallery generatedImages={generatedImages} onImageSelect={setSelectedImage} direction="vertical" />
        </div>
      </div>
      <div ref={toolbarRef}>
        <FloatingToolbar params={generateParams!} onGenerate={handleGenerateImage} />
      </div>
      {selectedImage && isExpandModalOpen && (<AIExpandModal isOpen={isExpandModalOpen} onClose={() => setIsExpandModalOpen(false)} image={selectedImage!} onGenerate={() => { }} />)}
    </div>
  )
}

