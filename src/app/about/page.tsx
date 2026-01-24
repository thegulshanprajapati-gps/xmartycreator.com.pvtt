'use client';

import { useEffect, useState } from 'react';
import { Linkedin, Twitter, Instagram, Youtube, Zap, Lightbulb, Heart, Rocket } from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { Card, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const slideInFromLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function AboutPage() {
  const [aboutContent, setAboutContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await fetch('/api/pages/about');
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();
        setAboutContent(data);
      } catch (err) {
        console.error('Error fetching about content:', err);
        setError('Failed to load content');
        // Set default content on error
        setAboutContent({
          hero: { title: 'About Us', description: '', imageId: '' },
          story: { title: 'Our Story', paragraphs: [] },
          values: { title: 'Core Values', description: '', items: [] },
          founder: { title: 'Founder', description: '', name: '', role: '', bio: '', socials: { linkedin: '', twitter: '', instagram: '', youtube: '' } }
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAbout();
  }, []);

  if (isLoading) {
    return <div className="p-10 text-center text-xl min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error && !aboutContent) {
    return <div className="p-10 text-center text-xl min-h-screen flex items-center justify-center text-destructive">{error}</div>;
  }

  const founder = aboutContent.founder;
  const heroImage = PlaceHolderImages.find(
    (img: any) => img.id === aboutContent.hero.imageId
  );

  const valueIcons = [
    <Zap key="1" className="h-8 w-8 text-primary" />,
    <Lightbulb key="2" className="h-8 w-8 text-primary" />,
    <Heart key="3" className="h-8 w-8 text-primary" />,
    <Rocket key="4" className="h-8 w-8 text-primary" />
  ];

  return (
    <>
      <div className="flex flex-col bg-background text-foreground">

        {/* HERO */}
        <section className="w-full bg-accent/20">
          <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-12">
            <motion.div variants={slideInFromLeft} initial="hidden" animate="visible">
              <h1 className="text-5xl font-bold">{aboutContent.hero.title}</h1>
              <p className="mt-4 text-muted-foreground">
                {aboutContent.hero.description}
              </p>
            </motion.div>

            {heroImage && (
              <motion.div variants={slideInFromRight} initial="hidden" animate="visible">
                <div className="relative h-80 rounded-lg overflow-hidden">
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* VALUES */}
        <motion.section
          className="py-24 bg-accent/30"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center">
              {aboutContent.values.title}
            </h2>
            <p className="text-center mt-4 text-muted-foreground">
              {aboutContent.values.description}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              {aboutContent.values.items.map(
                (value: any, index: number) => (
                  <div key={index} className="text-center p-6 rounded-lg bg-card">
                    <div className="mb-4 flex justify-center">
                      {valueIcons[index]}
                    </div>
                    <h3 className="text-xl font-bold">{value.title}</h3>
                    <p className="text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.section>

        {/* FOUNDER */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">
              {founder.title}
            </h2>

            <Card className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3">
                <div className="p-8 text-center bg-muted/40">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarFallback className="text-4xl">
                      {founder.name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('') || 'FD'}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{founder.name || 'Founder Name'}</CardTitle>
                  <p className="text-primary">{founder.role || 'Role'}</p>
                </div>

                <div className="md:col-span-2 p-8">
                  <p className="mb-6 text-muted-foreground">
                    {founder.bio}
                  </p>

                  <div className="flex gap-4">
                    {founder.socials?.linkedin && (
                      <a href={founder.socials.linkedin}><Linkedin /></a>
                    )}
                    {founder.socials?.twitter && (
                      <a href={founder.socials.twitter}><Twitter /></a>
                    )}
                    {founder.socials?.instagram && (
                      <a href={founder.socials.instagram}><Instagram /></a>
                    )}
                    {founder.socials?.youtube && (
                      <a href={founder.socials.youtube}><Youtube /></a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
