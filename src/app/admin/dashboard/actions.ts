
'use server';

import { revalidatePath } from 'next/cache';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import clientPromise from '@/lib/mongodb';


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
        reviews.push({
            name: formData.get(`review-name-${index}`) as string,
            role: formData.get(`review-role-${index}`) as string,
            testimonial: formData.get(`review-text-${index}`) as string,
            rating: Number(formData.get(`review-rating-${index}`)),
            avatar: formData.get(`review-avatar-${index}`) as string,
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

function getFeaturedCoursesFromFormData(formData: FormData) {
    const courses = [];
    let index = 0;
    while (formData.has(`featured-course-title-${index}`)) {
        const title = formData.get(`featured-course-title-${index}`) as string;
        if (title) {
            courses.push({
                title: title,
                description: formData.get(`featured-course-description-${index}`) as string,
                imageId: formData.get(`featured-course-imageId-${index}`) as string,
            });
        }
        index++;
    }
    return courses;
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
            featuredCourses: {
                title: formData.get('featured-courses-title') as string,
                description: formData.get('featured-courses-description') as string,
                courses: getFeaturedCoursesFromFormData(formData),
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
        };

        // Extract updates from form data
        const updatesData = {
            title: formData.get('updates-title') as string,
            description: formData.get('updates-description') as string,
            updates: getUpdatesFromFormData(formData),
        };

        const client = await clientPromise;
        const db = client.db('myapp');
        
        // Save home content
        await db.collection('pages').updateOne(
            { slug: 'home' },
            { $set: { slug: 'home', content: newContent } },
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
        console.log(`✅ [Admin] Updates saved: ${updatesData.updates.length} updates`);
        return { message: 'Home page content and updates saved successfully!', data: newContent };
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
                socials: {
                    linkedin: formData.get('founder-socials-linkedin') as string,
                    twitter: formData.get('founder-socials-twitter') as string,
                    instagram: formData.get('founder-socials-instagram') as string,
                    youtube: formData.get('founder-socials-youtube') as string,
                }
            },
        };

        const client = await clientPromise;
        const db = client.db('myapp');
        
        await db.collection('pages').updateOne(
            { slug: 'about' },
            { $set: { slug: 'about', content: newContent } },
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
        const db = client.db('myapp');
        
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
        const newContent = {
            hero: {
                title: formData.get('hero-title') as string,
                description: formData.get('hero-description') as string,
            },
            courses: getCoursesFromFormData(formData),
        };

        const client = await clientPromise;
        const db = client.db('myapp');
        
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
        const db = client.db('myapp');
        
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
        console.log('🔄 [Admin] Adding image to gallery...');
        const id = formData.get('id') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const description = formData.get('description') as string;
        const imageHint = formData.get('imageHint') as string;

        if (!id || !imageUrl || !description) {
            return { message: 'Error: ID, Image URL, and Description are required.' };
        }

        const client = await clientPromise;
        const db = client.db('myapp');
        
        // Fetch current gallery data
        const galleryPage = await db.collection('pages').findOne({ slug: 'gallery' });
        const placeholderImages = galleryPage?.content?.placeholderImages || [];

        if (placeholderImages.some((image: ImagePlaceholder) => image.id === id)) {
            return { message: 'Error: An image with this ID already exists.' };
        }

        const newImage: ImagePlaceholder = {
            id,
            imageUrl,
            description,
            imageHint: imageHint || 'custom image'
        };

        placeholderImages.push(newImage);

        // Save updated gallery
        await db.collection('pages').updateOne(
            { slug: 'gallery' },
            { $set: { slug: 'gallery', content: { placeholderImages } } },
            { upsert: true }
        );

        revalidatePath('/admin/dashboard/gallery');
        console.log('✅ [Admin] Image added to gallery');
        return { message: 'Success: Image added to the gallery!' };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to add image:', error);
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
        const db = client.db('myapp');
        
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

        revalidatePath('/admin/dashboard/gallery');
        console.log('✅ [Admin] Image deleted from gallery');
        return { success: true, message: `Success: Image "${imageId}" has been deleted.` };
    } catch (error: any) {
        console.error('❌ [Admin] Failed to delete image:', error);
        return { success: false, message: `Error: Could not delete image. ${error.message}` };
    }
}
