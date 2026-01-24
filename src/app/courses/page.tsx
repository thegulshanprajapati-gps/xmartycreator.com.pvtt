
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { BookOpen, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Course } from '@/lib/courses';

const slideInFromLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const cardIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <>
    <div className="flex flex-col bg-background">
      <section 
        className="w-full py-12 md:py-20 bg-gradient-to-b from-background via-red-950/20 to-background overflow-hidden relative"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="flex flex-col items-start text-left max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={slideInFromLeft}
          >
              <div className="inline-block bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 p-3 rounded-full w-fit mb-6 backdrop-blur-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl bg-gradient-to-r from-red-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                Our Courses
              </h1>
              <p className="text-muted-foreground md:text-xl mt-6 leading-relaxed">
                Your journey to mastery starts here.
              </p>
               <p className="text-muted-foreground md:text-lg mt-4 leading-relaxed">
                Whether you're starting from scratch or looking to advance your skills, our curated courses provide the knowledge and hands-on experience you need to thrive in the digital world.
              </p>
              <p className="text-slate-300 md:text-lg mt-4 leading-relaxed font-medium">
                Master new skills with our expert-led courses
              </p>
          </motion.div>
        </div>
      </section>

      <motion.section 
        className="w-full pb-20 md:pb-32 pt-20 md:pt-32 bg-gradient-to-b from-background via-slate-900/30 to-background relative"
        variants={staggerContainer}
        initial="visible"
        animate="visible"
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                 <motion.div 
                      key={course._id || course.id} 
                      className="relative group overflow-hidden rounded-2xl shadow-xl h-80 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                      variants={cardIn}
                      whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.2)" }}
                  >
                    <Image
                        src={course.coverImage}
                        alt={course.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Premium badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      {course.level}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/60 to-transparent transition-all duration-300 group-hover:from-black/100 group-hover:via-black/80"></div>
                    
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="transform transition-all duration-500 ease-in-out group-hover:-translate-y-28">
                          <h3 className="font-headline text-2xl font-bold text-white drop-shadow-lg mb-2">{course.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-purple-300">
                            <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                            <span>{course.duration}</span>
                          </div>
                        </div>
                        
                        <div className="opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-48 transition-all duration-500 ease-in-out pt-4 space-y-4">
                            <p className="text-sm text-white/90 drop-shadow leading-relaxed">{course.shortDescription}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex text-yellow-400 text-sm">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-current" />
                                  ))}
                                </div>
                                <span className="text-xs text-white/70">({course.reviews || course.studentsEnrolled || 0})</span>
                              </div>
                              <span className="text-xs text-blue-300 font-semibold">${course.price}</span>
                            </div>
                            <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
                                <Link href={`/courses/${course.slug}`}>Explore Course →</Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No courses available</p>
            </div>
          )}
        </div>
      </motion.section>
    </div>
    <Footer />
    </>
  );
}
