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

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(handleContactSubmission, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [contactContent, setContactContent] = useState<ContactContent>({
    hero: { title: 'Contact', description: 'Get in touch with us' },
    info: { title: 'Contact Info', description: '', email: '', phone: '', address: '' },
    form: { title: 'Send us a message', description: '', namePlaceholder: 'Name', emailPlaceholder: 'Email', subjectPlaceholder: 'Subject', messagePlaceholder: 'Message', buttonText: 'Send' }
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/contact');
        if (res.ok) {
          const data = await res.json();
          setContactContent(data);
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

  return (
    <>
      <div className="flex flex-col bg-background">
        
        <motion.section 
          className="w-full py-20 md:py-32"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeIn}
            >
              <MessageSquare className="h-12 w-12 text-destructive dark:text-foreground" />
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-destructive dark:text-foreground">
                {contactContent.hero.title}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl">
                {contactContent.hero.description}
              </p>
            </motion.div>
            <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
              
              {/* Contact Information */}
              <motion.div 
                className="flex flex-col justify-center space-y-8 lg:col-span-2"
                initial={{opacity: 0, x: -50}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{ once: true, amount: 0.5 }}
                transition={{duration: 0.5}}
              >
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">{contactContent.info.title}</h2>
                  <p className="text-muted-foreground">{contactContent.info.description}</p>
                </div>
                <div className="space-y-6">
                  {[
                    { icon: Mail, label: 'Email', value: contactContent.info.email, href: `mailto:${contactContent.info.email}` },
                    { icon: Phone, label: 'Phone', value: contactContent.info.phone, href: `tel:${contactContent.info.phone}` },
                    { icon: MapPin, label: 'Address', value: contactContent.info.address },
                  ].map((item, index) => (
                    <a 
                      key={index}
                      href={item.href}
                      className="group flex items-start gap-4 p-4 rounded-lg border border-transparent hover:border-primary/50 hover:bg-accent transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <item.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</h3>
                        <p className="text-muted-foreground">{item.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div 
                className="lg:col-span-3"
                initial={{opacity: 0, x: 50}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{ once: true, amount: 0.5 }}
                transition={{duration: 0.5}}
              >
                <Card className="shadow-lg border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-3xl font-bold">{contactContent.form.title}</CardTitle>
                    <CardDescription>{contactContent.form.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form ref={formRef} action={formAction} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">{contactContent.form.namePlaceholder}</Label>
                          <Input id="name" name="name" placeholder={contactContent.form.namePlaceholder} className="hover:border-primary/50 transition-colors" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{contactContent.form.emailPlaceholder}</Label>
                          <Input id="email" name="email" type="email" placeholder={contactContent.form.emailPlaceholder} className="hover:border-primary/50 transition-colors" required/>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">{contactContent.form.subjectPlaceholder}</Label>
                        <Input id="subject" name="subject" placeholder={contactContent.form.subjectPlaceholder} className="hover:border-primary/50 transition-colors" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">{contactContent.form.messagePlaceholder}</Label>
                        <Textarea id="message" name="message" placeholder={contactContent.form.messagePlaceholder} className="min-h-[150px] hover:border-primary/50 transition-colors" required />
                      </div>
                      <Button type="submit" size="lg" className="w-full transition-transform transform hover:scale-105" disabled={isPending}>
                        <Send className="mr-2 h-5 w-5" />
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
