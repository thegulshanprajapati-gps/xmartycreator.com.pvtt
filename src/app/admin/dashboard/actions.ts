
'use server';

import { revalidatePath } from 'next/cache';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import clientPromise from '@/lib/mongodb';
import { clearPageCache } from "@/lib/page-content-cache";
import { DEFAULT_SITE_SETTINGS, isValidCursorStyle } from '@/lib/site-settings';


function getFeaturesFromFormData(formData: FormData) {
    const features = [];
    let index = 0;
    while (formData.has(`feature-title-${index}`)) {
        features.push({
            title: formData.get(`feature-title-${index}`) as string,
            description: formData.get(`feature-desc-${index}`) as string,
        });
        index++;
    }
    return features;
}

function getReviewsFromFormData(formData: FormData) {
    const reviews = [];
    let index = 0;
    while (formData.has(`review-name-${index}`)) {
        const genderRaw = (formData.get(`review-gender-${index}`) as string) || '';
        reviews.push({
            name: formData.get(`review-name-${index}`) as string,
            role: formData.get(`review-role-${index}`) as string,
            testimonial: formData.get(`review-text-${index}`) as string,
            rating: Number(formData.get(`review-rating-${index}`)),
            avatar: formData.get(`review-avatar-${index}`) as string,
            gender: genderRaw === 'female' ? 'female' : genderRaw === 'male' ? 'male' : undefined,
        });
        index++;
    }
    return reviews;
}

function getValuesFromFormData(formData: FormData) {
    const values = [];
    let index = 0;
    while (formData.has(`value-title-${index}`)) {
        values.push({
            title: formData.get(`value-title-${index}`) as string,
            description: formData.get(`value-description-${index}`) as string,
        });
        index++;
    }
    return values;
}

function getParagraphsFromFormData(formData: FormData) {
    const paragraphs = [];
    let index = 0;
    while (formData.has(`story-paragraph-${index}`)) {
        paragraphs.push(formData.get(`story-paragraph-${index}`) as string);
        index++;
    }
    return paragraphs;
}

function getFounderHighlightsFromFormData(formData: FormData) {
    const highlights = [];
    let index = 0;
    while (formData.has(`founder-highlight-${index}`)) {
        const value = (formData.get(`founder-highlight-${index}`) as string)?.trim();
        if (value) {
            highlights.push(value);
        }
        index++;
    }
    return highlights;
}

function getCoursesFromFormData(formData: FormData) {
    const courses = [];
    let index = 0;
    while (formData.has(`course-title-${index}`)) {
        const title = formData.get(`course-title-${index}`) as string;
        // Only add course if title is not empty
        if (title) {
            courses.push({
                title: title,
                description: formData.get(`course-description-${index}`) as string,
                imageId: formData.get(`course-imageId-${index}`) as string,
            });
        }
        index++;
    }
    return courses;
}

function getQuickAccessItemsFromFormData(formData: FormData) {
    const items = [];
    let index = 0;
    while (formData.has(`quick-access-item-title-${index}`)) {
        const title = formData.get(`quick-access-item-title-${index}`) as string;
        if (title) {
            items.push({
                title: title,
                description: formData.get(`quick-access-item-description-${index}`) as string,
                imageId: formData.get(`quick-access-item-imageId-${index}`) as string,
                link: formData.get(`quick-access-item-link-${index}`) as string,
            });
        }
        index++;
    }
    return items;
}

function getUpdatesFromFormData(formData: FormData) {
    const updates = [];
    const count = Number(formData.get('updates-count') || 0);
    
    for (let index = 0; index < count; index++) {
        const title = formData.get(`update-title-${index}`) as string;
        if (title) {
            updates.push({
                title,
                description: formData.get(`update-description-${index}`) as string,
                content: formData.get(`update-content-${index}`) as string,
                date: formData.get(`update-date-${index}`) as string,
                author: formData.get(`update-author-${index}`) as string,
                category: formData.get(`update-category-${index}`) as string || 'News',
            });
        }
    }
    return updates;
}

