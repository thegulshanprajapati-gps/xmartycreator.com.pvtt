'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';

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

export async function updateContactContent(
  prevState: { message: string; data: ContactContent },
  formData: FormData
) {
  try {
    const content: ContactContent = {
      hero: {
        title: (formData.get('hero-title') as string) || '',
        description: (formData.get('hero-description') as string) || '',
      },
      info: {
        title: (formData.get('info-title') as string) || '',
        description: (formData.get('info-description') as string) || '',
        email: (formData.get('info-email') as string) || '',
        phone: (formData.get('info-phone') as string) || '',
        address: (formData.get('info-address') as string) || '',
      },
      form: {
        title: (formData.get('form-title') as string) || '',
        description: (formData.get('form-description') as string) || '',
        namePlaceholder: (formData.get('form-name-placeholder') as string) || '',
        emailPlaceholder: (formData.get('form-email-placeholder') as string) || '',
        subjectPlaceholder: (formData.get('form-subject-placeholder') as string) || '',
        messagePlaceholder: (formData.get('form-message-placeholder') as string) || '',
        buttonText: (formData.get('form-button-text') as string) || '',
      },
    };

    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);

    await db.collection('pages').updateOne(
      { slug: 'contact' },
      { $set: { slug: 'contact', content } },
      { upsert: true }
    );

    revalidatePath('/contact');
    revalidatePath('/admin/dashboard/contact');

    return { message: 'Contact page content saved.', data: content };
  } catch (error: any) {
    return { message: `Failed to save contact content: ${error.message}`, data: prevState.data };
  }
}
