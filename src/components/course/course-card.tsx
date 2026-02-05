'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/currency/price';
import {
  Users,
  Star,
  Clock,
  Award,
  ArrowRight,
} from 'lucide-react';

interface CourseCardProps {
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

export default function CourseCard({
  title,
  slug,
  description,
  coverImage,
  instructor,
  level,
  price,
  originalPrice,
  discount: passedDiscount,
  duration = 0,
  students = 0,
  rating = 0,
  reviews = 0,
  tags = [],
  featured = false,
}: CourseCardProps) {
  const discount = passedDiscount && passedDiscount > 0
    ? passedDiscount 
    : (originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  // Treat `price` as the base price set in admin. Apply discount against it.
  const finalPrice = discount > 0
    ? Math.max(0, Math.round(price * (1 - discount / 100)))
    : price;

  // For UI: if discount exists, show the admin-set base price as original.
  // Only fall back to stored originalPrice when no discount is set.
  const displayOriginal = discount > 0
    ? price
    : (originalPrice && originalPrice > price ? originalPrice : undefined);

  const levelColors = {
    beginner: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    intermediate: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    advanced: 'bg-red-500/20 text-red-700 dark:text-red-400',
  };

  return (
    <motion.div
      whileHover={{ translateY: -8 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 dark:from-slate-900 dark:via-slate-900/70 dark:to-slate-950 transition-all shadow-[0_20px_60px_-45px_rgba(59,130,246,0.8)] ${
        featured ? 'ring-2 ring-blue-500/60' : 'hover:shadow-xl'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 opacity-60" />

      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-48 w-full overflow-hidden bg-muted group">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-destructive text-white px-3 py-1 rounded-full text-sm font-semibold">
              -{discount}%
            </div>
          )}

          {/* Level Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={levelColors[level]} variant="outline">
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Badge>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Featured Badge */}
        {featured && (
          <Badge className="bg-primary text-white">Featured Course</Badge>
        )}

        {/* Title */}
        <Link href={`/courses/${slug}`}>
          <h3 className="line-clamp-2 text-lg font-bold hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}h duration</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{students.toLocaleString()} students</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>
              {rating.toFixed(1)} ({reviews} reviews)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span>Certificate</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-4" />

        {/* Price & Instructor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Price
                value={finalPrice}
                originalValue={displayOriginal}
                discount={discount}
                showDiscount={true}
                // Ensure contrast in light/dark
                size="md"
              />
              <p className="text-xs text-muted-foreground">
                {typeof instructor === 'string' ? instructor : instructor?.name || 'Instructor'}
              </p>
            </div>
          </div>

          {/* Enroll Button */}
          <Button asChild className="w-full gap-2">
            <Link href={`/courses/${slug}`}>
              Explore Course
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
