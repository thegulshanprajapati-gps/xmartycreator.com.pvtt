'use client';

import {
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

export default function SocialShareButtons({
  url,
  title,
  className = '',
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareButtons = [
    {
      icon: Twitter,
      label: 'Share on Twitter',
      href: shareLinks.twitter,
      color: '#1DA1F2',
    },
    {
      icon: Linkedin,
      label: 'Share on LinkedIn',
      href: shareLinks.linkedin,
      color: '#0A66C2',
    },
    {
      icon: Facebook,
      label: 'Share on Facebook',
      href: shareLinks.facebook,
      color: '#1877F2',
    },
  ];

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {shareButtons.map(({ icon: Icon, label, href, color }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => {
                  window.open(href, '_blank', 'width=600,height=400');
                }}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? 'Copied!' : 'Copy link'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
