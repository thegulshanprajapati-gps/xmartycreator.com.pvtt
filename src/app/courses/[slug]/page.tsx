'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function CoursePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [enrollCount, setEnrollCount] = useState(0);
  const [shareTooltip, setShareTooltip] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses?slug=${slug}`);
        if (res.ok) {
          const courses = await res.json();
          const foundCourse = Array.isArray(courses) 
            ? courses.find((c: Course) => c.slug === slug)
            : courses;
          setCourse(foundCourse);
          
          if (foundCourse?._id) {
            // Initialize from database values first
            setShareCount(foundCourse?.shareCount || 0);
            setViewCount(foundCourse?.viewsCount || 0);
            setEnrollCount(foundCourse?.enrollClickCount || 0);
            
            // Track page view
            const viewRes = await fetch(`/api/courses/${foundCourse._id}/view`, { method: 'POST' }).catch(() => null);
            if (viewRes?.ok) {
              const { viewsCount } = await viewRes.json();
              setViewCount(viewsCount || 0);
            }
            
            const shareRes = await fetch(`/api/courses/${foundCourse._id}/share`);
            if (shareRes.ok) {
              const { shareCount } = await shareRes.json();
              setShareCount(shareCount || 0);
            }

            const enrollRes = await fetch(`/api/courses/${foundCourse._id}/enroll-click`);
            if (enrollRes.ok) {
              const { enrollClickCount } = await enrollRes.json();
              setEnrollCount(enrollClickCount || 0);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCourse();
    }
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
        await fetch(`/api/courses/${course._id}/share`, { method: 'POST' });
        const res = await fetch(`/api/courses/${course._id}/enroll-click`, { method: 'POST' });
        if (res.ok) {
          const { enrollClickCount } = await res.json();
          setEnrollCount(enrollClickCount || 0);
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
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${discountedPrice}</span>
                        {discount > 0 && (
                          <>
                            <span className="text-lg text-white/50 line-through font-medium">${course.price}</span>
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">{discount}% OFF</span>
                          </>
                        )}
                        {course.originalPrice && discount === 0 && (
                          <span className="text-lg text-white/50 line-through font-medium">${course.originalPrice}</span>
                        )}
                      </div>
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
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* About */}
              <div className="md:col-span-2 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <h2 className="text-3xl font-bold">About This Course</h2>
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
                  <h2 className="text-3xl font-bold">What You'll Learn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.whatYouLearn.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Curriculum */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-4"
                >
                  <h2 className="text-3xl font-bold">Course Curriculum</h2>
                  <div className="space-y-3">
                    {course.curriculum.map((module) => (
                      <Card
                        key={module.moduleId}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() =>
                          setExpandedModule(
                            expandedModule === module.moduleId ? null : module.moduleId
                          )
                        }
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{module.moduleName}</CardTitle>
                              <CardDescription>
                                {module.lessons.length} lessons
                              </CardDescription>
                            </div>
                            {expandedModule === module.moduleId ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>
                        </CardHeader>
                        {expandedModule === module.moduleId && (
                          <CardContent className="space-y-2 border-t pt-4">
                            {module.lessons.map((lesson) => (
                              <div key={lesson.lessonId} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                                <span className="text-sm">{lesson.title}</span>
                                <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                              </div>
                            ))}
                          </CardContent>
                        )}
                      </Card>
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
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Includes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {course.features.map((feature, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
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
          <section className="w-full py-16 md:py-24 bg-muted/50">
            <div className="container mx-auto px-4 md:px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Your Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      <Image
                        src={course.instructor.image || 'https://picsum.photos/seed/default-instructor/120/120'}
                        alt={course.instructor.name || 'Instructor'}
                        width={120}
                        height={120}
                        className="rounded-full"
                      />
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">{course.instructor.name || 'Instructor'}</h3>
                        <p className="text-sm font-semibold text-primary">{course.instructor.title || 'Expert'}</p>
                        <p className="text-muted-foreground">{course.instructor.bio || 'Professional instructor with extensive experience'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Get Started?</h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of students learning {course.title}. Start your journey today!
              </p>
              <Button className="bg-white text-blue-600 hover:bg-white/90 font-bold text-lg h-12 px-8">
                Enroll Now - ${course.price}
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
