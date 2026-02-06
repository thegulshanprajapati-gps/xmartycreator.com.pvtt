import { Metadata } from "next";
import { Suspense } from "react";
import CourseListClient from "@/components/course/course-list-client";
import CourseCardSkeleton from "@/components/course/course-card-skeleton";

export const metadata: Metadata = {
  title: "Courses | Xmarty Creator",
  description: "Learn from expert-crafted courses on technology, design, and digital growth.",
  openGraph: {
    title: "Courses | Xmarty Creator",
    description: "Learn from expert-crafted courses",
    type: "website",
    url: "https://xmartycreator.com/courses",
  },
};

function CourseSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* soft glows */}
      <div className="pointer-events-none absolute -left-32 top-10 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-purple-300/25 blur-3xl" />

      <div className="container relative z-10 mx-auto py-10 px-4 md:px-6 max-w-6xl">
        <Suspense fallback={<CourseSkeleton />}>
          <CourseListClient />
        </Suspense>
      </div>
    </div>
  );
}
