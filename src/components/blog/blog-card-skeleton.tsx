'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function BlogCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white/95 via-slate-50 to-slate-100/80 overflow-hidden shadow-[0_25px_80px_-60px_rgba(59,130,246,0.45)]">
      {/* Image Skeleton */}
      <Skeleton className="h-48 w-full" />

      <div className="p-4 space-y-4">
        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>

        {/* Title */}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />

        {/* Excerpt */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        {/* Stats */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-200/70">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
