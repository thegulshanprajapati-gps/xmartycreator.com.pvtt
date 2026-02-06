import type { Metadata } from 'next';
import clientPromise from '@/lib/mongodb';
import ContactContentManager from './contact-content-manager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact',
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, User, Clock, MessageSquare, Inbox } from 'lucide-react';
import { type Submission } from '@/app/contact/actions';
import { formatDistanceToNow } from 'date-fns';

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

const DEFAULT_CONTACT_CONTENT: ContactContent = {
  hero: { title: 'Contact', description: 'Get in touch with us' },
  info: { title: 'Contact Info', description: '', email: '', phone: '', address: '' },
  form: {
    title: 'Send us a message',
    description: '',
    namePlaceholder: 'Name',
    emailPlaceholder: 'Email',
    subjectPlaceholder: 'Subject',
    messagePlaceholder: 'Message',
    buttonText: 'Send',
  },
};

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
    console.error('Failed to fetch contact submissions:', error);
    return [];
  }
}

async function getContactContent(): Promise<ContactContent> {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const page = await db.collection('pages').findOne({ slug: 'contact' });
    const raw = page?.content || {};
    return {
      hero: { ...DEFAULT_CONTACT_CONTENT.hero, ...(raw.hero || {}) },
      info: { ...DEFAULT_CONTACT_CONTENT.info, ...(raw.info || {}) },
      form: { ...DEFAULT_CONTACT_CONTENT.form, ...(raw.form || {}) },
    };
  } catch (error) {
    console.error('Failed to fetch contact content:', error);
    return DEFAULT_CONTACT_CONTENT;
  }
}

export default async function AdminContactPage() {
  const submissions = await getSubmissions();
  const contactContent = await getContactContent();

  return (
    <>
      <ContactContentManager initialContent={contactContent} />
      <div className="flex items-center mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Contact Form Submissions</h1>
      </div>
      
      {submissions.length > 0 ? (
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {submissions.map((submission, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="flex flex-col h-full bg-card shadow-lg rounded-xl overflow-hidden border-l-4 border-primary">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4 bg-muted/30">
                        <Avatar className="h-12 w-12 border-2 border-primary/50">
                            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                                {submission.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-semibold leading-tight flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {submission.name}
                            </CardTitle>
                            <a href={`mailto:${submission.email}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {submission.email}
                            </a>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MessageSquare className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Subject</p>
                                <p className="font-medium text-foreground">{submission.subject}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                             <div className="w-5 h-5 flex-shrink-0" />
                             <div>
                                <p className="text-sm font-semibold text-muted-foreground">Message</p>
                                <p className="text-foreground text-sm leading-relaxed max-h-24 overflow-y-auto pr-2">
                                    {submission.message}
                                </p>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardDescription className="px-6 py-3 bg-muted/30 text-xs text-muted-foreground border-t flex items-center justify-end gap-2">
                      <Clock className="h-3 w-3" />
                      Submitted {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                    </CardDescription>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-12" />
          <CarouselNext className="mr-12"/>
        </Carousel>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-12">
            <div className="flex flex-col items-center gap-2 text-center">
                <Inbox className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="text-2xl font-bold tracking-tight">
                    No Submissions Yet
                </h3>
                <p className="text-sm text-muted-foreground">
                    When users submit the contact form, their messages will appear here.
                </p>
            </div>
        </div>
      )}
    </>
  );
}
