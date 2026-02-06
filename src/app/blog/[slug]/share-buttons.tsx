'use client';

import { Button } from '@/components/ui/button';
import { Twitter, Linkedin, Facebook, Link as LinkIcon } from 'lucide-react';

interface ShareButtonsProps {
  slug: string;
  title: string;
  baseUrl: string;
  shareUrls: {
    twitter: string;
    linkedin: string;
    facebook: string;
  };
}

export function ShareButtons({ slug, title, baseUrl, shareUrls }: ShareButtonsProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${baseUrl}/blog/${slug}`);
      // Optionally show a toast notification
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          asChild
          title="Share on Twitter"
        >
          <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer">
            <Twitter className="h-4 w-4" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          asChild
          title="Share on LinkedIn"
        >
          <a href={shareUrls.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-4 w-4" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          asChild
          title="Share on Facebook"
        >
          <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer">
            <Facebook className="h-4 w-4" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyLink}
          title="Copy link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
