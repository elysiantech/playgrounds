'use client'

import { useState } from 'react';
import { Copy, Globe } from 'lucide-react';
import { FaReddit, FaPinterest, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type SharePopoverProps = {
  url: string;
};

export function SharePopover({ url }: SharePopoverProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pageURL = encodeURIComponent(url);
  const pageTitle = ""

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-3">
        {/* Share with Link Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="share-link" className="text-sm font-medium">
              Share with link
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? "Copied!" : "Copy to clipboard"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Input
              id="share-link"
              type="text"
              value={url}
              readOnly
              className="pr-10"
            />
          </div>
        </div>

        {/* Social Share Section */}
        <div className="space-y-2">
          <label htmlFor="share-link" className="text-sm font-medium">
            Share on Social
          </label>
          <div className="flex justify-center items-center space-x-4">
            <TooltipProvider>
              {[
                { icon: FaTwitter, label: "X", action: `https://x.com/intent/tweet?text=${pageURL}` },
                { icon: FaReddit, label: "Reddit", action: `https://www.reddit.com/submit?url=${pageURL}` },
                { icon: FaFacebook, label: "Facebook", action: `https://www.facebook.com/sharer.php?u=${pageURL}&t=${pageTitle}` },
                { icon: FaInstagram, label: "Instagram", action: `https://www.instagram.com/share?url=${pageURL}/${pageTitle}` },
                { icon: FaPinterest, label: "Pinterest", action: `https://www.pinterest.com/pin/create/link/?url=${pageURL}&description=${pageTitle}` },
              ].map(({ icon: Icon, label, action }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <a href={action} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <Icon className="w-5 h-5" />
                        <span className="sr-only">{label}</span>
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