function getAchievementStatsFromFormData(formData: FormData) {
    const stats = [];
    let index = 0;
    while (
      formData.has(`achievements-value-${index}`) ||
      formData.has(`achievements-label-${index}`) ||
      formData.has(`achievements-suffix-${index}`)
    ) {
        const value = Number(formData.get(`achievements-value-${index}`));
        const label = (formData.get(`achievements-label-${index}`) as string) || '';
        const suffix = (formData.get(`achievements-suffix-${index}`) as string) || '';
        if (label.trim() || Number.isFinite(value)) {
            stats.push({
                value: Number.isFinite(value) ? value : 0,
                label: label,
                suffix: suffix,
            });
        }
        index++;
    }
    return stats;
}

function getBlogPostsFromFormData(formData: FormData) {
    const posts = [];
    let index = 0;
    while(formData.has(`post-title-${index}`)) {
        const title = formData.get(`post-title-${index}`) as string;
        const slug = formData.get(`post-slug-${index}`) as string;
        if (title && slug) {
            posts.push({
                title: title,
                slug: slug,
                description: formData.get(`post-description-${index}`) as string,
                imageId: formData.get(`post-imageId-${index}`) as string,
                link: `/blog/${slug}`,
                content: formData.get(`post-content-${index}`) as string,
            });
        }
        index++;
    }
    return posts;
}


