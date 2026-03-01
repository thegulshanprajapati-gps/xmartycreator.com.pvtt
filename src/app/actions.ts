'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';

type ReviewInput = {
    name: string;
    role: string;
    testimonial: string;
    rating: number;
    gender: 'male' | 'female';
};

function normalizeGender(value: unknown): 'male' | 'female' {
    return value === 'female' ? 'female' : 'male';
}

function getAvatarForGender(name: string, gender: 'male' | 'female') {
    const safeSeed = encodeURIComponent((name || 'user').replace(/\s/g, '') || 'user');
    const style = gender === 'female' ? 'lorelei' : 'adventurer';
    return `https://api.dicebear.com/8.x/${style}/svg?seed=${safeSeed}`;
}

export async function handleNewReview(reviewData: ReviewInput) {
    try {
        const gender = normalizeGender(reviewData.gender);
        const newReview = {
            ...reviewData,
            gender,
            avatar: getAvatarForGender(reviewData.name, gender),
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
