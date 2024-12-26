import React from 'react'
import Image from 'next/image'
import { X, Trash2, Download, Expand, EyeOff, Eye, WandSparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ImageData } from '@/lib/types';
import { SharePopover } from '@/components/share'

interface GeneratedImageProps {
  selectedImage?: ImageData
  onAction: (action: string) => void
  canBookmark: boolean
}

export const GeneratedImage: React.FC<GeneratedImageProps> = ({ selectedImage, onAction, canBookmark=false }) => {
  const [showTools, setShowTools] = React.useState(false)
  const [showInfoPanel, setShowInfoPanel] = React.useState(false)
  
  const customLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
    return `${src}?width=${Math.min(width, 1536)}&quality=${quality || 75}`;
  };

  return (
    <div className="flex-1 p-4 flex items-center justify-center overflow-hidden" style={{ height: '100%'}}>
      <div
        className="relative max-w-full max-h-full flex items-center justify-center"
        style={{ height: '100%', width: '100%' }}
        onMouseEnter={() => setShowTools(true)}
        onMouseLeave={() => setShowTools(false)}
      >
        {selectedImage ? (
          <div className="relative w-full h-full max-w-full max-h-full overflow-hidden" style={{ height: '100%' }}>
            <Image
              loader={customLoader}
              src={selectedImage.url.startsWith('data:image')? selectedImage.url: `/share/${selectedImage.url}`}
              alt="Generated image"
              className="object-contain rounded-lg shadow-lg border"
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
                            className="text-foreground/90 hover:text-foreground h-6 w-6"
                            onClick={() => action === 'info' ? setShowInfoPanel(true) : onAction(action)}
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
      </div>
    </div>
  )
}

