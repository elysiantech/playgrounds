import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles } from 'lucide-react'
import { aspectRatios, ImageData } from '@/lib/types';

interface AIExpandProps {
    image: ImageData,
    isOpen: boolean
    onClose: () => void
    onGenerate: (aspectRatio:string, refImage: string, maskImage: string) => void;
}

export const AIExpandModal: React.FC<AIExpandProps> = ({ image, isOpen, onClose, onGenerate }) => {
    const [aspectRatio, setAspectRatio] = useState(image.aspectRatio || '4:3')
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (image?.url) {
            // Create a new Image object to load the image and get its dimensions
            const img = new window.Image();
            img.src = image.url.startsWith("data:") ? image.url : `/share/${image.url}`;
            img.onload = () => {
                setNaturalDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
            img.onerror = () => {
                console.error("Failed to load the image.");
            };
            setAspectRatio(image.aspectRatio || '4:3')
        }
    }, [image]);

    useEffect(() => {
        if (canvasRef.current && imageRef.current && naturalDimensions.width && naturalDimensions.height) {
            const canvas = canvasRef.current;
            const img = imageRef.current;
            const canvasRect = canvas.getBoundingClientRect();
            const imgAspectRatio = naturalDimensions.width / naturalDimensions.height;

            const [canvasWidth, canvasHeight] = aspectRatio.split(':').map(Number);
            const canvasAspectRatio = canvasWidth / canvasHeight;

            let newWidth, newHeight;
            if (imgAspectRatio > canvasAspectRatio) {
                newWidth = canvasRect.width;
                newHeight = canvasRect.width / imgAspectRatio;
            } else {
                newHeight = canvasRect.height;
                newWidth = canvasRect.height * imgAspectRatio;
            }

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;

            setPosition({
                x: (canvasRect.width - newWidth) / 2,
                y: (canvasRect.height - newHeight) / 2,
            });
        }
    }, [aspectRatio, naturalDimensions]);

    const handleMouseDown = (event: React.MouseEvent) => {
        event.preventDefault(); 
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging && canvasRef.current && imageRef.current) {
            const canvas = canvasRef.current
            const img = imageRef.current
            const canvasRect = canvas.getBoundingClientRect()
            const newX = e.clientX - canvasRect.left - img.width / 2
            const newY = e.clientY - canvasRect.top - img.height / 2
            setPosition({
                x: Math.max(0, Math.min(newX, canvasRect.width - img.width)),
                y: Math.max(0, Math.min(newY, canvasRect.height - img.height))
            })
        }
    }

    const handleMouseUp =(event: React.MouseEvent) => {
        event.preventDefault(); 
        setIsDragging(false)
    }

    const handleGenerate = () => {
        if (!canvasRef.current || !imageRef.current) return;
    
        const canvasWidth = naturalDimensions.width;
        const canvasHeight = naturalDimensions.height;
    
        // 1. Create an offscreen canvas
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = canvasWidth;
        offscreenCanvas.height = canvasHeight;
        const ctx = offscreenCanvas.getContext('2d');
    
        if (!ctx) return;
    
        // 2. Draw the image onto the canvas at its current position
        const img = imageRef.current;
        const { x, y } = position;
    
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(
            img, 
            x, 
            y, 
            img.width, 
            img.height
        );
    
        // 3. Generate refImage
        const refImagePromise = new Promise<string>((resolve) => {
            offscreenCanvas.toBlob((blob) => {
                if (!blob) return;
                convertBlobToDataURL(blob, resolve);
            }, 'image/png');
        });
    
        // 4. Generate maskImage
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
        const maskCtx = maskCanvas.getContext('2d');
    
        if (maskCtx) {
            // Fill the mask canvas with white
            maskCtx.fillStyle = 'white';
            maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
            // Draw the image as black
            maskCtx.globalCompositeOperation = 'destination-out';
            maskCtx.drawImage(offscreenCanvas, 0, 0);
        }
    
        const maskImagePromise = new Promise<string>((resolve) => {
            maskCanvas.toBlob((blob) => {
                if (!blob) return;
                convertBlobToDataURL(blob, resolve);
            }, 'image/png');
        });
    
        // 5. Call the onGenerate callback with the images
        Promise.all([refImagePromise, maskImagePromise]).then(([refImage, maskImage]) => {
            onGenerate(aspectRatio, refImage, maskImage);
            console.log('Reference Image:', refImage);
            console.log('Mask Image:', maskImage);
        });
    
        onClose(); // Close the modal after generation
    
    };

    const convertBlobToDataURL = (blob: Blob, callback: (dataURL: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            callback(reader.result as string);
        };
        reader.readAsDataURL(blob);
    };

    const getCanvasStyle = () => {
        const [width, height] = aspectRatio.split(':').map(Number)
        const maxSize = 512 // You can adjust this value
        const scale = Math.min(maxSize / width, maxSize / height)
        return {
            width: `${width * scale}px`,
            height: `${height * scale}px`,
            position: 'relative',
        }
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Expand Image Canvas</DialogTitle>
                </DialogHeader>
                {/* Image View*/}
                <div className="grid grid-cols-[2fr,1fr] gap-4 h-full">
                    <div className="col-span-1 flex items-center justify-center overflow-hidden">
                        <div
                            ref={canvasRef}
                            className='border'
                            style={{
                                ...getCanvasStyle() as React.CSSProperties, // Ensure styles conform to CSSProperties
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        >
                            <Image
                                ref={imageRef}
                                src={image? `/share/${image.url}` : ''}
                                alt="Original image"
                                width={naturalDimensions.width} 
                                height={naturalDimensions.height} 
                                // fill
                                style={{
                                    position: 'absolute',
                                    cursor: 'move',//isDragging ? 'move' : 'default',
                                    left: `${position.x}px`,
                                    top: `${position.y}px`,
                                }}
                                onMouseLeave={handleMouseUp}
                            />
                        </div>
                    </div>
                    <div className="col-span-1 space-y-4 flex flex-col h-full">
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select aspect ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                {aspectRatios.map((ar) => (
                                    <SelectItem key={ar.ratio} value={ar.ratio}>
                                    <div className="flex items-center">
                                        <AspectRatioIcon ratio={ar.ratio} />
                                        <span className="ml-2">{ar.ratio + ' ' + ar.label}</span>
                                    </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGenerate} className="w-full">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


