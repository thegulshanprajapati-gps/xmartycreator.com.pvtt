
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Video, Award, ArrowDownCircle, ArrowRight, Laptop, MessageCircleQuestion, Milestone } from 'lucide-react';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useState, useEffect, useRef } from 'react';
import { trackLinkClick } from '@/app/analytics/actions';
import { Footer } from '@/components/layout/footer';
import { HeroVisual } from '@/components/hero-visual';
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";

export type Review = {
    name: string;
    role: string;
    testimonial: string;
    rating: number;
    avatar: string;
};

type HomeContent = {
    hero: {
        title: string;
        description: string;
        buttons: {
            primary: { text: string; link: string };
            secondary: { text: string; link: string };
        };
    };
    featuredCourses: {
        title: string;
        description: string;
        courses: { title: string; description: string; imageId: string }[];
    };
    whyChooseUs: {
        title: string;
        description: string;
        features: { title: string; description: string }[];
    };
    testimonials: {
        title: string;
        description: string;
        reviews: Review[];
    };
}

interface HomePageClientProps {
  initialHomeContent: HomeContent;
}

const slideInFromLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};


const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, count, value]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [rounded]);


  return (
    <p
      ref={ref}
      className="text-4xl font-bold text-foreground"
    >
      {displayValue.toLocaleString()}{suffix}
    </p>
  );
};

