'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { Newspaper, Search, Filter, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlogPost } from '@/types/blog';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

export default function BlogPage() {
  const [allBlogs, setAllBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  
  // Fetch blogs on mount
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/blog?status=published`);
        if (res.ok) {
          const data = await res.json();
          const blogs = Array.isArray(data) ? data : data.posts || [];
          setAllBlogs(blogs);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Filter and sort blogs
  const filteredBlogs = allBlogs
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => post.tags?.includes(tag));
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const allTags = Array.from(
    new Set(allBlogs.flatMap(post => post.tags || []))
  ).slice(0, 8);

  return (
    <>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden py-12 md:py-20 bg-gradient-to-br from-accent/30 via-background to-accent/10 border-b border-accent/20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-destructive/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div 
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="inline-block bg-destructive/10 p-3 rounded-full"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <BookOpen className="h-6 w-6 text-destructive dark:text-foreground" />
              </motion.div>
              <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-destructive dark:text-foreground">
                Blog & Resources
              </h1>
              <p className="max-w-[700px] text-base md:text-lg text-muted-foreground">
                Discover in-depth articles, tutorials, and insights about content creation and digital marketing
              </p>
              <div className="pt-4">
                <Badge variant="secondary" className="animate-pulse">
                  {allBlogs.length} Articles Available
                </Badge>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters & Search Section */}
        <section className="w-full py-8 border-b bg-background/50">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search blogs..."
                  type="search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>

              {/* Sort & Filters */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTags.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTags([]);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-sm font-medium text-muted-foreground">Filter by tags:</p>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {allTags.map(tag => (
                        <motion.div
                          key={tag}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <Badge
                            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                            className="cursor-pointer transition-all duration-200 hover:scale-105"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="w-full py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 bg-muted rounded-t-lg" />
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredBlogs.length > 0 ? (
              <>
                <AnimatePresence mode="popLayout">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {filteredBlogs.map((post, index) => (
                      <motion.div
                        key={post._id}
                        layout
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, y: -20 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                          delay: index * 0.05
                        }}
                      >
                        <Card className="overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-transparent hover:border-destructive h-full flex flex-col">
                          {post.coverImage?.url && (
                          <div className="h-40 w-full relative">
                            <Image
                              src={post.coverImage.url}
                              alt={post.coverImage.alt || post.title}
                              fill
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <CardHeader className="flex-1">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="font-headline line-clamp-2 text-lg">
                                {post.title}
                              </CardTitle>
                            </div>
                            <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{post.author}</span>
                            <span>{post.readTime}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button asChild className="w-full">
                            <Link href={`/blog/${post.slug}`}>Read More</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                  </div>
                </AnimatePresence>
              </>
            ) : (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No blogs found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </motion.div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