export async function updateHomeContent(prevState: { message: string, data: any }, formData: FormData) {
    try {
        console.log('🔄 [Admin] Updating home content...');
        const quickAccessData = {
            title: formData.get('quick-access-title') as string,
            description: formData.get('quick-access-description') as string,
            items: getQuickAccessItemsFromFormData(formData),
        };

        const newContent = {
            hero: {
                title: formData.get('hero-title') as string,
                description: formData.get('hero-description') as string,
                buttons: {
                    primary: {
                        text: formData.get('hero-primary-btn-text') as string,
                        link: formData.get('hero-primary-btn-link') as string,
                    },
                    secondary: {
                        text: formData.get('hero-secondary-btn-text') as string,
                        link: formData.get('hero-secondary-btn-link') as string,
                    },
                },
            },
            whyChooseUs: {
                title: formData.get('why-title') as string,
                description: formData.get('why-description') as string,
                features: getFeaturesFromFormData(formData),
            },
            testimonials: {
                title: formData.get('testimonials-title') as string,
                description: formData.get('testimonials-description') as string,
                reviews: getReviewsFromFormData(formData),
            },
            achievements: {
                badge: formData.get('achievements-badge') as string,
                title: formData.get('achievements-title') as string,
                description: formData.get('achievements-description') as string,
                stats: getAchievementStatsFromFormData(formData),
            },
        };
        const testimonialsData = {
            title: newContent.testimonials.title,
            description: newContent.testimonials.description,
            items: newContent.testimonials.reviews,
        };

        // Extract updates from form data
        const updatesData = {
            title: formData.get('updates-title') as string,
            description: formData.get('updates-description') as string,
            updates: getUpdatesFromFormData(formData),
        };

        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);
        
        // Save home content
        await db.collection('pages').updateOne(
            { slug: 'home' },
            { $set: { slug: 'home', content: newContent } },
            { upsert: true }
        );

        // Save quick access separately
        await db.collection('quick_access').updateOne(
            { slug: 'quick-access' },
            { 
                $set: { 
                    slug: 'quick-access',
                    title: quickAccessData.title,
                    description: quickAccessData.description,
                    items: quickAccessData.items,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                }
            },
            { upsert: true }
        );

        // Save testimonials separately
        await db.collection('Testimonial').updateOne(
            { slug: 'home' },
            {
                $set: {
                    slug: 'home',
                    title: testimonialsData.title,
                    description: testimonialsData.description,
                    items: testimonialsData.items,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );

        // Save updates separately
        await db.collection('pages').updateOne(
            { slug: 'updates' },
            { $set: { slug: 'updates', content: updatesData, updatedAt: new Date() } },
            { upsert: true }
        );

        revalidatePath('/');
        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/dashboard/testimonials');
        
        console.log('✅ [Admin] Home content updated successfully');
        console.log(`✅ [Admin] Quick Access saved: ${quickAccessData.items.length} items`);
        console.log(`✅ [Admin] Updates saved: ${updatesData.updates.length} updates`);
        return { 
            message: 'Home page content and updates saved successfully!', 
            data: { ...newContent, quickAccess: quickAccessData } 
        };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to update home content:', error);
        return { message: `Failed to update home page content: ${error.message}`, data: prevState.data };
    }
}


export async function updateAboutContent(prevState: { message: string, data: any }, formData: FormData) {
    try {
        console.log('🔄 [Admin] Updating about content...');
        const newContent = {
            hero: {
                title: formData.get('hero-title') as string,
                description: formData.get('hero-description') as string,
                imageId: formData.get('hero-imageId') as string,
            },
            story: {
                title: formData.get('story-title') as string,
                paragraphs: getParagraphsFromFormData(formData),
            },
            values: {
                title: formData.get('values-title') as string,
                description: formData.get('values-description') as string,
                items: getValuesFromFormData(formData),
            },
            founder: {
                title: formData.get('founder-title') as string,
                description: formData.get('founder-description') as string,
                name: formData.get('founder-name') as string,
                role: formData.get('founder-role') as string,
                bio: formData.get('founder-bio') as string,
                highlights: getFounderHighlightsFromFormData(formData),
                imageId: formData.get('founder-imageId') as string,
                socials: {
                    linkedin: formData.get('founder-socials-linkedin') as string,
                    twitter: formData.get('founder-socials-twitter') as string,
                    instagram: formData.get('founder-socials-instagram') as string,
                    youtube: formData.get('founder-socials-youtube') as string,
                }
            },
        };

        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);
        
        await db.collection('about_page').updateOne(
            { slug: 'about' },
            { 
                $set: { 
                    slug: 'about', 
                    ...newContent,
                    updatedAt: new Date(),
                },
                $unset: { content: '' },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        revalidatePath('/about');
        revalidatePath('/admin/dashboard/about');
        
        console.log('✅ [Admin] About content updated successfully');
        return { message: 'About page content updated successfully!', data: newContent };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to update about content:', error);
        return { message: `Failed to update about page content: ${error.message}`, data: prevState.data };
    }
}

export async function updateNotificationContent(prevState: { message: string, data: any }, formData: FormData) {
    try {
        console.log('🔄 [Admin] Updating notification...');
        const newContent = {
            enabled: formData.get('enabled') === 'on',
            message: formData.get('message') as string,
            linkText: formData.get('linkText') as string,
            linkHref: formData.get('linkHref') as string,
        };

        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);
        
        await db.collection('pages').updateOne(
            { slug: 'notification' },
            { $set: { slug: 'notification', content: newContent } },
            { upsert: true }
        );

        revalidatePath('layout'); // Revalidate all pages using the layout
        
        console.log('✅ [Admin] Notification updated successfully');
        return { message: 'Notification banner updated successfully!', data: newContent };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to update notification:', error);
        return { message: `Failed to update notification banner: ${error.message}`, data: prevState.data };
    }
}


export async function updateCoursesContent(prevState: { message: string, data: any }, formData: FormData) {
    try {
        console.log('🔄 [Admin] Updating courses content...');
        const developmentMode = (formData.get('courses-development-mode') as string) === 'true';
        const newContent = {
            hero: {
                title: formData.get('hero-title') as string,
                description: formData.get('hero-description') as string,
            },
            courses: getCoursesFromFormData(formData),
            developmentMode,
        };

        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);
        
        await db.collection('pages').updateOne(
            { slug: 'courses' },
            { $set: { slug: 'courses', content: newContent } },
            { upsert: true }
        );

        revalidatePath('/courses');
        revalidatePath('/admin/dashboard/courses');
        
        console.log('✅ [Admin] Courses content updated successfully');
        return { message: 'Courses page content updated successfully!', data: newContent };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to update courses content:', error);
        return { message: `Failed to update courses page content: ${error.message}`, data: prevState.data };
    }
}


export async function updateBlogContent(prevState: { message: string, data: any }, formData: FormData) {
    try {
        console.log('🔄 [Admin] Updating blog content...');
        const newContent = {
            hero: {
                title: formData.get('hero-title') as string,
                description: formData.get('hero-description') as string,
            },
            posts: getBlogPostsFromFormData(formData),
        };

        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);
        
        await db.collection('pages').updateOne(
            { slug: 'blog' },
            { $set: { slug: 'blog', content: newContent } },
            { upsert: true }
        );

        revalidatePath('/blog');
        revalidatePath('/admin/dashboard/blog');
        
        console.log('✅ [Admin] Blog content updated successfully');
        return { message: 'Blog page content updated successfully!', data: newContent };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to update blog content:', error);
        return { message: `Failed to update blog page content: ${error.message}`, data: prevState.data };
    }
}


