'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Image Skeleton */}
      <Skeleton className="h-48 w-full" />

      <div className="p-4 space-y-4">
        {/* Level Badge */}
        <Skeleton className="h-6 w-20" />

        {/* Title */}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />

        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Divider */}
        <Skeleton className="h-px" />

        {/* Price & Button */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
