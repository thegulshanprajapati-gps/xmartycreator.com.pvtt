
'use server';

import { revalidatePath } from 'next/cache';

export interface Submission {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

async function getSubmissions(): Promise<Submission[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/pages/contact-submissions`, {
            cache: 'no-store',
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.content || [];
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
}

export async function handleContactSubmission(prevState: any, formData: FormData) {
    const newSubmission: Submission = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
        submittedAt: new Date().toISOString(),
    };

    if (!newSubmission.name || !newSubmission.email || !newSubmission.subject || !newSubmission.message) {
        return { success: false, message: 'Please fill out all fields.' };
    }

    try {
        const submissions = await getSubmissions();
        submissions.unshift(newSubmission); // Add new submission to the beginning

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/pages/contact-submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: 'contact-submissions', content: submissions }),
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to save submission');

        // Revalidate paths to show new data
        revalidatePath('/contact');
        revalidatePath('/admin/dashboard/contact');

        return { success: true, message: 'Your message has been sent successfully!' };
    } catch (error: any) {
        console.error('Error saving contact submission:', error);
        return { success: false, message: 'Failed to send message. Please try again later.' };
    }
}
