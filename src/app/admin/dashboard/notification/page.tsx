
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useActionState, useEffect, useState } from 'react';
import { updateNotificationContent } from '../actions';
import { useToast } from '@/hooks/use-toast';

type NotificationContent = {
  enabled: boolean;
  message: string;
  linkText: string;
  linkHref: string;
  bannerImageId?: string;
};

const normalizeNotificationContent = (value: any): NotificationContent => ({
  enabled: value?.enabled === true || value?.enabled === 'true' || value?.enabled === 'on',
  message: typeof value?.message === 'string' ? value.message : '',
  linkText: typeof value?.linkText === 'string' ? value.linkText : '',
  linkHref: typeof value?.linkHref === 'string' ? value.linkHref : '',
  bannerImageId: typeof value?.bannerImageId === 'string' ? value.bannerImageId : '',
});

export default function AdminNotificationPage() {
  const initialContent: NotificationContent = {
    enabled: false,
    message: '',
    linkText: '',
    linkHref: '',
    bannerImageId: '',
  };
  const [state, formAction, isPending] = useActionState(updateNotificationContent, { message: '', data: initialContent });
  const { toast } = useToast();
  const [content, setContent] = useState<NotificationContent>(initialContent);
  const [isEnabled, setIsEnabled] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/notification');
        if (res.ok) {
          const data = await res.json();
          const normalized = normalizeNotificationContent(data);
          setContent(normalized);
          setIsEnabled(normalized.enabled);
        }
      } catch (error) {
        console.error('Error fetching notification content:', error);
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
        const normalized = normalizeNotificationContent(state.data);
        setContent(normalized);
        setIsEnabled(normalized.enabled);
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
                    <input
                      id="enabled"
                      name="enabled"
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border border-input accent-primary"
                    />
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
                    <select
                      id="bannerImageId"
                      name="bannerImageId"
                      value={content.bannerImageId || ''}
                      onChange={(e) => setContent({ ...content, bannerImageId: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">No image selected</option>
                      {galleryImages
                        .filter((img) => img?.id && typeof img.id === 'string' && img.id.trim())
                        .map((image) => (
                          <option key={image.id} value={image.id}>
                            {image.title || image.filename || image.id}
                          </option>
                        ))}
                    </select>
                </div>
            </CardContent>
        </Card>
    </form>
  );
}
