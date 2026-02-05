'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateContactContent } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type ContactContent = {
  hero: {
    title: string;
    description: string;
  };
  info: {
    title: string;
    description: string;
    email: string;
    phone: string;
    address: string;
  };
  form: {
    title: string;
    description: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    buttonText: string;
  };
};

export default function ContactContentManager({ initialContent }: { initialContent: ContactContent }) {
  const [state, formAction, isPending] = useActionState(updateContactContent, {
    message: '',
    data: initialContent,
  });
  const { toast } = useToast();
  const [content, setContent] = useState<ContactContent>(initialContent);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.message.includes('Failed') ? 'Error!' : 'Saved',
        description: state.message,
        variant: state.message.includes('Failed') ? 'destructive' : 'default',
      });
    }
    if (state?.data) {
      setContent(state.data);
    }
  }, [state, toast]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Contact Page Content</CardTitle>
        <CardDescription>Update the content shown on `/contact`.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hero</h3>
            <div className="space-y-2">
              <Label htmlFor="hero-title">Title</Label>
              <Input
                id="hero-title"
                name="hero-title"
                value={content.hero.title}
                onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-description">Description</Label>
              <Textarea
                id="hero-description"
                name="hero-description"
                value={content.hero.description}
                onChange={(e) => setContent({ ...content, hero: { ...content.hero, description: e.target.value } })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-2">
              <Label htmlFor="info-title">Title</Label>
              <Input
                id="info-title"
                name="info-title"
                value={content.info.title}
                onChange={(e) => setContent({ ...content, info: { ...content.info, title: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="info-description">Description</Label>
              <Textarea
                id="info-description"
                name="info-description"
                value={content.info.description}
                onChange={(e) => setContent({ ...content, info: { ...content.info, description: e.target.value } })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="info-email">Email</Label>
                <Input
                  id="info-email"
                  name="info-email"
                  value={content.info.email}
                  onChange={(e) => setContent({ ...content, info: { ...content.info, email: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="info-phone">Phone</Label>
                <Input
                  id="info-phone"
                  name="info-phone"
                  value={content.info.phone}
                  onChange={(e) => setContent({ ...content, info: { ...content.info, phone: e.target.value } })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="info-address">Address</Label>
              <Textarea
                id="info-address"
                name="info-address"
                value={content.info.address}
                onChange={(e) => setContent({ ...content, info: { ...content.info, address: e.target.value } })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Form</h3>
            <div className="space-y-2">
              <Label htmlFor="form-title">Title</Label>
              <Input
                id="form-title"
                name="form-title"
                value={content.form.title}
                onChange={(e) => setContent({ ...content, form: { ...content.form, title: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description">Description</Label>
              <Textarea
                id="form-description"
                name="form-description"
                value={content.form.description}
                onChange={(e) => setContent({ ...content, form: { ...content.form, description: e.target.value } })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="form-name-placeholder">Name Placeholder</Label>
                <Input
                  id="form-name-placeholder"
                  name="form-name-placeholder"
                  value={content.form.namePlaceholder}
                  onChange={(e) => setContent({ ...content, form: { ...content.form, namePlaceholder: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-email-placeholder">Email Placeholder</Label>
                <Input
                  id="form-email-placeholder"
                  name="form-email-placeholder"
                  value={content.form.emailPlaceholder}
                  onChange={(e) => setContent({ ...content, form: { ...content.form, emailPlaceholder: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-subject-placeholder">Subject Placeholder</Label>
                <Input
                  id="form-subject-placeholder"
                  name="form-subject-placeholder"
                  value={content.form.subjectPlaceholder}
                  onChange={(e) => setContent({ ...content, form: { ...content.form, subjectPlaceholder: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-message-placeholder">Message Placeholder</Label>
                <Input
                  id="form-message-placeholder"
                  name="form-message-placeholder"
                  value={content.form.messagePlaceholder}
                  onChange={(e) => setContent({ ...content, form: { ...content.form, messagePlaceholder: e.target.value } })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-button-text">Button Text</Label>
              <Input
                id="form-button-text"
                name="form-button-text"
                value={content.form.buttonText}
                onChange={(e) => setContent({ ...content, form: { ...content.form, buttonText: e.target.value } })}
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Contact Content'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
