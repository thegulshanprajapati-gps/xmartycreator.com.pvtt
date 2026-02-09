import { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { Sparkles, BookOpen, PenLine } from "lucide-react";
import BlogListClient from "@/components/blog/blog-list-client";
import BlogCardSkeleton from "@/components/blog/blog-card-skeleton";
import { getPageContent } from "@/lib/page-content-cache";
import connectDB from "@/lib/db-connection";
import Blog from "@/lib/models/blog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Blog | Xmarty Creator",
  description: "Study-focused blog for diploma students with tech guides, exam updates, and practical learning support.",
  openGraph: {
    title: "Blog | Xmarty Creator",
    description: "Study-focused blog for diploma students with tech guides, exam updates, and practical learning support.",
    type: "website",
    url: "https://xmartycreator.com/blog",
  },
};

type HeroPill = {
  title?: string;
  description?: string;
};

type HeroData = {
  badgeText: string;
  title: string;
  description: string;
  primaryButton: { text: string; href: string };
  secondaryButton: { text: string; href: string };
  pills: HeroPill[];
};

const DEFAULT_HERO: HeroData = {
  badgeText: "Student Insights",
  title: "Blog for Diploma Success",
  description: "Clear explanations, PYQs, exam updates, and real guidance for better results.",
  primaryButton: { text: "Explore Blog", href: "/blog" },
  secondaryButton: { text: "Latest Posts", href: "/blog" },
  pills: [
    { title: "Study Guides", description: "Semester-wise notes and PYQs" },
    { title: "Exam Updates", description: "SBTE notices and key dates" },
  ],
};

const toPlainText = (value: unknown): string =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeHeroText = (
  value: unknown,
  fallback: string,
  options?: { treatBlogAsEmpty?: boolean }
): string => {
  const plain = toPlainText(value);
  if (!plain) return fallback;
  if (options?.treatBlogAsEmpty && /^blog$/i.test(plain)) return fallback;
  return plain;
};

const getBlogPageContent = unstable_cache(
  async () => {
    try {
      return (await getPageContent("blog")) as any;
    } catch {
      return {};
    }
  },
  ["blog-page-content"],
  { revalidate: 300, tags: ["blog-content"] }
);

const getPublishedBlogs = unstable_cache(
  async () => {
    try {
      await connectDB();
      const blogs = await Blog.find({ status: "published" })
        .select("_id title slug excerpt author authorImage readTime tags views publishedAt status coverImage")
        .sort({ publishedAt: -1 })
        .limit(100)
        .maxTimeMS(3500)
        .lean()
        .exec();

      if (!Array.isArray(blogs)) return [];

      return blogs.map((blog: any) => ({
        ...blog,
        _id: String(blog?._id ?? ""),
        publishedAt:
          blog?.publishedAt instanceof Date
            ? blog.publishedAt.toISOString()
            : blog?.publishedAt,
      }));
    } catch (error) {
      console.error("Blog page getPublishedBlogs error:", error);
      return [];
    }
  },
  ["blog-list-published"],
  { revalidate: 120, tags: ["blog-content"] }
);

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

function BlogHeroFallback() {
  return (
    <header className="container mx-auto px-4 md:px-6 max-w-6xl pt-12 pb-10 relative space-y-8 animate-pulse">
      <div className="h-10 w-44 rounded-full bg-slate-200/80 dark:bg-white/10" />
      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-1 min-w-[280px] space-y-4">
          <div className="h-12 w-3/4 rounded-xl bg-slate-200/80 dark:bg-white/10" />
          <div className="h-6 w-full max-w-2xl rounded-lg bg-slate-200/70 dark:bg-white/10" />
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-36 rounded-xl bg-slate-200/80 dark:bg-white/10" />
            <div className="h-11 w-36 rounded-xl bg-slate-200/80 dark:bg-white/10" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto md:min-w-[320px]">
          <div className="h-[108px] rounded-2xl bg-slate-200/70 dark:bg-white/10" />
          <div className="h-[108px] rounded-2xl bg-slate-200/70 dark:bg-white/10" />
        </div>
      </div>
    </header>
  );
}

