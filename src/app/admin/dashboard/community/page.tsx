
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';

type CommunityContent = {
  hero: { title: string; description: string };
  youtube: { channelId?: string; videoId: string };
  whatsapp: { title: string; description: string; link: string; buttonText: string };
  app: { title: string; description: string; link: string; buttonText: string };
  telegram: { title: string; description: string; link: string; buttonText: string };
};

const emptyContent: CommunityContent = {
  hero: { title: '', description: '' },
  youtube: { channelId: '', videoId: '' },
  whatsapp: { title: '', description: '', link: '', buttonText: 'Join' },
  app: { title: '', description: '', link: '', buttonText: 'Download' },
  telegram: { title: '', description: '', link: '', buttonText: 'Join' },
};

export default function AdminCommunityPage() {
  const [data, setData] = useState<CommunityContent>(emptyContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/pages/community');
        if (res.ok) {
          const json = await res.json();
          setData((prev) => ({
            ...prev,
            ...json,
            hero: { ...prev.hero, ...(json?.hero || {}) },
            youtube: { ...prev.youtube, ...(json?.youtube || {}) },
            whatsapp: { ...prev.whatsapp, ...(json?.whatsapp || {}) },
            app: { ...prev.app, ...(json?.app || {}) },
            telegram: { ...prev.telegram, ...(json?.telegram || {}) },
          }));
        }
      } catch (err) {
        console.error('Failed to fetch community page', err);
        toast({ title: 'Fetch failed', description: 'Could not load community content.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (path: string, value: string) => {
    setData((prev) => {
      const copy: any = structuredClone(prev);
      const keys = path.split('.');
      let curr = copy;
      for (let i = 0; i < keys.length - 1; i++) curr = curr[keys[i]];
      curr[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pages/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Saved', description: 'Community page updated successfully.' });
    } catch (err) {
      console.error('Save error', err);
      toast({ title: 'Save failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Community Page</h1>
          <p className="text-sm text-muted-foreground">Edit the content shown on /community.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading content...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Hero</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={data.hero.title} onChange={(e) => handleChange('hero.title', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea rows={3} value={data.hero.description} onChange={(e) => handleChange('hero.description', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>YouTube (Auto Latest)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel ID</label>
                <Input
                  placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                  value={data.youtube.channelId || ''}
                  onChange={(e) => handleChange('youtube.channelId', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Sirf channel ID dalo. Latest uploaded video community page par auto show ho jayegi.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fallback Video ID (optional)</label>
                <Input
                  placeholder="e.g. dQw4w9WgXcQ"
                  value={data.youtube.videoId}
                  onChange={(e) => handleChange('youtube.videoId', e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Agar latest fetch fail ho, to yeh fallback video show hoga.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Title" value={data.whatsapp.title} onChange={(e) => handleChange('whatsapp.title', e.target.value)} />
              <Textarea
                rows={2}
                placeholder="Description"
                value={data.whatsapp.description}
                onChange={(e) => handleChange('whatsapp.description', e.target.value)}
              />
              <Input placeholder="Invite link" value={data.whatsapp.link} onChange={(e) => handleChange('whatsapp.link', e.target.value)} />
              <Input placeholder="Button text" value={data.whatsapp.buttonText} onChange={(e) => handleChange('whatsapp.buttonText', e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Download</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Title" value={data.app.title} onChange={(e) => handleChange('app.title', e.target.value)} />
              <Textarea
                rows={2}
                placeholder="Description"
                value={data.app.description}
                onChange={(e) => handleChange('app.description', e.target.value)}
              />
              <Input placeholder="Link (Play Store / direct)" value={data.app.link} onChange={(e) => handleChange('app.link', e.target.value)} />
              <Input placeholder="Button text" value={data.app.buttonText} onChange={(e) => handleChange('app.buttonText', e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Telegram</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Title" value={data.telegram.title} onChange={(e) => handleChange('telegram.title', e.target.value)} />
              <Textarea
                rows={2}
                placeholder="Description"
                value={data.telegram.description}
                onChange={(e) => handleChange('telegram.description', e.target.value)}
              />
              <Input placeholder="Link" value={data.telegram.link} onChange={(e) => handleChange('telegram.link', e.target.value)} />
              <Input placeholder="Button text" value={data.telegram.buttonText} onChange={(e) => handleChange('telegram.buttonText', e.target.value)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
