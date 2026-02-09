'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import BlogCard from './blog-card';
import BlogCardSkeleton from './blog-card-skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, Sparkles, ArrowUpRight } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | { url?: string; alt?: string };
  author: string;
  authorImage?: string;
  readTime?: number | string;
  tags?: string[];
  views?: number;
  publishedAt: string;
  status: 'draft' | 'published';
}

interface BlogListClientProps {
  initialBlogs?: BlogPost[];
  initialBlogsLoaded?: boolean;
}

export default function BlogListClient({
  initialBlogs = [],
  initialBlogsLoaded = false,
}: BlogListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [isLoading, setIsLoading] = useState(!initialBlogsLoaded && initialBlogs.length === 0);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams?.get('tags')?.split(',').filter(Boolean) || []
  );
  const [allTags, setAllTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Derive all tags whenever blogs change
  useEffect(() => {
    const tags = new Set<string>();
    blogs.forEach((blog) => blog.tags?.forEach((tag) => tags.add(tag)));
    setAllTags(Array.from(tags).sort());
  }, [blogs]);

  // Fetch Blogs
  useEffect(() => {
    if (initialBlogsLoaded || initialBlogs.length > 0) {
      setIsLoading(false);
      return;
    }

    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/blog?status=published&limit=100');
        if (res.ok) {
          const data = await res.json();
          const blogList = Array.isArray(data) ? data : [];
          setBlogs(blogList);
        } else {
          setBlogs([]);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [initialBlogs.length, initialBlogsLoaded]);

  // Filter blogs by search and tags
  useEffect(() => {
    let filtered = blogs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.excerpt.toLowerCase().includes(query) ||
          blog.author.toLowerCase().includes(query)
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((blog) =>
        selectedTags.some((tag) => blog.tags?.includes(tag))
      );
    }

    setFilteredBlogs(filtered);
    setPage(1);

    // Update URL
    const nextParams = new URLSearchParams();
    if (searchQuery) nextParams.set('q', searchQuery);
    if (selectedTags.length > 0) nextParams.set('tags', selectedTags.join(','));

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams?.toString() || '';
    if (nextQuery !== currentQuery) {
      const targetPath = pathname || '/blog';
      const nextUrl = nextQuery ? `${targetPath}?${nextQuery}` : targetPath;
      router.replace(nextUrl, { scroll: false });
    }
  }, [searchQuery, selectedTags, blogs, router, pathname, searchParams]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const paginatedBlogs = useMemo(
    () => filteredBlogs.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredBlogs, page]
  );
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const hasFilter = searchQuery || selectedTags.length > 0;

  const featured = filteredBlogs[0];
  const featuredCover = featured
    ? (typeof featured.coverImage === 'string'
        ? featured.coverImage
        : (featured.coverImage as any)?.url || (featured.coverImage as any)?.imageUrl)
    : undefined;

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(130deg,#13092f_0%,#171542_34%,#0f1f66_100%)] shadow-[0_40px_120px_-68px_rgba(17,24,77,0.95)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.3),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(129,140,248,0.32),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.2),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/20" />
        <div className="absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -right-16 top-12 h-52 w-52 rounded-full bg-indigo-300/20 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-12"
        >
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-[0_12px_28px_-16px_rgba(125,211,252,0.75)] backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Student Insights
            </div>
            <h1 className="text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl [text-wrap:balance]">
              Blog for Diploma Success
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-200/90 sm:text-base">
              Clear explanations, PYQs, exam updates, and real guidance for better results.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-slate-100 hover:bg-white/15">Guides</Badge>
              <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-slate-100 hover:bg-white/15">Exam Updates</Badge>
              <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-slate-100 hover:bg-white/15">Community</Badge>
            </div>
          </div>

          {/* Featured highlight (first post) */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative block overflow-hidden rounded-2xl border border-white/20 bg-slate-950/35 shadow-[0_28px_80px_-48px_rgba(34,211,238,0.72)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_36px_100px_-44px_rgba(37,99,235,0.78)]"
            >
              <div className="relative min-h-[250px] sm:min-h-[280px]">
                {featuredCover ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredCover}
                      alt={featured.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/42 to-black/18" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/12 via-transparent to-indigo-400/22" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_45%,#2563eb_100%)]" />
                )}
                <div className="absolute left-4 top-4">
                  <Badge className="border-0 bg-red-500 px-3 text-white shadow-md">Must Read</Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white sm:p-6">
                  <h3 className="line-clamp-2 text-xl font-bold leading-snug sm:text-2xl">{featured.title}</h3>
                  <p className="line-clamp-2 text-sm text-white/85">{featured.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/75">
                    <span>{featured.author}</span>
                    {featured.readTime && <span>{featured.readTime} min read</span>}
                    {featured.publishedAt && (
                      <span>{new Date(featured.publishedAt).toLocaleDateString('en-IN')}</span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/95">
                    Read now <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-[0_20px_65px_-55px_rgba(59,130,246,0.55)] dark:shadow-[0_20px_65px_-55px_rgba(56,189,248,0.35)] backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white/90 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-400"
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by topic</span>
              {hasFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {filteredBlogs.length === 0 ? (
          <p>No articles found. Try adjusting your filters.</p>
        ) : (
          <p>
            Showing <span className="font-semibold">{paginatedBlogs.length}</span> of{' '}
            <span className="font-semibold">{filteredBlogs.length}</span> articles
          </p>
        )}
      </div>

      {/* Blog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedBlogs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60">
          <p className="text-lg text-slate-600 dark:text-slate-300">No articles yet</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {paginatedBlogs.map((blog, i) => (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.18), duration: 0.2 }}
            >
              <BlogCard {...blog} />
            </motion.div>
          ))}
        </motion.div>
      )}

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
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i + 1}
                variant={page === i + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
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