async function BlogHeroSection() {
  const content = (await getBlogPageContent()) as any;
  const normalizedPills = [0, 1].map((index) => {
    const defaultPill = DEFAULT_HERO.pills[index] || { title: "", description: "" };
    const sourcePill =
      Array.isArray(content?.hero?.pills) && content.hero.pills[index]
        ? content.hero.pills[index]
        : defaultPill;

    return {
      title: normalizeHeroText(sourcePill?.title, defaultPill.title || ""),
      description: normalizeHeroText(sourcePill?.description, defaultPill.description || ""),
    };
  });

  const hero = {
    badgeText: normalizeHeroText(content?.hero?.badgeText, DEFAULT_HERO.badgeText),
    title: normalizeHeroText(content?.hero?.title, DEFAULT_HERO.title, { treatBlogAsEmpty: true }),
    description: normalizeHeroText(content?.hero?.description, DEFAULT_HERO.description),
    primaryButton: {
      text: normalizeHeroText(
        content?.hero?.primaryButton?.text,
        DEFAULT_HERO.primaryButton.text
      ),
      href: toPlainText(content?.hero?.primaryButton?.href) || DEFAULT_HERO.primaryButton.href,
    },
    secondaryButton: {
      text: normalizeHeroText(
        content?.hero?.secondaryButton?.text,
        DEFAULT_HERO.secondaryButton.text
      ),
      href:
        toPlainText(content?.hero?.secondaryButton?.href) ||
        DEFAULT_HERO.secondaryButton.href,
    },
    pills: normalizedPills,
  };

  return (
    <header className="container mx-auto px-4 md:px-6 max-w-6xl pt-12 pb-10 relative space-y-8">
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/12 via-purple-500/12 to-pink-500/12 border border-slate-200/60 dark:border-white/20 text-slate-800 dark:text-white rounded-full px-4 py-2 w-fit shadow-[0_10px_40px_-30px_rgba(59,130,246,0.8)] transition-colors">
        <Sparkles className="w-4 h-4" />
        <span>{hero.badgeText}</span>
      </div>
      <div className="flex flex-wrap gap-8 items-start">
        <div className="flex-1 min-w-[280px] space-y-4">
          <h1 className="font-headline text-4xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
            {hero.title}
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-200 max-w-2xl">{hero.description}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {hero.primaryButton?.text && (
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href={hero.primaryButton.href || "/blog"}>
                  {hero.primaryButton.text}
                </Link>
              </Button>
            )}
            {hero.secondaryButton?.text && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border border-slate-300/90 dark:border-white/20 text-slate-900 dark:text-white hover:bg-slate-100/90 dark:hover:bg-white/10"
              >
                <Link href={hero.secondaryButton.href || "/blog"}>
                  {hero.secondaryButton.text}
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto md:min-w-[320px]">
          {hero.pills.slice(0, 2).map((pill: HeroPill, i: number) => (
            <div key={i} className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-slate-900/60 px-4 py-4 shadow-[0_15px_50px_-35px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_60px_-45px_rgba(37,99,235,0.45)] backdrop-blur">
              <div className="flex items-center gap-3 mb-2 text-slate-700 dark:text-slate-200">
                {i === 0 ? <BookOpen className="w-5 h-5" /> : <PenLine className="w-5 h-5" />}
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{pill.title || (i === 0 ? "Study Guides" : "Exam Updates")}</span>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-200">{pill.description || (i === 0 ? "Semester-wise notes and PYQs" : "SBTE notices and key dates")}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

async function BlogListSection() {
  const initialBlogs = await getPublishedBlogs();
  return <BlogListClient initialBlogs={initialBlogs} initialBlogsLoaded />;
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-blue-300/20 dark:bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-8 h-72 w-72 rounded-full bg-purple-300/16 dark:bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 bottom-6 h-56 w-56 rounded-full bg-cyan-300/16 dark:bg-cyan-500/18 blur-3xl" />
        <Suspense fallback={<BlogHeroFallback />}>
          <BlogHeroSection />
        </Suspense>
      </div>

      <div className="container mx-auto pb-14 px-4 md:px-6 max-w-6xl">
        <Suspense fallback={<BlogSkeleton />}>
          <BlogListSection />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
