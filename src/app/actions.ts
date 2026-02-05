'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';

type ReviewInput = {
    name: string;
    role: string;
    testimonial: string;
    rating: number;
};

export async function handleNewReview(reviewData: ReviewInput) {
    try {
        const newReview = {
            ...reviewData,
            avatar: `https://api.dicebear.com/8.x/adventurer/svg?seed=${reviewData.name.replace(/\s/g, '')}`
        };

        const client = await clientPromise;
        const db = client.db('xmartydb');

        await db.collection('Testimonial').insertOne({
            ...newReview,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error('Error saving review:', error);
        return { success: false, error: 'Failed to save review.' };
    }
}
