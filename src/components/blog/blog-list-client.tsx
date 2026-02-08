'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import BlogCard from './blog-card';
import BlogCardSkeleton from './blog-card-skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, Sparkles } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/10 bg-gradient-to-br from-white/95 via-slate-50 to-slate-100/90 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-800/60 shadow-[0_30px_90px_-70px_rgba(59,130,246,0.65)] dark:shadow-[0_30px_90px_-65px_rgba(56,189,248,0.35)] backdrop-blur">
        <div className="absolute inset-0 opacity-55 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.12),transparent_38%),radial-gradient(circle_at_82%_12%,rgba(236,72,153,0.1),transparent_32%),radial-gradient(circle_at_55%_85%,rgba(99,102,241,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.22),transparent_40%),radial-gradient(circle_at_82%_12%,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_55%_85%,rgba(59,130,246,0.18),transparent_42%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative px-6 py-10 md:px-10 md:py-14 grid gap-8 lg:grid-cols-[1.2fr_1fr]"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/12 via-purple-500/12 to-pink-500/12 border border-slate-200/60 dark:border-white/20 text-slate-800 dark:text-white px-4 py-2 text-sm font-semibold shadow-[0_10px_40px_-30px_rgba(59,130,246,0.8)]">
              <Sparkles className="h-4 w-4" />
              Curated insights
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Insights & Knowledge
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl">
              Discover articles on technology, design, and digital growth, exactly as saved in admin.
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10">Guides</Badge>
              <Badge className="bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10">Releases</Badge>
              <Badge className="bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10">Community</Badge>
            </div>
          </div>

          {/* Featured highlight (first post) */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/90 dark:bg-slate-900/65 backdrop-blur group shadow-md dark:shadow-[0_25px_80px_-55px_rgba(59,130,246,0.4)] hover:shadow-lg transition-shadow"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-95" />
              {featuredCover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredCover}
                  alt={featured.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="relative p-6 space-y-3 text-white">
                <Badge className="bg-primary text-white border-0">Featured</Badge>
                <h3 className="text-2xl font-bold leading-snug line-clamp-2">{featured.title}</h3>
                <p className="text-sm text-white/80 line-clamp-2">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-white/70">
                  <span>{featured.author}</span>
                  {featured.readTime && <span>{featured.readTime} min read</span>}
                  {featured.publishedAt && <span>{new Date(featured.publishedAt).toLocaleDateString('en-IN')}</span>}
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
