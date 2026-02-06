
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActionState, useEffect, useState } from 'react';
import { updateAboutContent } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

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
    highlights: string[];
    imageId: string;
    socials: {
      linkedin: string;
      twitter: string;
      instagram: string;
      youtube: string;
    };
  };
};

export default function AdminAboutPage() {
    const normalizeAbout = (data?: Partial<AboutContent>): AboutContent => ({
      hero: {
        title: data?.hero?.title ?? '',
        description: data?.hero?.description ?? '',
        imageId: data?.hero?.imageId ?? '',
      },
      story: {
        title: data?.story?.title ?? '',
        paragraphs: Array.isArray(data?.story?.paragraphs) ? data.story!.paragraphs : [],
      },
      values: {
        title: data?.values?.title ?? '',
        description: data?.values?.description ?? '',
        items: Array.isArray(data?.values?.items)
          ? data.values!.items.map((item) => ({
              title: item?.title ?? '',
              description: item?.description ?? '',
            }))
          : [],
      },
      founder: {
        title: data?.founder?.title ?? '',
        description: data?.founder?.description ?? '',
        name: data?.founder?.name ?? '',
        role: data?.founder?.role ?? '',
        bio: data?.founder?.bio ?? '',
        highlights: Array.isArray(data?.founder?.highlights)
          ? data?.founder?.highlights.filter((item) => typeof item === 'string')
          : [],
        imageId: data?.founder?.imageId ?? '',
        socials: {
          linkedin: data?.founder?.socials?.linkedin ?? '',
          twitter: data?.founder?.socials?.twitter ?? '',
          instagram: data?.founder?.socials?.instagram ?? '',
          youtube: data?.founder?.socials?.youtube ?? '',
        },
      },
    });

    const resolveAboutPayload = (raw: any) => {
      if (!raw || typeof raw !== 'object') return {};
      const hasTopLevel = Boolean(raw.hero || raw.story || raw.values || raw.founder);
      const content = raw?.content && typeof raw.content === 'object' ? raw.content : null;
      const hasContent = Boolean(content && (content.hero || content.story || content.values || content.founder));
      if (hasTopLevel) return raw;
      if (hasContent) return content;
      return raw;
    };

    const initialContent: AboutContent = normalizeAbout();
    
    const [state, formAction, isPending] = useActionState(updateAboutContent, { message: '', data: initialContent });
    const { toast } = useToast();
    const [aboutContent, setAboutContent] = useState<AboutContent>(initialContent);
    const [isLoading, setIsLoading] = useState(true);
    const [galleryImages, setGalleryImages] = useState<any[]>([]);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const handleHeroImageSelect = (id: string) => {
      setAboutContent((prev) => ({ ...prev, hero: { ...prev.hero, imageId: id } }));
    };

    useEffect(() => {
      const fetchContent = async () => {
        try {
          console.log('📖 [Admin About] Fetching content from API...');
          const [aboutRes, galleryRes] = await Promise.all([
            fetch('/api/pages/about', { cache: 'no-store' }),
            fetch('/api/pages/gallery', { cache: 'no-store' }),
          ]);

          if (aboutRes.ok) {
            const data = await aboutRes.json();
            const normalized = normalizeAbout(resolveAboutPayload(data));
            console.log('✅ [Admin About] Content fetched and normalized:', normalized);
            setAboutContent(normalized);
          } else {
            console.warn('⚠️ [Admin About] About API returned non-OK status', aboutRes.status);
          }
          
          if (galleryRes.ok) {
            const galleryData = await galleryRes.json();
            const images = galleryData?.placeholderImages || [];
            console.log('✅ [Admin About] Gallery images fetched:', images.length);
            setGalleryImages(images);
          } else {
            console.warn('⚠️ [Admin About] Gallery API returned non-OK status', galleryRes.status);
          }
        } catch (error) {
          console.error('❌ [Admin About] Error fetching content:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchContent();
    }, []);

    const selectedHeroImage = galleryImages.find((img) => img.id === aboutContent.hero.imageId);

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.message.includes('Failed') ? 'Error!' : 'Success!',
                description: state.message,
                variant: state.message.includes('Failed') ? 'destructive' : 'default',
            });
        }
        if(state?.data) {
            console.log('✅ [Admin About] State updated with new data');
            setAboutContent(normalizeAbout(state.data));
        }
    }, [state, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, path: string) => {
      const { value } = e.target;
      setAboutContent(prev => {
        const newContent = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current: any = newContent;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newContent;
      });
    };

    const handleArrayChange = (section: string, subSection: string, index: number, field: string, value: string) => {
      setAboutContent(prev => {
        const newContent = JSON.parse(JSON.stringify(prev));
        if (subSection === 'paragraphs' || subSection === 'highlights') {
          newContent[section][subSection][index] = value;
        } else {
          (newContent as any)[section][subSection][index][field] = value;
        }
        return newContent;
      });
    };

    const handleAddParagraph = () => {
      setAboutContent(prev => ({
        ...prev,
        story: {
          ...prev.story,
          paragraphs: [...prev.story.paragraphs, '']
        }
      }));
    };

    const handleRemoveParagraph = (index: number) => {
      setAboutContent(prev => ({
        ...prev,
        story: {
          ...prev.story,
          paragraphs: prev.story.paragraphs.filter((_, i) => i !== index)
        }
      }));
    };

    const handleAddValue = () => {
      setAboutContent(prev => ({
        ...prev,
        values: {
          ...prev.values,
          items: [...prev.values.items, { title: '', description: '' }]
        }
      }));
    };

    const handleRemoveValue = (index: number) => {
      setAboutContent(prev => ({
        ...prev,
        values: {
          ...prev.values,
          items: prev.values.items.filter((_, i) => i !== index)
        }
      }));
    };

    const handleAddHighlight = () => {
      setAboutContent(prev => ({
        ...prev,
        founder: {
          ...prev.founder,
          highlights: [...prev.founder.highlights, '']
        }
      }));
    };

    const handleRemoveHighlight = (index: number) => {
      setAboutContent(prev => ({
        ...prev,
        founder: {
          ...prev.founder,
          highlights: prev.founder.highlights.filter((_, i) => i !== index)
        }
      }));
    };

    const handleSubmit = async (formData: FormData) => {
      console.log('💾 [Admin About] Submitting form with state:', aboutContent);
      
      // Manually append state values to formData since we're using controlled inputs
      formData.set('hero-title', aboutContent.hero.title);
      formData.set('hero-description', aboutContent.hero.description);
      formData.set('hero-imageId', aboutContent.hero.imageId);
      
      formData.set('story-title', aboutContent.story.title);
      aboutContent.story.paragraphs.forEach((p, i) => {
        formData.set(`story-paragraph-${i}`, p);
      });
      
      formData.set('values-title', aboutContent.values.title);
      formData.set('values-description', aboutContent.values.description);
      aboutContent.values.items.forEach((item, i) => {
        formData.set(`value-title-${i}`, item.title);
        formData.set(`value-description-${i}`, item.description);
      });
      
      formData.set('founder-title', aboutContent.founder.title);
      formData.set('founder-description', aboutContent.founder.description);
      formData.set('founder-name', aboutContent.founder.name);
      formData.set('founder-role', aboutContent.founder.role);
      formData.set('founder-bio', aboutContent.founder.bio);
      aboutContent.founder.highlights.forEach((highlight, index) => {
        formData.set(`founder-highlight-${index}`, highlight);
      });
      formData.set('founder-imageId', aboutContent.founder.imageId);
      formData.set('founder-socials-linkedin', aboutContent.founder.socials.linkedin);
      formData.set('founder-socials-twitter', aboutContent.founder.socials.twitter);
      formData.set('founder-socials-instagram', aboutContent.founder.socials.instagram);
      formData.set('founder-socials-youtube', aboutContent.founder.socials.youtube);
      
      return formAction(formData);
    };

    if (isLoading) {
      return <div className="flex items-center justify-center p-10">Loading...</div>;
    }

  return (
    <form action={handleSubmit}>
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
                                <Input 
                                  id="hero-title" 
                                  value={aboutContent.hero.title}
                                  onChange={(e) => handleChange(e, 'hero.title')}
                                  placeholder="About Us"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hero-description">Description</Label>
                                <Textarea 
                                  id="hero-description" 
                                  value={aboutContent.hero.description}
                                  onChange={(e) => handleChange(e, 'hero.description')}
                                  placeholder="Discover our mission and what drives us"
                        />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero-imageId">Hero Image</Label>
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowImagePicker(true)}>
                          {aboutContent.hero.imageId ? 'Change Image' : 'Choose Image'}
                        </Button>
                        {aboutContent.hero.imageId && (
                          <span className="text-sm text-muted-foreground">ID: {aboutContent.hero.imageId}</span>
                        )}
                      </div>
                      {selectedHeroImage && (
                        <div className="mt-2 flex items-center gap-3 p-3 border rounded-lg bg-muted/40">
                          <img src={selectedHeroImage.imageUrl} alt={selectedHeroImage.title || selectedHeroImage.id} className="h-16 w-16 rounded object-cover" />
                          <div className="text-sm">
                            <div className="font-semibold">{selectedHeroImage.title || selectedHeroImage.id}</div>
                            <div className="text-muted-foreground break-all">{selectedHeroImage.imageUrl}</div>
                          </div>
                        </div>
                      )}
                      {galleryImages.length === 0 && (
                        <p className="text-sm text-amber-600">No images available. Please upload images to the gallery first.</p>
                      )}
                    </div>
                </div>
            </TabsContent>
                    
                    <TabsContent value="story" className="mt-0">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="story-title">Story Title</Label>
                                <Input 
                                  id="story-title" 
                                  value={aboutContent.story.title}
                                  onChange={(e) => handleChange(e, 'story.title')}
                                  placeholder="Our Story"
                                />
                            </div>
                            {aboutContent.story.paragraphs.map((p, index) => (
                                <div className="space-y-2" key={index}>
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`story-paragraph-${index}`}>Paragraph {index + 1}</Label>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Paragraph</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to remove this paragraph?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveParagraph(index)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                    <Textarea 
                                      id={`story-paragraph-${index}`} 
                                      value={p}
                                      onChange={(e) => handleArrayChange('story', 'paragraphs', index, '', e.target.value)}
                                    />
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={handleAddParagraph} className="w-full">
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add Paragraph
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="values" className="mt-0">
                         <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="values-title">Values Title</Label>
                                <Input 
                                  id="values-title" 
                                  value={aboutContent.values.title}
                                  onChange={(e) => handleChange(e, 'values.title')}
                                  placeholder="Core Values"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="values-description">Values Description</Label>
                                <Textarea 
                                  id="values-description" 
                                  value={aboutContent.values.description}
                                  onChange={(e) => handleChange(e, 'values.description')}
                                />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-4">
                             {aboutContent.values.items.map((item, index) => (
                                <Card key={index} className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-semibold">Value {index + 1}</h4>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Value</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to remove this value?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveValue(index)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`value-title-${index}`}>Title</Label>
                                        <Input 
                                          id={`value-title-${index}`} 
                                          value={item.title}
                                          onChange={(e) => handleArrayChange('values', 'items', index, 'title', e.target.value)}
                                        />
                                    </div>
                                     <div className="space-y-2 mt-2">
                                        <Label htmlFor={`value-description-${index}`}>Description</Label>
                                        <Textarea 
                                          id={`value-description-${index}`} 
                                          value={item.description}
                                          onChange={(e) => handleArrayChange('values', 'items', index, 'description', e.target.value)}
                                        />
                                    </div>
                                </Card>
                            ))}
                            </div>
                            <Button type="button" variant="outline" onClick={handleAddValue} className="w-full">
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add Value
                            </Button>
                        </div>
                    </TabsContent>

                     <TabsContent value="founder" className="mt-0">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="founder-title">Section Title</Label>
                                <Input 
                                  id="founder-title" 
                                  value={aboutContent.founder.title}
                                  onChange={(e) => handleChange(e, 'founder.title')}
                                  placeholder="Meet Our Founder"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="founder-description">Short Description</Label>
                                <Textarea 
                                  id="founder-description" 
                                  value={aboutContent.founder.description}
                                  onChange={(e) => handleChange(e, 'founder.description')}
                                  maxLength={180}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Shown under the heading. Keep it short (max 180 characters). {aboutContent.founder.description.length}/180
                                </p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="founder-name">Name</Label>
                                <Input 
                                  id="founder-name" 
                                  value={aboutContent.founder.name}
                                  onChange={(e) => handleChange(e, 'founder.name')}
                                  placeholder="Founder Name"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="founder-role">Role</Label>
                                <Input 
                                  id="founder-role" 
                                  value={aboutContent.founder.role}
                                  onChange={(e) => handleChange(e, 'founder.role')}
                                  placeholder="CEO & Founder"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="founder-imageId">Founder Image</Label>
                                <Select
                                  value={aboutContent.founder.imageId || ''}
                                  onValueChange={(value) => handleChange({ target: { value } } as any, 'founder.imageId')}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an image from gallery" />
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
                                {aboutContent.founder.imageId && (
                                  <p className="text-xs text-muted-foreground">Selected: {aboutContent.founder.imageId}</p>
                                )}
                                {galleryImages.length === 0 && (
                                  <p className="text-sm text-amber-600">No images available. Please upload images to the gallery first.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="founder-bio">Bio</Label>
                                <Textarea 
                                  id="founder-bio" 
                                  value={aboutContent.founder.bio}
                                  onChange={(e) => handleChange(e, 'founder.bio')}
                                />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Highlights</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddHighlight}>
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Add Highlight
                                </Button>
                              </div>
                              {aboutContent.founder.highlights.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Add 2-4 short points that will show as highlights on the About page.
                                </p>
                              )}
                              <div className="space-y-2">
                                {aboutContent.founder.highlights.map((item, index) => (
                                  <div className="flex items-start gap-2" key={index}>
                                    <Input
                                      value={item}
                                      onChange={(e) => handleArrayChange('founder', 'highlights', index, '', e.target.value)}
                                      placeholder="Example: Exam updates, Career guidance, Student support"
                                      maxLength={80}
                                    />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Highlight</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to remove this highlight?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleRemoveHighlight(index)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Social Links</Label>
                                <div className="space-y-2">
                                  <Input 
                                    placeholder="LinkedIn URL" 
                                    value={aboutContent.founder.socials.linkedin}
                                    onChange={(e) => handleChange(e, 'founder.socials.linkedin')}
                                  />
                                  <Input 
                                    placeholder="Twitter URL" 
                                    value={aboutContent.founder.socials.twitter}
                                    onChange={(e) => handleChange(e, 'founder.socials.twitter')}
                                  />
                                  <Input 
                                    placeholder="Instagram URL" 
                                    value={aboutContent.founder.socials.instagram}
                                    onChange={(e) => handleChange(e, 'founder.socials.instagram')}
                                  />
                                  <Input 
                                    placeholder="YouTube URL" 
                                    value={aboutContent.founder.socials.youtube}
                                    onChange={(e) => handleChange(e, 'founder.socials.youtube')}
                                  />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    <ImagePickerModal
      open={showImagePicker}
      onOpenChange={setShowImagePicker}
      images={galleryImages}
      onSelect={handleHeroImageSelect}
    />
    </form>
  );
}

// Image Picker Dialog (renders at end to keep main JSX tidy)
function ImagePickerModal({
  open,
  onOpenChange,
  images,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: Array<{ id: string; title?: string; imageUrl: string; description?: string }>;
  onSelect: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select an image</DialogTitle>
          <DialogDescription>Choose from your gallery to set as the hero image.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">
              No images available. Go to Image Gallery to upload first.
            </div>
          )}
          {images.map((img) => (
            <div key={img.id} className="border rounded-lg overflow-hidden bg-card shadow-sm flex flex-col">
              <div className="relative h-40 bg-muted">
                <img src={img.imageUrl} alt={img.title || img.id} className="h-full w-full object-cover" />
              </div>
              <div className="p-3 space-y-1 text-sm">
                <div className="font-semibold truncate">{img.title || img.id}</div>
                <div className="text-muted-foreground text-xs truncate">{img.id}</div>
                {img.description && <div className="text-muted-foreground text-xs line-clamp-2">{img.description}</div>}
              </div>
              <div className="p-3 pt-0">
                <Button className="w-full" onClick={() => { onSelect(img.id); onOpenChange(false); }}>
                  Use this image
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
