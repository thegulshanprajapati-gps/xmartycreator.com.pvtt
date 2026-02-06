
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useActionState, useEffect, useState } from 'react';
import { updateNotificationContent } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type NotificationContent = {
  enabled: boolean;
  message: string;
  linkText: string;
  linkHref: string;
  bannerImageId?: string;
};

export default function AdminNotificationPage() {
  const initialContent: NotificationContent = { enabled: false, message: '', linkText: '', linkHref: '', bannerImageId: '' };
  const [state, formAction, isPending] = useActionState(updateNotificationContent, { message: '', data: initialContent });
  const { toast } = useToast();
  const [content, setContent] = useState<NotificationContent>(initialContent);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/notification');
        if (res.ok) {
          const data = await res.json();
          setContent(data);
          setIsEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Error fetching notification content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/pages/gallery');
        if (res.ok) {
          const data = await res.json();
          setGalleryImages(data?.placeholderImages || []);
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
      }
    };

    fetchGallery();
  }, []);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.message.includes('Failed') ? 'Error!' : 'Success!',
        description: state.message,
        variant: state.message.includes('Failed') ? 'destructive' : 'default',
      });
    }
    if (state?.data) {
        setContent(state.data as NotificationContent);
        setIsEnabled(state.data.enabled);
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
        <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-lg font-semibold md:text-2xl">Notification Banner</h1>
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
        </div>
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Edit Notification Banner</CardTitle>
                <CardDescription>Control the content and visibility of the site-wide notification banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="flex items-center space-x-2">
                    <Switch id="enabled" name="enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
                    <Label htmlFor="enabled">Enable Notification Banner</Label>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                        id="message" 
                        name="message" 
                        value={content.message}
                        onChange={(e) => setContent({...content, message: e.target.value})}
                        placeholder="e.g. <span class='font-bold'>New!</span> {link}"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use HTML for styling and {'{link}'} as a placeholder where the link should appear.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="linkText">Link Text</Label>
                    <Input 
                        id="linkText" 
                        name="linkText" 
                        value={content.linkText}
                        onChange={(e) => setContent({...content, linkText: e.target.value})}
                        placeholder="e.g. Check out our new course!"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="linkHref">Link URL</Label>
                    <Input 
                        id="linkHref" 
                        name="linkHref" 
                        value={content.linkHref}
                        onChange={(e) => setContent({...content, linkHref: e.target.value})}
                        placeholder="e.g. /courses"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bannerImageId">Banner Image</Label>
                    <Select value={content.bannerImageId || ''} onValueChange={(value) => setContent({...content, bannerImageId: value})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select banner image (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {galleryImages
                              .filter(img => img.id && typeof img.id === 'string' && img.id.trim())
                              .map((image) => (
                                <SelectItem key={image.id} value={image.id}>
                                    {image.title || image.filename || image.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    </form>
  );
}
