
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActionState, useEffect, useState } from 'react';
import { updateHomeContent } from './actions';
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

type Update = {
  title: string;
  description: string;
  content: string;
  date: string;
  author?: string;
  category?: string;
};

type HomeContent = {
  hero: {
    title: string;
    description: string;
    buttons: {
      primary: { text: string; link: string };
      secondary: { text: string; link: string };
    };
  };
  quickAccess: {
    title: string;
    description: string;
    items: { title: string; description: string; imageId: string; link: string }[];
  };
  whyChooseUs: {
    title: string;
    description: string;
    features: { title: string; description: string }[];
  };
  testimonials: {
    title: string;
    description: string;
    reviews: {
      name: string;
      role: string;
      testimonial: string;
      rating: number;
      avatar: string;
    }[];
  };
};

interface AdminDashboardClientProps {
    initialHomeContent: HomeContent;
}

export default function AdminDashboardClient({ initialHomeContent }: AdminDashboardClientProps) {
  const [state, formAction, isPending] = useActionState(updateHomeContent, { message: '', data: initialHomeContent });
  const { toast } = useToast();
  const [homeContent, setHomeContent] = useState<HomeContent>(initialHomeContent);
  const [updates, setUpdates] = useState<{ title: string; description: string; updates: Update[] }>({
    title: 'Latest Updates & News',
    description: 'Stay informed with our latest announcements',
    updates: []
  });

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.message.includes('Failed') ? 'Error!' : 'Success!',
        description: state.message,
        variant: state.message.includes('Failed') ? 'destructive' : 'default',
      });
    }
    if (state?.data) {
        setHomeContent(state.data as HomeContent);
    }
  }, [state, toast]);

  // Fetch updates on mount
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        console.log('📖 [Admin] Fetching updates from database...');
        const res = await fetch('/api/pages/updates');
        if (res.ok) {
          const data = await res.json();
          console.log('✅ [Admin] Updates fetched successfully:', data);
          setUpdates(data);
        }
      } catch (error) {
        console.error('❌ [Admin] Error fetching updates:', error);
      }
    };

    fetchUpdates();
  }, []);

    const handleAddQuickAccessItem = () => {
        setHomeContent(prev => ({
            ...prev,
            quickAccess: {
                ...prev.quickAccess,
                items: [...(prev.quickAccess.items || []), { title: '', description: '', imageId: '', link: '' }]
            }
        }));
    };
    
    const handleRemoveQuickAccessItem = (indexToRemove: number) => {
        setHomeContent(prev => ({
            ...prev,
            quickAccess: {
                ...prev.quickAccess,
                items: (prev.quickAccess?.items || []).filter((_, index) => index !== indexToRemove)
            }
        }));
    };
    
    const handleAddReview = () => {
        setHomeContent(prev => ({
            ...prev,
            testimonials: {
                ...prev.testimonials,
                reviews: [...(prev.testimonials.reviews || []), { 
                    name: '', 
                    role: '', 
                    testimonial: '', 
                    rating: 5, 
                    avatar: '' 
                }]
            }
        }));
    };
    
    const handleRemoveReview = (indexToRemove: number) => {
        setHomeContent(prev => ({
            ...prev,
            testimonials: {
                ...prev.testimonials,
                reviews: (prev.testimonials?.reviews || []).filter((_, index) => index !== indexToRemove)
            }
        }));
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        setHomeContent(prev => {
            const newContent = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current: any = newContent;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}; // Handle nested properties
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newContent;
        });
    };

    const handleArrayChange = (section: string, subSection: string, index: number, field: string, value: string | number) => {
        setHomeContent(prev => {
            const newContent = JSON.parse(JSON.stringify(prev));
            (newContent as any)[section][subSection][index][field] = value;
            return newContent;
        });
    }

    const handleAddUpdate = () => {
        setUpdates(prev => ({
            ...prev,
            updates: [...(prev.updates || []), {
                title: '',
                description: '',
                content: '',
                date: new Date().toISOString().split('T')[0],
                author: '',
                category: 'News'
            }]
        }));
    };

    const handleRemoveUpdate = (indexToRemove: number) => {
        setUpdates(prev => ({
            ...prev,
            updates: (prev.updates || []).filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleUpdateChange = (index: number, field: string, value: string) => {
        setUpdates(prev => {
            const newUpdates = [...(prev.updates || [])];
            (newUpdates[index] as any)[field] = value;
            return { ...prev, updates: newUpdates };
        });
    };

  return (
    <form action={formAction}>
        {/* Hidden fields for Updates */}
        <input type="hidden" name="updates-title" value={updates.title} />
        <input type="hidden" name="updates-description" value={updates.description} />
        <input type="hidden" name="updates-count" value={updates.updates?.length || 0} />
        {updates.updates?.map((update, index) => (
            <div key={index}>
              <input type="hidden" name={`update-title-${index}`} value={update.title} />
              <input type="hidden" name={`update-description-${index}`} value={update.description} />
              <input type="hidden" name={`update-content-${index}`} value={update.content} />
              <input type="hidden" name={`update-date-${index}`} value={update.date} />
              <input type="hidden" name={`update-author-${index}`} value={update.author || ''} />
              <input type="hidden" name={`update-category-${index}`} value={update.category || 'News'} />
            </div>
        ))}
        
        <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-lg font-semibold md:text-2xl">Home Page Management</h1>
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
        </div>
        <Tabs defaultValue="hero" className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="quick-access">Quick Access</TabsTrigger>
                <TabsTrigger value="why-choose-us">Why Choose Us</TabsTrigger>
                <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>
            
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Edit Home Page Content</CardTitle>
                    <CardDescription>Modify the text and content displayed on your home page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <TabsContent value="hero" forceMount className="mt-0 data-[state=inactive]:hidden">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="hero-title">Title</Label>
                                <Input id="hero-title" name="hero-title" value={homeContent.hero.title} onChange={e => setHomeContent({...homeContent, hero: {...homeContent.hero, title: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hero-description">Description</Label>
                                <Textarea id="hero-description" name="hero-description" value={homeContent.hero.description}  onChange={e => setHomeContent({...homeContent, hero: {...homeContent.hero, description: e.target.value}})}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hero-primary-btn-text">Primary Button Text</Label>
                                    <Input id="hero-primary-btn-text" name="hero-primary-btn-text" value={homeContent.hero.buttons.primary.text} onChange={e => setHomeContent({...homeContent, hero: {...homeContent.hero, buttons: {...homeContent.hero.buttons, primary: {...homeContent.hero.buttons.primary, text: e.target.value}}}})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero-primary-btn-link">Primary Button Link</Label>
                                    <Input id="hero-primary-btn-link" name="hero-primary-btn-link" value={homeContent.hero.buttons.primary.link} onChange={e => setHomeContent({...homeContent, hero: {...homeContent.hero, buttons: {...homeContent.hero.buttons, primary: {...homeContent.hero.buttons.primary, link: e.target.value}}}})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hero-secondary-btn-text">Secondary Button Text</Label>
                                    <Input id="hero-secondary-btn-text" name="hero-secondary-btn-text" value={homeContent.hero.buttons.secondary.text} onChange={e => setHomeContent({...homeContent, hero: {...homeContent.hero, buttons: {...homeContent.hero.buttons, secondary: {...homeContent.hero.buttons.secondary, text: e.target.value}}}})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero-secondary-btn-link">Secondary Button Link</Label>
                                    <Input id="hero-secondary-btn-link" name="hero-secondary-btn-link" value={homeContent.hero.buttons.secondary.link} onChange={e => setHomeContent({...homeContent, hero: {...homeContent.hero, buttons: {...homeContent.hero.buttons, secondary: {...homeContent.hero.buttons.secondary, link: e.target.value}}}})} />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="quick-access" forceMount className="mt-0 data-[state=inactive]:hidden">
                        <div className="space-y-4 pt-4">
                             <div className="space-y-2">
                                <Label htmlFor="quick-access-title">Section Title</Label>
                                <Input id="quick-access-title" name="quick-access-title" value={homeContent.quickAccess.title} onChange={e => setHomeContent({...homeContent, quickAccess: {...homeContent.quickAccess, title: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quick-access-description">Section Description</Label>
                                <Textarea id="quick-access-description" name="quick-access-description" value={homeContent.quickAccess.description} onChange={e => setHomeContent({...homeContent, quickAccess: {...homeContent.quickAccess, description: e.target.value}})} />
                            </div>
                             <div className="flex justify-end mb-4">
                                <Button type="button" variant="outline" onClick={handleAddQuickAccessItem}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Quick Access Item
                                </Button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-4">
                                {(homeContent.quickAccess?.items || []).map((course, index) => (
                                    <Card key={index} className="p-4 relative">
                                        <div className="space-y-2">
                                            <Label htmlFor={`quick-access-item-title-${index}`}>Item Title</Label>
                                            <Input id={`quick-access-item-title-${index}`} name={`quick-access-item-title-${index}`} value={course.title} onChange={e => handleArrayChange('quickAccess', 'items', index, 'title', e.target.value)} />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <Label htmlFor={`quick-access-item-description-${index}`}>Item Description</Label>
                                            <Textarea id={`quick-access-item-description-${index}`} name={`quick-access-item-description-${index}`} value={course.description} onChange={e => handleArrayChange('quickAccess', 'items', index, 'description', e.target.value)} />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <Label htmlFor={`quick-access-item-imageId-${index}`}>Image ID</Label>
                                            <Input id={`quick-access-item-imageId-${index}`} name={`quick-access-item-imageId-${index}`} value={course.imageId} onChange={e => handleArrayChange('quickAccess', 'items', index, 'imageId', e.target.value)} />
                                             <p className="text-xs text-muted-foreground">
                                                Copy ID from the <a href="/admin/dashboard/gallery" className="text-primary underline">Image Gallery</a>.
                                            </p>
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <Label htmlFor={`quick-access-item-link-${index}`}>Item Link</Label>
                                            <Input id={`quick-access-item-link-${index}`} name={`quick-access-item-link-${index}`} value={course.link || ''} onChange={e => handleArrayChange('quickAccess', 'items', index, 'link', e.target.value)} />
                                        </div>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently remove this quick access item. This action cannot be undone. You must click "Save Changes" to finalize the deletion.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveQuickAccessItem(index)} className="bg-destructive hover:bg-destructive/90">
                                                    Yes, remove it
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="why-choose-us" forceMount className="mt-0 data-[state=inactive]:hidden">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="why-title">Title</Label>
                                <Input id="why-title" name="why-title" value={homeContent.whyChooseUs.title} onChange={e => setHomeContent({...homeContent, whyChooseUs: {...homeContent.whyChooseUs, title: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="why-description">Description</Label>
                                <Textarea id="why-description" name="why-description" value={homeContent.whyChooseUs.description} onChange={e => setHomeContent({...homeContent, whyChooseUs: {...homeContent.whyChooseUs, description: e.target.value}})} />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-4">
                            {(homeContent.whyChooseUs?.features || []).map((feature, index) => (
                                <Card key={index} className="p-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`feature-title-${index}`}>Feature {index + 1} Title</Label>
                                        <Input id={`feature-title-${index}`} name={`feature-title-${index}`} value={feature.title} onChange={e => handleArrayChange('whyChooseUs', 'features', index, 'title', e.target.value)} />
                                    </div>
                                    <div className="space-y-2 mt-2">
                                        <Label htmlFor={`feature-desc-${index}`}>Feature {index + 1} Description</Label>
                                        <Textarea id={`feature-desc-${index}`} name={`feature-desc-${index}`} value={feature.description} onChange={e => handleArrayChange('whyChooseUs', 'features', index, 'description', e.target.value)} />
                                    </div>
                                </Card>
                            ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="testimonials" forceMount className="mt-0 data-[state=inactive]:hidden">
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="testimonials-title">Title</Label>
                                <Input id="testimonials-title" name="testimonials-title" value={homeContent.testimonials.title} onChange={e => setHomeContent({...homeContent, testimonials: {...homeContent.testimonials, title: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="testimonials-description">Description</Label>
                                <Textarea id="testimonials-description" name="testimonials-description" value={homeContent.testimonials.description} onChange={e => setHomeContent({...homeContent, testimonials: {...homeContent.testimonials, description: e.target.value}})} />
                            </div>
                            <div className="flex justify-end mb-4">
                                <Button type="button" variant="outline" onClick={handleAddReview}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Review
                                </Button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-4">
                                {(homeContent.testimonials?.reviews || []).map((review, index) => (
                                    <Card key={index} className="p-4 relative">
                                        <div className="space-y-2">
                                            <Label htmlFor={`review-name-${index}`}>Reviewer Name</Label>
                                            <Input id={`review-name-${index}`} name={`review-name-${index}`} value={review.name} onChange={e => handleArrayChange('testimonials', 'reviews', index, 'name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <Label htmlFor={`review-role-${index}`}>Reviewer Role</Label>
                                            <Input id={`review-role-${index}`} name={`review-role-${index}`} value={review.role} onChange={e => handleArrayChange('testimonials', 'reviews', index, 'role', e.target.value)} />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <Label htmlFor={`review-text-${index}`}>Testimonial</Label>
                                            <Textarea id={`review-text-${index}`} name={`review-text-${index}`} value={review.testimonial} onChange={e => handleArrayChange('testimonials', 'reviews', index, 'testimonial', e.target.value)} />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <Label htmlFor={`review-rating-${index}`}>Rating (1-5)</Label>
                                            <Input type="number" min="1" max="5" id={`review-rating-${index}`} name={`review-rating-${index}`} value={review.rating} onChange={e => handleArrayChange('testimonials', 'reviews', index, 'rating', Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <Label htmlFor={`review-avatar-${index}`}>Avatar URL</Label>
                                            <Input id={`review-avatar-${index}`} name={`review-avatar-${index}`} value={review.avatar} onChange={e => handleArrayChange('testimonials', 'reviews', index, 'avatar', e.target.value)} />
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently remove this testimonial. This action cannot be undone. You must click "Save Changes" to finalize the deletion.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveReview(index)} className="bg-destructive hover:bg-destructive/90">
                                                    Yes, remove it
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="updates" forceMount className="mt-0 data-[state=inactive]:hidden">
                        <UpdatesManager 
                          updates={updates}
                          onAddUpdate={handleAddUpdate}
                          onRemoveUpdate={handleRemoveUpdate}
                          onUpdateChange={handleUpdateChange}
                        />
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    </form>
  );
}

interface UpdatesManagerProps {
  updates: { title: string; description: string; updates: Update[] };
  onAddUpdate: () => void;
  onRemoveUpdate: (index: number) => void;
  onUpdateChange: (index: number, field: string, value: string) => void;
}

function UpdatesManager({ updates, onAddUpdate, onRemoveUpdate, onUpdateChange }: UpdatesManagerProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="updates-title">Section Title</Label>
        <Input 
          id="updates-title" 
          name="updates-title"
          value={updates.title} 
          onChange={e => {}} 
          readOnly
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="updates-description">Section Description</Label>
        <Textarea 
          id="updates-description" 
          name="updates-description"
          value={updates.description} 
          onChange={e => {}} 
          readOnly
        />
      </div>

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={onAddUpdate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Update
        </Button>
        <p className="text-sm text-muted-foreground">
          Click "Save Changes" to save all updates
        </p>
      </div>

      <div className="max-h-[500px] overflow-y-auto space-y-4 pr-4">
        {(updates.updates || []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No updates yet. Add your first update!</p>
          </div>
        ) : (
          (updates.updates || []).map((update, index) => (
            <Card key={index} className="p-4 relative">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Update?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this update. Click "Save Changes" to finalize.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onRemoveUpdate(index)} 
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={update.title} 
                      onChange={e => onUpdateChange(index, 'title', e.target.value)} 
                      placeholder="Update title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={update.date} 
                      onChange={e => onUpdateChange(index, 'date', e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    value={update.description} 
                    onChange={e => onUpdateChange(index, 'description', e.target.value)} 
                    placeholder="Brief description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea 
                    value={update.content} 
                    onChange={e => onUpdateChange(index, 'content', e.target.value)} 
                    placeholder="Full content"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Author</Label>
                    <Input 
                      value={update.author || ''} 
                      onChange={e => onUpdateChange(index, 'author', e.target.value)} 
                      placeholder="Author name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      value={update.category || 'News'}
                      onChange={e => onUpdateChange(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option>News</option>
                      <option>Course</option>
                      <option>Platform</option>
                      <option>Milestone</option>
                      <option>Launch</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
