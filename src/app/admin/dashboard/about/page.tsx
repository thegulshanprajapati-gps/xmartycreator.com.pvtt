
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useActionState, useEffect, useState } from 'react';
import { updateAboutContent } from '../actions';
import { useToast } from '@/hooks/use-toast';

type AboutContent = {
  hero: {
    title: string;
    description: string;
    imageId: string;
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  values: {
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  founder: {
    title: string;
    description: string;
    name: string;
    role: string;
    bio: string;
    socials: {
      linkedin: string;
      twitter: string;
      instagram: string;
      youtube: string;
    };
  };
};

export default function AdminAboutPage() {
    const initialContent: AboutContent = {
      hero: { title: '', description: '', imageId: '' },
      story: { title: '', paragraphs: [] },
      values: { title: '', description: '', items: [] },
      founder: { title: '', description: '', name: '', role: '', bio: '', socials: { linkedin: '', twitter: '', instagram: '', youtube: '' } }
    };
    const [state, formAction, isPending] = useActionState(updateAboutContent, { message: '', data: initialContent });
    const { toast } = useToast();
    const [aboutContent, setAboutContent] = useState(initialContent);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchContent = async () => {
        try {
          const res = await fetch('/api/pages/about');
          if (res.ok) {
            const data = await res.json();
            setAboutContent(data);
          }
        } catch (error) {
          console.error('Error fetching about content:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchContent();
    }, []);

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.message.includes('Failed') ? 'Error!' : 'Success!',
                description: state.message,
                variant: state.message.includes('Failed') ? 'destructive' : 'default',
            });
        }
        if(state?.data) {
            setAboutContent(state.data);
        }
    }, [state, toast]);

  return (
    <form action={formAction}>
        <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-lg font-semibold md:text-2xl">About Page Management</h1>
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
        </div>
        <Tabs defaultValue="hero" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="story">Our Story</TabsTrigger>
                <TabsTrigger value="values">Core Values</TabsTrigger>
                <TabsTrigger value="founder">Founder</TabsTrigger>
            </TabsList>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Edit About Page Content</CardTitle>
                    <CardDescription>Modify the content for the About Us page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <TabsContent value="hero" className="mt-0">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="hero-title">Title</Label>
                                <Input id="hero-title" name="hero-title" defaultValue={aboutContent.hero.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hero-description">Description</Label>
                                <Textarea id="hero-description" name="hero-description" defaultValue={aboutContent.hero.description} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hero-imageId">Hero Image ID</Label>
                                <Input id="hero-imageId" name="hero-imageId" defaultValue={aboutContent.hero.imageId} />
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="story" className="mt-0">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="story-title">Story Title</Label>
                                <Input id="story-title" name="story-title" defaultValue={aboutContent.story.title} />
                            </div>
                            {aboutContent.story.paragraphs.map((p, index) => (
                                <div className="space-y-2" key={index}>
                                    <Label htmlFor={`story-paragraph-${index}`}>Paragraph {index + 1}</Label>
                                    <Textarea id={`story-paragraph-${index}`} name={`story-paragraph-${index}`} defaultValue={p} />
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="values" className="mt-0">
                         <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="values-title">Values Title</Label>
                                <Input id="values-title" name="values-title" defaultValue={aboutContent.values.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="values-description">Values Description</Label>
                                <Textarea id="values-description" name="values-description" defaultValue={aboutContent.values.description} />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-4">
                             {aboutContent.values.items.map((item, index) => (
                                <Card key={index} className="p-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`value-title-${index}`}>Value {index + 1} Title</Label>
                                        <Input id={`value-title-${index}`} name={`value-title-${index}`} defaultValue={item.title} />
                                    </div>
                                     <div className="space-y-2 mt-2">
                                        <Label htmlFor={`value-description-${index}`}>Value {index + 1} Description</Label>
                                        <Textarea id={`value-description-${index}`} name={`value-description-${index}`} defaultValue={item.description} />
                                    </div>
                                </Card>
                            ))}
                            </div>
                        </div>
                    </TabsContent>

                     <TabsContent value="founder" className="mt-0">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="founder-title">Section Title</Label>
                                <Input id="founder-title" name="founder-title" defaultValue={aboutContent.founder.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="founder-description">Section Description</Label>
                                <Textarea id="founder-description" name="founder-description" defaultValue={aboutContent.founder.description} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="founder-name">Name</Label>
                                <Input id="founder-name" name="founder-name" defaultValue={aboutContent.founder.name} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="founder-role">Role</Label>
                                <Input id="founder-role" name="founder-role" defaultValue={aboutContent.founder.role} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="founder-bio">Bio</Label>
                                <Textarea id="founder-bio" name="founder-bio" defaultValue={aboutContent.founder.bio} />
                            </div>
                             <div className="space-y-2">
                                <Label>Social Links</Label>
                                <Input name="founder-socials-linkedin" placeholder="LinkedIn URL" defaultValue={aboutContent.founder.socials.linkedin} />
                                <Input name="founder-socials-twitter" placeholder="Twitter URL" defaultValue={aboutContent.founder.socials.twitter} />
                                <Input name="founder-socials-instagram" placeholder="Instagram URL" defaultValue={aboutContent.founder.socials.instagram} />
                                <Input name="founder-socials-youtube" placeholder="YouTube URL" defaultValue={aboutContent.founder.socials.youtube} />
                            </div>
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    </form>
  );
}
