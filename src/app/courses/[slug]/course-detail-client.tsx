'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LargePrice, Money } from '@/components/currency/price';
import { Footer } from '@/components/layout/footer';
import { 
  Star, 
  Clock, 
  BarChart, 
  Users, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Share2,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Course } from '@/lib/courses';

type CourseDetailClientProps = {
  slug: string;
  initialCourse: Course | null;
};

export default function CourseDetailClient({ slug, initialCourse }: CourseDetailClientProps) {
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [loading, setLoading] = useState(!initialCourse);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState(initialCourse?.shareCount || 0);
  const [viewCount, setViewCount] = useState(initialCourse?.viewsCount || 0);
  const [enrollCount, setEnrollCount] = useState(initialCourse?.enrollClickCount || 0);

  useEffect(() => {
    let cancelled = false;

    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses?slug=${slug}`, { cache: 'no-store' });
        if (res.ok) {
          const courses = await res.json();
          const foundCourse = Array.isArray(courses) 
            ? courses.find((c: Course) => c.slug === slug)
            : courses;
          if (!cancelled) {
            setCourse(foundCourse);
          }
          
          if (foundCourse?._id) {
            // Initialize from database values first
            if (!cancelled) {
              setShareCount(foundCourse?.shareCount || 0);
              setViewCount(foundCourse?.viewsCount || 0);
              setEnrollCount(foundCourse?.enrollClickCount || 0);
            }
            
            // Track page view
            const viewRes = await fetch(`/api/courses/${foundCourse._id}/view`, { method: 'POST' }).catch(() => null);
            if (viewRes?.ok) {
              const { viewsCount } = await viewRes.json();
              if (!cancelled) {
                setViewCount(viewsCount || 0);
              }
            }
            
            const shareRes = await fetch(`/api/courses/${foundCourse._id}/share`);
            if (shareRes.ok) {
              const { shareCount } = await shareRes.json();
              if (!cancelled) {
                setShareCount(shareCount || 0);
              }
            }

            const enrollRes = await fetch(`/api/courses/${foundCourse._id}/enroll-click`);
            if (enrollRes.ok) {
              const { enrollClickCount } = await enrollRes.json();
              if (!cancelled) {
                setEnrollCount(enrollClickCount || 0);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchCourse();
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      let shared = false;
      if (navigator.share) {
        try {
          await navigator.share({
            title: course.title,
            text: course.shortDescription,
            url: window.location.href,
          });
          shared = true;
        } catch (error: unknown) {
          // User cancelled share - don't treat as error
          return;
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
        shared = true;
      }

      if (shared && course._id) {
        // Increment share count
        const shareRes = await fetch(`/api/courses/${course._id}/share`, { method: 'POST' });
        if (shareRes.ok) {
          const { shareCount: updatedShares } = await shareRes.json();
          setShareCount(updatedShares || 0);
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEnrollClick = async () => {
    if (course._id && course.enrollRedirectUrl) {
      try {
        await fetch(`/api/courses/${course._id}/enroll-click`, { method: 'POST' });
      } catch (error) {
        console.error('Error tracking enroll:', error);
      }
      window.open(course.enrollRedirectUrl, '_blank');
    }
  };

  const discount = course.originalPrice ? Math.round((1 - course.price / course.originalPrice) * 100) : (course.discount || 0);
  const discountedPrice = course.discount ? Math.round(course.price * (1 - course.discount / 100)) : course.price;
  const enrolledCount = course.studentsEnrolled || course.reviews || 0;

  return (
    <>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="w-full relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-full blur-3xl dark:from-blue-500/30 dark:to-blue-600/20" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-full blur-3xl dark:from-purple-500/30 dark:to-purple-600/20" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left - Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2 space-y-6"
              >
                <div className="space-y-3">
                  <Badge className="bg-blue-500/25 text-blue-300 hover:bg-blue-500/35 dark:bg-blue-500/40 dark:text-blue-200 dark:hover:bg-blue-500/50 border-blue-400/30 dark:border-blue-400/50">
                    {course.level}
                  </Badge>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white to-white/80 dark:from-white dark:to-white/90 bg-clip-text text-transparent leading-tight">
                    {course.title}
                  </h1>
                </div>

                <p className="text-xl text-white/85 dark:text-white/80 leading-relaxed max-w-2xl">{course.shortDescription}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex text-yellow-400 gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                    <div>
                      <span className="text-white font-bold text-lg">{course.rating}</span>
                      <span className="text-white/60 text-sm ml-1">({enrolledCount.toLocaleString()} reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 dark:text-white/75 text-sm">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{enrolledCount.toLocaleString()} students enrolled</span>
                  </div>
                </div>

                {/* Instructor */}
                {course.instructor && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 pt-2 backdrop-blur-sm bg-white/5 dark:bg-white/10 rounded-lg p-4 border border-white/10 dark:border-white/20"
                  >
                    <Image
                      src={course.instructor.image || 'https://picsum.photos/seed/default-instructor/56/56'}
                      alt={course.instructor.name || 'Instructor'}
                      width={56}
                      height={56}
                      className="rounded-full ring-2 ring-blue-400/30"
                    />
                    <div>
                      <p className="font-semibold text-white text-base">{course.instructor.name || 'Instructor'}</p>
                      <p className="text-sm text-white/60">{course.instructor.title || 'Expert Instructor'}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Right - Call to Action Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative lg:sticky lg:top-4"
              >
                <div className="relative backdrop-blur-xl bg-white/10 dark:bg-slate-900/40 border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 shadow-2xl space-y-6 overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    {/* Cover Image */}
                    <div className="relative h-56 rounded-xl overflow-hidden ring-1 ring-white/20 dark:ring-slate-700/50 shadow-lg">
                      <Image
                        src={course.coverImage || 'https://picsum.photos/seed/default-course/600/400'}
                        alt={course.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {discount > 0 && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                    </div>

                    {/* Price Section */}
                    <div className="space-y-3 pt-4">
                      <LargePrice
                        value={discountedPrice}
                        originalValue={course.originalPrice || (discount > 0 ? course.price : undefined)}
                        discount={discount}
                        showDiscount={true}
                        valueClassName="text-4xl font-bold text-white"
                        symbolClassName="text-4xl font-bold text-white"
                      />
                      <p className="text-sm text-white/60">Perfect for professionals</p>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3 pt-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          onClick={handleEnrollClick}
                          className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 text-white font-bold h-14 text-base shadow-lg hover:shadow-xl transition-all"
                        >
                          Enroll Now
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full border-white/20 hover:bg-white/10 dark:text-white dark:hover:text-white text-foreground hover:text-foreground font-semibold h-12"
                          onClick={handleShare}
                        >
                          <Share2 className="h-5 w-5 mr-2" />
                          Share Course ({shareCount})
                        </Button>
                      </motion.div>
                    </div>

                    {/* Course Info Details */}
                    <div className="space-y-2 pt-4 mt-4 border-t border-white/10 dark:border-slate-700/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Duration
                        </span>
                        <span className="text-white font-semibold">{course.duration}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70 flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Level
                        </span>
                        <span className="text-white font-semibold">{course.level}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Learners
                        </span>
                        <span className="text-white font-semibold">{enrolledCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Views
                        </span>
                        <span className="text-white font-semibold">{viewCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70 flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4" />
                          Enroll Clicks
                        </span>
                        <span className="text-white font-semibold">{enrollCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About & Features */}
        <section className="w-full py-20 md:py-28 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/30 dark:to-background" />
          
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl opacity-30" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* About */}
              <div className="md:col-span-2 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">About This Course</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {course.fullDescription}
                  </p>
                </motion.div>

                {/* What You'll Learn */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-4"
                >
                  <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">What You'll Learn</h2>
                  <div className="group">
                    <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                      {/* Background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                      
                      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.whatYouLearn.map((item, index) => (
                          <motion.div 
                            key={index} 
                            className="flex gap-3 items-start"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Curriculum */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-4"
                >
                  <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">Course Curriculum</h2>
                  <div className="space-y-3">
                    {course.curriculum.map((module, moduleIndex) => (
                      <motion.div
                        key={module.moduleId}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: moduleIndex * 0.1 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card
                          className="cursor-pointer border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 bg-white dark:bg-slate-800/50 transition-all duration-300 hover:shadow-lg"
                          onClick={() =>
                            setExpandedModule(
                              expandedModule === module.moduleId ? null : module.moduleId
                            )
                          }
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-xl font-bold tracking-tight">{module.moduleName}</CardTitle>
                                <CardDescription>
                                  {module.lessons.length} lessons
                                </CardDescription>
                              </div>
                              {expandedModule === module.moduleId ? (
                                <ChevronUp className="h-5 w-5 text-primary" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                          {expandedModule === module.moduleId && (
                            <CardContent className="space-y-2 border-t pt-4">
                              {module.lessons.map((lesson) => (
                                <motion.div
                                  key={lesson.lessonId}
                                  className="flex items-center justify-between p-3 hover:bg-primary/5 rounded-lg transition-colors duration-200"
                                  whileHover={{ x: 4 }}
                                >
                                  <span className="text-sm text-foreground">{lesson.title}</span>
                                  <span className="text-xs text-muted-foreground font-medium">{lesson.duration}</span>
                                </motion.div>
                              ))}
                            </CardContent>
                          )}
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Features Sidebar */}
              <div className="md:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 bg-white dark:bg-slate-800/50 sticky top-24 transition-all duration-300 hover:shadow-lg">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />
                    
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl font-bold">Course Includes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {course.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          className="flex gap-3 items-start"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        {course.instructor && (
          <motion.section 
            className="w-full py-20 md:py-28 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-background to-slate-50 dark:to-slate-900/30" />
            
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto group"
                whileHover={{ y: -8 }}
              >
                <Card className="border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 bg-white dark:bg-slate-800/50 transition-all duration-300 hover:shadow-lg">
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
                  
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl font-bold">Your Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Image
                          src={course.instructor.image || 'https://picsum.photos/seed/default-instructor/120/120'}
                          alt={course.instructor.name || 'Instructor'}
                          width={120}
                          height={120}
                          className="rounded-full ring-2 ring-primary/20"
                        />
                      </motion.div>
                      <div className="space-y-2">
                        <h3 className="font-headline text-xl font-bold leading-tight">{course.instructor.name || 'Instructor'}</h3>
                        <p className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{course.instructor.title || 'Expert'}</p>
                        <p className="text-muted-foreground leading-relaxed">{course.instructor.bio || 'Professional instructor with extensive experience'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* CTA Section */}
        <motion.section 
          className="w-full py-20 md:py-28 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-slate-50 dark:to-slate-900/50" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 md:p-16 text-center border-2 border-blue-400/30 shadow-2xl space-y-6"
            >
              <h2 className="font-headline text-3xl lg:text-5xl font-bold text-white leading-tight">
                Ready to Transform Your Skills?
              </h2>
              
              <p className="max-w-[600px] text-lg text-blue-50 mx-auto leading-relaxed">
                Join thousands of students learning {course.title}. Start your journey to success today!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleEnrollClick}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg h-12 px-10 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <span>Enroll Now -</span>
                    <Money
                      value={course.price}
                      size="md"
                      className="text-blue-600"
                      symbolClassName="text-blue-600"
                      valueClassName="text-blue-600"
                    />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleShare}
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold text-base h-12 px-10"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share Course
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>
      <Footer />
    </>
  );
}
