
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Users } from 'lucide-react';
import { WhatsAppIcon, TelegramIcon } from '@/components/icons';
import { trackLinkClick } from '@/app/analytics/actions';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import type { SVGProps } from 'react';
import { useState, useEffect } from 'react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

type CommunityContent = {
  hero: {
    title: string;
    description: string;
  };
  youtube: {
    videoId: string;
  };
  whatsapp: {
    title: string;
    description: string;
    link: string;
    buttonText: string;
  };
  app: {
    title: string;
    description: string;
    link: string;
    buttonText: string;
  };
  telegram: {
    title: string;
    description: string;
    link: string;
    buttonText: string;
  };
};

function CommunityIllustration(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 500 350"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <g fill="none" fillRule="evenodd">
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            d="M175 250l75-150"
            className="stroke-destructive/50"
            strokeWidth="3"
            strokeDasharray="5, 5"
          />
           <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.7 }}
            d="M325 250l-75-150"
            className="stroke-destructive/50"
            strokeWidth="3"
            strokeDasharray="5, 5"
          />
           <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.9 }}
            d="M190 250h120"
            className="stroke-destructive/50"
            strokeWidth="3"
            strokeDasharray="5, 5"
          />
          <motion.g
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <circle className="stroke-primary" strokeWidth="3" cx="250" cy="100" r="40" />
            <circle className="fill-primary" cx="250" cy="100" r="15" />
          </motion.g>
          <motion.g
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.4 }}
          >
            <circle className="stroke-primary" strokeWidth="3" cx="150" cy="250" r="40" />
            <circle className="fill-primary" cx="150" cy="250" r="15" />
          </motion.g>
          <motion.g
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <circle className="stroke-primary" strokeWidth="3" cx="350" cy="250" r="40" />
            <circle className="fill-primary" cx="350" cy="250" r="15" />
          </motion.g>
        </g>
      </svg>
    )
}

export default function CommunityPage() {
  const [communityContent, setCommunityContent] = useState<CommunityContent>({
    hero: { title: 'Community', description: 'Join our community' },
    youtube: { videoId: '' },
    whatsapp: { title: 'WhatsApp', description: '', link: '#', buttonText: 'Join' },
    app: { title: 'App', description: '', link: '#', buttonText: 'Download' },
    telegram: { title: 'Telegram', description: '', link: '#', buttonText: 'Join' }
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/community');
        if (res.ok) {
          const data = await res.json();
          setCommunityContent(data);
        }
      } catch (error) {
        console.error('Error fetching community content:', error);
      }
    };

    fetchContent();
  }, []);

  const videoId = communityContent.youtube.videoId;

  const communityPlatforms = [
    {
      ...communityContent.whatsapp,
      icon: <WhatsAppIcon className="h-8 w-8 text-green-600" />,
      trackId: 'WhatsApp',
      bgColor: 'bg-green-100/50 dark:bg-green-900/20',
      iconBg: 'bg-green-200 dark:bg-green-800/50'
    },
    {
      ...communityContent.app,
      icon: <Download className="h-8 w-8 text-blue-600" />,
      trackId: 'App-Download',
      bgColor: 'bg-blue-100/50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-200 dark:bg-blue-800/50'
    },
    {
      ...communityContent.telegram,
      icon: <TelegramIcon className="h-8 w-8 text-sky-500" />,
      trackId: 'Telegram',
      bgColor: 'bg-sky-100/50 dark:bg-sky-900/20',
      iconBg: 'bg-sky-200 dark:bg-sky-800/50'
    },
  ]

  return (
    <>
      <div className="flex flex-col bg-background">
        <section 
          className="w-full py-12 md:py-20 bg-accent/20"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={fadeIn}
                >
                <div className="inline-block bg-primary/10 text-primary p-2 rounded-full w-fit mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl text-destructive dark:text-foreground">
                  {communityContent.hero.title}
                </h1>
                <p className="max-w-2xl mt-4 text-muted-foreground md:text-xl">
                  {communityContent.hero.description}
                </p>
              </motion.div>
              <motion.div
                className="hidden md:flex justify-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeIn}
              >
                  <CommunityIllustration className="w-full h-auto max-w-lg" />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="relative w-full overflow-hidden rounded-lg shadow-2xl" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full border-0"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>

         <section className="w-full py-12 md:py-20 bg-accent/50">
          <div className="container mx-auto px-4 md:px-6">
              <motion.div 
                className="text-center mb-16"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeIn}
              >
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Join Our Communities</h2>
                  <p className="max-w-2xl mx-auto mt-4 text-muted-foreground md:text-xl">Connect with us on your favorite platform.</p>
              </motion.div>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                  {communityPlatforms.map((platform, index) => (
                    <motion.div key={index} variants={fadeIn}>
                      <Card className={`text-center h-full flex flex-col justify-between overflow-hidden transition-all duration-300 transform hover:shadow-2xl hover:-translate-y-2 ${platform.bgColor}`}>
                          <CardHeader className="items-center">
                              <div className={`mb-4 rounded-full p-4 ${platform.iconBg}`}>
                                {platform.icon}
                              </div>
                              <CardTitle className="font-headline text-xl">{platform.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <p className="text-muted-foreground">{platform.description}</p>
                          </CardContent>
                           <CardDescription className="p-6">
                              <Button asChild onClick={() => trackLinkClick(platform.trackId)} className="w-full">
                                  <Link href={platform.link}>{platform.buttonText}</Link>
                              </Button>
                          </CardDescription>
                      </Card>
                    </motion.div>
                  ))}
              </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