export default function HomePageClient({ initialHomeContent }: HomePageClientProps) {

  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');

  const featuredCourses = initialHomeContent.featuredCourses.courses.map(course => ({
      ...course,
      image: PlaceHolderImages.find((img) => img.id === course.imageId),
      link: '/courses',
  }));

  // Debug logging
  useEffect(() => {
    console.log('🎓 [Home Page Client] Featured Courses:', {
      total: featuredCourses.length,
      courses: featuredCourses.map(c => ({ title: c.title, imageId: c.imageId }))
    });
  }, [featuredCourses]);

  const whyChooseUs = initialHomeContent.whyChooseUs.features.map((feature, index) => {
    const icons = [<Laptop className="h-8 w-8 text-primary" />, <MessageCircleQuestion className="h-8 w-8 text-primary" />, <Milestone className="h-8 w-8 text-primary" />, <Award className="h-8 w-8 text-primary" />];
    return {
      ...feature,
      icon: icons[index]
    }
  });
  
  const initialReviews = initialHomeContent.testimonials.reviews.map(r => ({...r, avatar: r.avatar || `https://api.dicebear.com/8.x/adventurer/svg?seed=${r.name.replace(/\s/g, '')}`}));
  const [testimonials, setTestimonials] = useState<Review[]>(initialReviews);


  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };
  
  const achievements = [
    { icon: Users, value: 50000, label: "Happy Students", suffix: "+" },
    { icon: BookOpen, value: 50, label: "Expert Courses", suffix: "+" },
    { icon: Video, value: 1000, label: "Hours of Content", suffix: "+" },
    { icon: Award, value: 20, label: "Awards Won", suffix: "+" },
  ];

  return (
    <>
      
        <div className="flex flex-col">
          {/* Hero Section */}
          <section className="relative w-full min-h-[calc(100vh_-_64px)] md:min-h-[calc(100vh_-_80px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-background/80">
            {/* Mobile background image */}
            <div className="absolute inset-0 md:hidden">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  data-ai-hint={heroImage.imageHint}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            </div>

            {/* Background ambient effect */}
            <div className="absolute inset-0 hidden md:block">
              <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-20" />
            </div>
            
            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                <motion.div
                    className="flex flex-col justify-center space-y-4 text-center items-center mx-auto text-white md:text-inherit md:items-start md:text-left"
                    initial="hidden"
                    animate="visible"
                    variants={slideInFromLeft}
                >
                  <h1 
                    className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                    dangerouslySetInnerHTML={{ __html: initialHomeContent.hero.title || '' }}
                  >
                  </h1>
                  <p className="max-w-[600px] text-gray-200 md:text-muted-foreground md:text-xl">
                    {initialHomeContent.hero.description}
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4 self-center md:flex-row md:self-start">
                    <Button asChild size="lg" onClick={() => trackLinkClick('Hero-Youtube')}>
                      <Link href={initialHomeContent.hero.buttons.primary.link || '#'}>
                        {initialHomeContent.hero.buttons.primary.text}
                      </Link>
                    </Button>
                     <Button asChild size="lg" variant="secondary" className="bg-white/80 text-black hover:bg-white md:bg-secondary md:text-secondary-foreground md:hover:bg-secondary/80" onClick={() => trackLinkClick('Hero-Community')}>
                      <Link href={initialHomeContent.hero.buttons.secondary.link || '#'}>
                        <Users className="mr-2 h-6 w-6" />
                        {initialHomeContent.hero.buttons.secondary.text}
                      </Link>
                    </Button>
                  </div>
                </motion.div>
                <motion.div
                    className="relative hidden md:flex flex-col justify-center items-center h-screen"
                    initial="hidden"
                    animate="visible"
                    variants={slideInFromRight}
                >
                    <HeroVisual />
                </motion.div>
              </div>
            </div>
            <button
              onClick={handleScrollDown}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white md:text-foreground animate-bounce"
              aria-label="Scroll down"
            >
              <ArrowDownCircle className="h-10 w-10" />
            </button>
          </section>

          {/* Featured Courses Section */}
          <motion.section 
            className="w-full py-12 md:py-16 bg-accent/50 border-4 border-red-500"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-destructive dark:text-foreground">
                  Featured Courses (Total: {featuredCourses.length})
                </h2>
                {initialHomeContent.featuredCourses.description && (
                  <p className="max-w-[900px] text-muted-foreground md:text-xl">
                    {initialHomeContent.featuredCourses.description}
                  </p>
                )}
              </div>
              
              {featuredCourses.length > 0 ? (
                featuredCourses.length <= 3 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {featuredCourses.map((course, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-xl shadow-lg h-80 border-2 border-yellow-500">
                        {course.image ? (
                          <Image
                            src={course.image.imageUrl}
                            alt={course.title}
                            data-ai-hint={course.image.imageHint}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">No Image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 group-hover:from-black/90 group-hover:backdrop-blur-sm"></div>
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                          <div className="transform transition-all duration-500 ease-in-out group-hover:-translate-y-24">
                            <h3 className="font-headline text-2xl font-bold text-white">{course.title}</h3>
                          </div>
                          <div className="opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-40 transition-all duration-500 ease-in-out pt-2">
                            <p className="mb-4 text-sm text-white/90">{course.description}</p>
                            <Button asChild variant="secondary">
                              <Link href={course.link}>View Course</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full max-w-5xl mx-auto"
                  >
                    <CarouselContent>
                      {featuredCourses.map((course, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                          <div className="p-1">
                            <div className="relative group overflow-hidden rounded-xl shadow-lg h-80">
                              {course.image ? (
                                <Image
                                  src={course.image.imageUrl}
                                  alt={course.title}
                                  data-ai-hint={course.image.imageHint}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">No Image</div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 group-hover:from-black/90 group-hover:backdrop-blur-sm"></div>
                              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <div className="transform transition-all duration-500 ease-in-out group-hover:-translate-y-24">
                                  <h3 className="font-headline text-2xl font-bold text-white">{course.title}</h3>
                                </div>
                                <div className="opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-40 transition-all duration-500 ease-in-out pt-2">
                                  <p className="mb-4 text-sm text-white/90">{course.description}</p>
                                  <Button asChild variant="secondary">
                                    <Link href={course.link}>View Course</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                )
              ) : (
                <div className="text-center py-12 bg-yellow-100 rounded-lg">
                  <p className="text-lg font-semibold">❌ No courses to display!</p>
                  <p className="text-muted-foreground">Featured courses array is empty</p>
                </div>
              )}

              <div className="mt-12 text-center">
                <Button asChild size="lg">
                  <Link href="/courses">
                    Explore More Courses! <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Achievements Section */}
          <motion.section 
            id="achievements-section" 
            className="w-full py-12 md:py-16 bg-background"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-destructive dark:text-foreground">
                      Our Achievements in Numbers
                  </h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl">
                      We are proud of our community and the milestones we have achieved together.
                  </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {achievements.map((achievement, index) => (
                  <Card key={index} className="flex flex-col items-center justify-center p-6 text-center border-2 border-transparent hover:border-primary hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                       <achievement.icon className="h-10 w-10 text-primary" />
                    </div>
                    <AnimatedCounter value={achievement.value} suffix={achievement.suffix} />
                    <p className="text-muted-foreground mt-2">{achievement.label}</p>
                  </Card>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Why Choose Us Section */}
          {initialHomeContent.whyChooseUs.title && (
          <motion.section 
            className="w-full py-12 md:py-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-destructive dark:text-foreground">
                      {initialHomeContent.whyChooseUs.title}
                  </h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl">
                      {initialHomeContent.whyChooseUs.description}
                  </p>
              </div>
              <div className="mx-auto grid justify-items-center gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-2">
                {whyChooseUs.map((feature, index) => (
                  <div key={index} className="flex flex-col items-center text-center gap-4 p-6 rounded-lg bg-card/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-transparent hover:border-primary">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          {feature.icon}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
          )}

          {/* Testimonials Section */}
          {initialHomeContent.testimonials.title && (
          <motion.section 
            className="w-full py-12 md:py-16 bg-accent/50"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-destructive dark:text-foreground">
                  {initialHomeContent.testimonials.title}
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  {initialHomeContent.testimonials.description}
                </p>
              </div>
              <Carousel
                opts={{
                  align: "start",
                }}
                className="w-full"
              >
                <CarouselContent>
                  {testimonials.map((testimonial, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1 h-full">
                        <Card className="flex flex-col justify-between h-full">
                          <CardContent className="p-6">
                              <p className="text-muted-foreground mb-4">"{testimonial.testimonial}"</p>
                              <div className="flex text-yellow-500 mb-4">
                                {Array.from({ length: testimonial.rating }).map((_, i) => <span key={i}>★</span>)}
                              </div>
                          </CardContent>
                          <CardFooter className="flex items-center gap-4 p-6 bg-card/50">
                              <Avatar>
                                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                  <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                              </div>
                          </CardFooter>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </motion.section>
          )}
        </div>
      <Footer />
    </>
  );
}
