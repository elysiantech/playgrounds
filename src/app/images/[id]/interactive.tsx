'use client'

import React from 'react';
import Image from "next/image";
import { Download, WandSparkles, Play, Heart } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { SharePopover } from '@/components/share'
import { Header } from '@/components/header';
import { ImageData, VideoData } from '@/lib/types'
import { useRouter } from 'next/navigation';


export default function InteractiveImage({ image }: { image: ImageData | VideoData }) {
    const router = useRouter();
    const isVideo = (image && 'duration' in image || image.url.endsWith('.mp4'))
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const [showTools, setShowTools] = React.useState(false)

    const onAction = async (action: string) => {
        switch (action) {
            case 'remix':
                router.push(`/create?id=${image.id}`);
                break;
            case 'download':
                try {
                    const response = await fetch(`/share/${image.url}`, { mode: 'cors' });
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = `${image.url}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                } catch (error) {
                    console.error('Error downloading:', error);
                }
                break;
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
              
              <Header />
        <div className="relative max-w-full max-h-full flex items-center justify-center"
              style={{ height: '100vh', width: '100%' }}
              onMouseEnter={() => setShowTools(true)}
              onMouseLeave={() => setShowTools(false)}
            >
            { isVideo ? (
              <video
              ref={videoRef}
              src={`/share/${image.url}`}
              className="object-contain w-full h-full rounded-lg shadow-lg border"
              loop
              muted
              playsInline
              autoPlay
              />
            ):(
            <>
            <style jsx>{`
                @keyframes kenburns {
                    0% { transform: scale(1) translate(0, 0); }
                    50% { transform: scale(1.1) translate(-2%, -2%); }
                    100% { transform: scale(1) translate(0, 0); }
                }
                .kenburns-bg {
                    animation: kenburns 20s ease-in-out infinite;
                }
            `}</style>
            <div className="relative w-full h-full max-w-full max-h-full kenburns-bg overflow-hidden">
            <Image
                src={`/share/${image.url}`}
                alt={` Image ID:${image.id}`}
                className="object-contain rounded-lg shadow-lg"
                fill
                sizes="100vw"
                priority
            />
            </div>
            </>
            )}
            {showTools && image && (
                <>
                <div className="absolute top-2 right-2 bg-background/40 backdrop-blur-md rounded-lg p-2 flex space-x-2">
                  <SharePopover url={`${window.location.origin}/images/${image.id}`} />
                  <TooltipProvider>
                    {[
                      ...(!isVideo? [
                        { icon: Play, label: 'Remix As Video', action:'remix-to-video'},
                        { icon: WandSparkles, label: 'Remix', action: 'remix' },
                      ]:[
                        { icon: WandSparkles, label: 'Remix', action: 'remix' },
                      ]),
                      { icon: Download, label: 'Download', action: 'download' },
                      { icon: Heart, label: 'Like', action: 'like' },
                    ].map(({ icon: Icon, label, action }) => (
                      <Tooltip key={action}>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant='ghost'
                            className="text-foreground/90 hover:text-foreground h-6 w-6"
                            onClick={() => onAction(action)}
                          >
                            <Icon className={`h-3 w-3`} />
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
        </div>
            </div>
    );
}