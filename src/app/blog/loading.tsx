"use client";

import BlogCardSkeleton from "@/components/blog/blog-card-skeleton";

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl pt-12 pb-14 space-y-10">
        <div className="space-y-5 animate-pulse">
          <div className="h-9 w-44 rounded-full bg-slate-200/80 dark:bg-white/10" />
          <div className="h-12 w-full max-w-2xl rounded-xl bg-slate-200/80 dark:bg-white/10" />
          <div className="h-6 w-full max-w-3xl rounded-lg bg-slate-200/70 dark:bg-white/10" />
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-36 rounded-xl bg-slate-200/80 dark:bg-white/10" />
            <div className="h-11 w-36 rounded-xl bg-slate-200/80 dark:bg-white/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
