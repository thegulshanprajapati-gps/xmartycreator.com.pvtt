'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, Eye, MessageCircle, Zap } from 'lucide-react';

interface BlogCardProps {
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

export default function BlogCard({
  title,
  slug,
  excerpt,
  coverImage,
  author,
  authorImage,
  readTime = 5,
  tags = [],
  views = 0,
  publishedAt,
  status = 'published',
}: BlogCardProps) {
  const coverSrc = typeof coverImage === 'string' ? coverImage : coverImage?.url;
  const readTimeLabel = typeof readTime === 'number' ? `${readTime} min read` : readTime || '--';
  const safeTitle = title || '';
  const safeExcerpt = excerpt || '';

  const getTimeAgo = () => {
    if (!publishedAt) return 'recently';
    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) return 'recently';
    return formatDistanceToNow(date, { addSuffix: true });
  };
  const timeAgo = getTimeAgo();

  const authorInitial = (author || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`Read ${safeTitle || 'article'}`}
    >
      <motion.div
        whileHover={{ translateY: -10 }}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/12 via-purple-500/12 to-cyan-500/12 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white/95 via-slate-50 to-slate-100/80 backdrop-blur shadow-[0_25px_80px_-60px_rgba(59,130,246,0.45)] hover:shadow-xl transition-all">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-purple-400/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
          </div>
          {coverSrc && (
            <div className="relative h-52 w-full overflow-hidden bg-muted">
              <Image
                src={coverSrc}
                alt={title}
                fill
                className="object-cover transition-transform duration-400 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-100" />
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur px-3 py-1 text-xs text-white/90">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{readTimeLabel}</span>
              </div>
              <div className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/75 text-xs text-slate-900 px-3 py-1 shadow-sm border border-slate-200/70">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold uppercase tracking-wide text-[11px]">
                  {status === 'draft' ? 'Draft' : 'Published'}
                </span>
              </div>
            </div>
          )}

          <div className={`relative p-5 ${!coverSrc ? 'pt-6' : ''}`}>
            {tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px] bg-white/80 border-slate-200">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <Badge variant="outline" className="text-[11px]">
                    +{tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <h3 className="line-clamp-2 text-xl font-semibold mb-2 text-slate-900 group-hover:text-primary transition-colors">
              {safeTitle}
            </h3>

            <p className="line-clamp-3 text-sm text-slate-600 mb-4 leading-relaxed">
              {safeExcerpt}
            </p>

            <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{views.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{tags[0] || 'Blog'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/70 pt-4">
              <div className="flex items-center gap-3">
                {authorImage ? (
                  <Image
                    src={authorImage}
                    alt={author}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200/70"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/15 text-primary font-semibold grid place-items-center ring-2 ring-slate-200/70">
                    {authorInitial}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">{author || 'Unknown'}</span>
                  <span className="text-xs text-slate-500">{timeAgo}</span>
                </div>
              </div>
              <Badge variant={status === 'draft' ? 'outline' : 'default'} className="uppercase text-[11px] tracking-wide">
                {status === 'draft' ? 'Draft' : 'Published'}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
