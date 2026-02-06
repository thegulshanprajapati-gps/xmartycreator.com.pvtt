'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateSiteSettings } from '../actions';
import { useToast } from '@/hooks/use-toast';

type SiteSettings = {
  cursorStyle: string;
};

const CURSOR_OPTIONS = [
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'neon', label: 'Neon Ring' },
  { value: 'classic', label: 'System Default' },
  { value: 'magic', label: 'Magic (Animated)' },
  { value: 'pulse', label: 'Pulse Glow (Animated)' },
  { value: 'orbit', label: 'Orbit (Animated)' },
  { value: 'glow', label: 'Soft Glow (Animated)' },
  { value: 'ripple', label: 'Ripple Click (Animated)' },
];

export default function AdminAppearancePage() {
  const initialSettings: SiteSettings = { cursorStyle: 'sparkle' };
  const [state, formAction, isPending] = useActionState(updateSiteSettings, { message: '', data: initialSettings });
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/site-settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSettings({ cursorStyle: data?.cursorStyle || 'sparkle' });
        }
      } catch (error) {
        console.error('❌ [Admin Appearance] Failed to fetch site settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
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
      const cursorStyle = state.data.cursorStyle || 'sparkle';
      setSettings({ cursorStyle });
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.cursor = cursorStyle;
        if (document.body) {
          document.body.dataset.cursor = cursorStyle;
        }
        try {
          localStorage.setItem('xmarty:cursorStyle', cursorStyle);
        } catch {}
        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { cursorStyle } }));
      }
    }
  }, [state, toast]);

  const handleSubmit = async (formData: FormData) => {
    formData.set('cursor-style', settings.cursorStyle);
    return formAction(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-10">Loading...</div>;
  }

  return (
    <form action={handleSubmit}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Appearance Settings</h1>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mouse Cursor</CardTitle>
          <CardDescription>
            Choose a cursor style for the entire website (including admin panel).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cursor Style</Label>
            <Select
              value={settings.cursorStyle}
              onValueChange={(value) => {
                setSettings((prev) => ({ ...prev, cursorStyle: value }));
                if (typeof document !== 'undefined') {
                  document.documentElement.dataset.cursor = value;
                  if (document.body) {
                    document.body.dataset.cursor = value;
                  }
                  try {
                    localStorage.setItem('xmarty:cursorStyle', value);
                  } catch {}
                  window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { cursorStyle: value } }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cursor style" />
              </SelectTrigger>
              <SelectContent>
                {CURSOR_OPTIONS.map((option) => {
                  const isCurrent = option.value === settings.cursorStyle;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.label}</span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Current
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Tip: Magic cursor is disabled on mobile and on devices with reduced motion settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