export async function addImageToGallery(prevState: { message: string }, formData: FormData) {
    try {
        console.log('🔄 [Admin] Adding/Updating image in gallery...');
        const id = formData.get('id') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const description = formData.get('description') as string;
        const imageHint = formData.get('imageHint') as string;
        const title = formData.get('title') as string;

        if (!id || !imageUrl || !description) {
            return { message: 'Error: ID, Image URL, and Description are required.' };
        }

        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);
        
        // Fetch current gallery data
        const galleryPage = await db.collection('pages').findOne({ slug: 'gallery' });
        const placeholderImages = galleryPage?.content?.placeholderImages || [];

        // Check if image exists
        const existingImageIndex = placeholderImages.findIndex((image: ImagePlaceholder) => image.id === id);
        
        const newImage: ImagePlaceholder = {
            id,
            imageUrl,
            title: title || '',
            description,
            imageHint: imageHint || 'custom image'
        };

        if (existingImageIndex !== -1) {
            // Update existing image
            placeholderImages[existingImageIndex] = newImage;
            console.log(`✅ [Admin] Image "${id}" updated in gallery`);
        } else {
            // Add new image
            placeholderImages.push(newImage);
            console.log(`✅ [Admin] Image "${id}" added to gallery`);
        }

        // Save updated gallery
        await db.collection('pages').updateOne(
            { slug: 'gallery' },
            { $set: { slug: 'gallery', content: { placeholderImages } } },
            { upsert: true }
        );

        clearPageCache('gallery');
        revalidatePath('/admin/dashboard/gallery');
        return { message: `Success: Image "${id}" has been ${existingImageIndex !== -1 ? 'updated' : 'added'} to the gallery!` };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to add/update image:', error);
        return { message: `Error: Could not add image. ${error.message}` };
    }
}

export async function deleteImageFromGallery(imageId: string) {
    if (!imageId) {
        return { success: false, message: 'Error: Image ID is required.' };
    }

    try {
        console.log('🔄 [Admin] Deleting image from gallery...');
        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);
        
        // Fetch current gallery data
        const galleryPage = await db.collection('pages').findOne({ slug: 'gallery' });
        const placeholderImages = galleryPage?.content?.placeholderImages || [];

        const initialLength = placeholderImages.length;
        const updatedImages = placeholderImages.filter((image: ImagePlaceholder) => image.id !== imageId);

        if (updatedImages.length === initialLength) {
            return { success: false, message: `Error: Image with ID "${imageId}" not found.` };
        }

        // Save updated gallery
        await db.collection('pages').updateOne(
            { slug: 'gallery' },
            { $set: { slug: 'gallery', content: { placeholderImages: updatedImages } } },
            { upsert: true }
        );

        clearPageCache('gallery');
        revalidatePath('/admin/dashboard/gallery');
        console.log('✅ [Admin] Image deleted from gallery');
        return { success: true, message: `Success: Image "${imageId}" has been deleted.` };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to delete image:', error);
        return { success: false, message: `Error: Could not delete image. ${error.message}` };
    }
}

export async function updateSiteSettings(prevState: { message: string; data: any }, formData: FormData) {
    try {
        console.log('🔧 [Admin] Updating site settings...');
        const rawCursorStyle = formData.get('cursor-style') as string;
        const cursorStyle = isValidCursorStyle(rawCursorStyle)
            ? rawCursorStyle
            : DEFAULT_SITE_SETTINGS.cursorStyle;

        const client = await clientPromise;
        const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
        const db = client.db(dbName);

        await db.collection('site_settings').updateOne(
            { slug: 'global' },
            {
                $set: {
                    slug: 'global',
                    cursorStyle,
                    updatedAt: new Date(),
                },
                $unset: { content: '' },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        revalidatePath('layout');
        revalidatePath('/admin/dashboard/appearance');

        console.log('✅ [Admin] Site settings updated successfully');
        return { message: 'Site settings updated successfully!', data: { cursorStyle } };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to update site settings:', error);
        return { message: `Failed to update site settings: ${error.message}`, data: prevState.data };
    }
}
