'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseCard from './course-card';
import CourseCardSkeleton from './course-card-skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, Sparkles, BookOpen, SlidersHorizontal } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  instructor: string | { name: string; title?: string; bio?: string; image?: string };
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  originalPrice?: number;
  discount?: number;
  duration: number;
  students: number;
  rating: number;
  reviews: number;
  tags?: string[];
  featured?: boolean;
}

export default function CourseListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [selectedLevel, setSelectedLevel] = useState<string>(
    searchParams?.get('level') || 'all'
  );
  const [priceRange, setPriceRange] = useState<string>(searchParams?.get('price') || 'all');
  const [sortBy, setSortBy] = useState<string>(searchParams?.get('sort') || 'featured');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Map MongoDB course to UI course format
  const mapCourse = (dbCourse: any): Course => {
    // Extract numeric duration from string like "12 weeks"
    const durationNum = typeof dbCourse.duration === 'string' 
      ? parseInt(dbCourse.duration.match(/\d+/)?.[0] || '0') 
      : parseInt(dbCourse.duration) || 0;
    
    const price = Number(dbCourse.price) || 0;
    const originalPrice = Number(dbCourse.originalPrice) || undefined;
    const discount = Number(dbCourse.discount) || 0;
    
    return {
      _id: dbCourse._id || dbCourse.id || '',
      title: dbCourse.title || '',
      slug: dbCourse.slug || '',
      description: dbCourse.shortDescription || dbCourse.description || '',
      coverImage: dbCourse.coverImage,
      instructor: dbCourse.instructor || dbCourse.instructorName || 'Instructor',
      level: (dbCourse.level?.toLowerCase() || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
      price,
      // Store originalPrice only when it's explicitly higher; UI will use price as base for discounts.
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      discount,
      duration: durationNum,
      students: dbCourse.studentsEnrolled || dbCourse.studentsCount || 0,
      rating: dbCourse.rating || 0,
      reviews: dbCourse.reviews || 0,
      tags: dbCourse.tags || [],
      featured: dbCourse.featured || false,
    };
  };

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/courses?limit=100', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const courseList = Array.isArray(data) 
            ? data.map(mapCourse) 
            : [];
          setCourses(courseList);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter and sort courses
  useEffect(() => {
    let filtered = courses;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) => {
          const instructorName = typeof course.instructor === 'string' ? course.instructor : course.instructor?.name || '';
          return (
            course.title.toLowerCase().includes(query) ||
            course.description.toLowerCase().includes(query) ||
            instructorName.toLowerCase().includes(query)
          );
        }
      );
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    // Price filter
    if (priceRange !== 'all') {
      filtered = filtered.filter((course) => {
        if (priceRange === 'free') return course.price === 0;
        if (priceRange === 'paid') return course.price > 0;
        if (priceRange === '0-50') return course.price > 0 && course.price <= 50;
        if (priceRange === '50-100') return course.price > 50 && course.price <= 100;
        if (priceRange === '100+') return course.price > 100;
        return true;
      });
    }

    // Sorting
    filtered = filtered.sort((a, b) => {
      if (sortBy === 'featured')
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'students') return b.students - a.students;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

    setFilteredCourses(filtered);
    setPage(1);

    // Update URL
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedLevel !== 'all') params.set('level', selectedLevel);
    if (priceRange !== 'all') params.set('price', priceRange);
    if (sortBy !== 'featured') params.set('sort', sortBy);
    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.push(`/courses${newURL}`, { shallow: true } as any);
  }, [searchQuery, selectedLevel, priceRange, sortBy, courses, router]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setPriceRange('all');
    setSortBy('featured');
  };

  const paginatedCourses = filteredCourses.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const hasFilter =
    searchQuery || selectedLevel !== 'all' || priceRange !== 'all';
  const scrollToFilters = () => {
    document?.getElementById('course-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToGrid = () => {
    document?.getElementById('course-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-100/60 dark:border-slate-800/60 bg-gradient-to-r from-blue-600/15 via-purple-600/10 to-cyan-500/10 px-6 py-12 sm:px-12 shadow-[0_25px_80px_-60px_rgba(59,130,246,0.8)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute right-6 top-0 h-52 w-52 rounded-full bg-purple-400/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/70 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-200 border border-white/60 dark:border-slate-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Curated learning paths & fresh drops
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
            Learn & Master Skills with Confidence
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            High-quality courses from expert instructors, designed to match the sleek feel of the home page.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button size="lg" className="gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={scrollToGrid}>
              <BookOpen className="h-4 w-4" />
              Browse all courses
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-2 bg-white/70 dark:bg-slate-900/60" onClick={scrollToFilters}>
              <SlidersHorizontal className="h-4 w-4" />
              Advanced filters
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Filters Section */}
      <div
        id="course-filters"
        className="space-y-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-[0_20px_60px_-48px_rgba(59,130,246,0.9)] p-6 md:p-8"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500" />
          <Input
            placeholder="Search courses, topics or instructors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 focus-visible:ring-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Level</label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Price</label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70">
                <SelectValue placeholder="All prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="0-50">$0 - $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="100+">$100+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="students">Most Popular</SelectItem>
                <SelectItem value="price-low">Lowest Price</SelectItem>
                <SelectItem value="price-high">Highest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant={hasFilter ? 'outline' : 'secondary'}
              onClick={clearFilters}
              className="w-full h-11 border-2"
            >
              {hasFilter ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-1" />
                  All filters
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800">
          {courses.length} total courses
        </Badge>
        {filteredCourses.length === 0 ? (
          <span className="text-muted-foreground">No courses match your filters.</span>
        ) : (
          <span>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{paginatedCourses.length}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{filteredCourses.length}</span> courses
          </span>
        )}
      </div>

      {/* Courses Grid */}
      <div id="course-grid">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedCourses.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60">
          <p className="text-lg text-slate-700 dark:text-slate-200">No courses yet</p>
          <p className="text-sm text-muted-foreground">Try clearing filters or check back soon.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {paginatedCourses.map((course, i) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <CourseCard {...course} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="text-muted-foreground">...</span>}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
