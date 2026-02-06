'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Footer } from '@/components/layout/footer';
import { useToast } from '@/hooks/use-toast';
import { handleContactSubmission } from './actions';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const riseIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

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

function normalizeContactContent(raw: any): ContactContent {
  const hero = { ...DEFAULT_CONTACT_CONTENT.hero, ...(raw?.hero || {}) };
  const info = { ...DEFAULT_CONTACT_CONTENT.info, ...(raw?.info || {}) };
  const form = { ...DEFAULT_CONTACT_CONTENT.form, ...(raw?.form || {}) };

  return {
    hero: {
      title: hero.title || DEFAULT_CONTACT_CONTENT.hero.title,
      description: hero.description || DEFAULT_CONTACT_CONTENT.hero.description,
    },
    info: {
      title: info.title || DEFAULT_CONTACT_CONTENT.info.title,
      description: info.description || '',
      email: info.email || '',
      phone: info.phone || '',
      address: info.address || '',
    },
    form: {
      title: form.title || DEFAULT_CONTACT_CONTENT.form.title,
      description: form.description || '',
      namePlaceholder: form.namePlaceholder || DEFAULT_CONTACT_CONTENT.form.namePlaceholder,
      emailPlaceholder: form.emailPlaceholder || DEFAULT_CONTACT_CONTENT.form.emailPlaceholder,
      subjectPlaceholder: form.subjectPlaceholder || DEFAULT_CONTACT_CONTENT.form.subjectPlaceholder,
      messagePlaceholder: form.messagePlaceholder || DEFAULT_CONTACT_CONTENT.form.messagePlaceholder,
      buttonText: form.buttonText || DEFAULT_CONTACT_CONTENT.form.buttonText,
    },
  };
}

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(handleContactSubmission, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [contactContent, setContactContent] = useState<ContactContent>(DEFAULT_CONTACT_CONTENT);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/contact', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            setContactContent(normalizeContactContent(data));
          }
        }
      } catch (error) {
        console.error('Error fetching contact content:', error);
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    if (state?.message) {
        toast({
            title: state.success ? 'Success!' : 'Error!',
            description: state.message,
            variant: state.success ? 'default' : 'destructive',
        });
        if (state.success) {
            formRef.current?.reset();
        }
    }
  }, [state, toast]);

  const contactItems = [
    {
      icon: Mail,
      label: 'Email',
      value: contactContent.info.email,
      href: contactContent.info.email ? `mailto:${contactContent.info.email}` : undefined,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: contactContent.info.phone,
      href: contactContent.info.phone ? `tel:${contactContent.info.phone}` : undefined,
    },
    {
      icon: MapPin,
      label: 'Address',
      value: contactContent.info.address,
    },
  ].filter((item) => item.value && item.value.trim().length > 0);

  return (
    <>
      <div className="flex flex-col bg-background">
        <motion.section
          className="relative w-full overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.14),_transparent_50%)] dark:bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.18),_transparent_50%)]" />
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

          <div className="container mx-auto px-4 md:px-6 pt-16 pb-20 md:pt-20 md:pb-24 relative z-10">
            <motion.div
              className="mx-auto max-w-3xl space-y-6 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={staggerContainer}
            >
              <motion.div
                variants={riseIn}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <MessageSquare className="h-4 w-4" />
                Contact
              </motion.div>
              <motion.h1
                variants={riseIn}
                className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                {contactContent.hero.title}
              </motion.h1>
              <motion.p
                variants={riseIn}
                className="text-base md:text-lg text-slate-600 dark:text-slate-300"
              >
                {contactContent.hero.description}
              </motion.p>
            </motion.div>

            <div className="mt-12 grid gap-10 lg:grid-cols-5">
              <motion.div
                className="lg:col-span-2 space-y-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6 }}
              >
                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_30px_80px_-60px_rgba(14,116,144,0.8)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_-60px_rgba(14,116,144,0.9)] dark:border-white/10 dark:bg-slate-900/70">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      Contact Info
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {contactContent.info.title}
                    </h2>
                    {contactContent.info.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {contactContent.info.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    {contactItems.length > 0 ? (
                      contactItems.map((item) => (
                        <div
                          key={item.label}
                          className="group flex items-start gap-4 rounded-2xl border border-transparent bg-slate-50/80 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-emerald-200/70 hover:bg-emerald-50/60 dark:bg-slate-900/60 dark:hover:border-emerald-500/30"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner dark:bg-emerald-500/10 dark:text-emerald-300">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                            {item.href ? (
                              <a
                                href={item.href}
                                className="text-sm text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-300"
                              >
                                {item.value}
                              </a>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-300">{item.value}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                        Contact info hasn’t been set yet. Add it in the admin panel.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10 p-6 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">Response time</p>
                  <p className="mt-2">We usually reply within 24 hours on working days.</p>
                </div>
              </motion.div>

              <motion.div
                className="lg:col-span-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: 0.05 }}
              >
                <Card className="h-full border border-slate-200/70 bg-white/95 shadow-[0_40px_120px_-80px_rgba(15,118,110,0.9)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_50px_140px_-90px_rgba(15,118,110,0.95)] dark:border-white/10 dark:bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                      {contactContent.form.title}
                    </CardTitle>
                    {contactContent.form.description && (
                      <CardDescription className="text-slate-600 dark:text-slate-300">
                        {contactContent.form.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <form ref={formRef} action={formAction} className="space-y-6">
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">{contactContent.form.namePlaceholder}</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder={contactContent.form.namePlaceholder}
                            className="bg-white/70 dark:bg-slate-900/60"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{contactContent.form.emailPlaceholder}</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={contactContent.form.emailPlaceholder}
                            className="bg-white/70 dark:bg-slate-900/60"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">{contactContent.form.subjectPlaceholder}</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder={contactContent.form.subjectPlaceholder}
                          className="bg-white/70 dark:bg-slate-900/60"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">{contactContent.form.messagePlaceholder}</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder={contactContent.form.messagePlaceholder}
                          className="min-h-[160px] bg-white/70 dark:bg-slate-900/60"
                          required
                        />
                      </div>
                      <Button type="submit" size="lg" className="w-full gap-2" disabled={isPending}>
                        <Send className="h-4 w-4" />
                        {isPending ? 'Sending...' : contactContent.form.buttonText}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </div>
      <Footer />
    </>
  );
}
