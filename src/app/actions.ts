'use server';

import { revalidatePath } from 'next/cache';
import { type Review } from './page';

export async function handleNewReview(reviewData: Omit<Review, 'avatar'>) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        // Fetch current home content
        const fetchRes = await fetch(`${baseUrl}/api/pages/home`, {
            cache: 'no-store',
        });
        if (!fetchRes.ok) throw new Error('Failed to fetch home content');
        const homeData = await fetchRes.json();
        const content = homeData.content || {};

        const newReview: Review = {
            ...reviewData,
            avatar: `https://api.dicebear.com/8.x/adventurer/svg?seed=${reviewData.name.replace(/\s/g, '')}`
        };

        if (!content.testimonials) content.testimonials = { title: '', description: '', reviews: [] };
        content.testimonials.reviews.unshift(newReview);

        // Save updated content
        const saveRes = await fetch(`${baseUrl}/api/pages/home`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: 'home', content }),
            cache: 'no-store',
        });
        if (!saveRes.ok) throw new Error('Failed to save review');

        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error('Error saving review:', error);
        return { success: false, error: 'Failed to save review.' };
    }
}
