import { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Sparkles, BookOpen, PenLine } from "lucide-react";
import BlogListClient from "@/components/blog/blog-list-client";
import BlogCardSkeleton from "@/components/blog/blog-card-skeleton";
import { getPageContent } from "@/lib/page-content-cache";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Blog | Xmarty Creator",
  description: "Read articles about technology, design, and digital growth.",
  openGraph: {
    title: "Blog | Xmarty Creator",
    description: "Read articles about technology, design, and digital growth.",
    type: "website",
    url: "https://xmartycreator.com/blog",
  },
};

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function fetchBlogs() {
  const host = headers().get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${protocol}://${host || "localhost:3000"}`);

  const res = await fetch(`${baseUrl}/api/blog?status=published&limit=100`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function BlogPage() {
  const content = await getPageContent('blog', true).catch(() => ({}));
  const initialBlogs = await fetchBlogs();
  console.log('?? [Blog Page] Loaded hero content', content?.hero || {});
  const hero = {
    badgeText: content?.hero?.badgeText || '',
    title: content?.hero?.title || '',
    description: content?.hero?.description || '',
    primaryButton: content?.hero?.primaryButton || { text: '', href: '' },
    secondaryButton: content?.hero?.secondaryButton || { text: '', href: '' },
    pills: Array.isArray(content?.hero?.pills) ? content.hero.pills : [],
  };
  const sanitizeHeroHtml = (value: string) => {
    if (!value) return '';
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  };

  const hasHeroTitleHtml = /</.test(hero.title || '');
  const heroTitleHtml = sanitizeHeroHtml(hero.title || 'Blog');
  const heroDescriptionHtml = sanitizeHeroHtml(hero.description || '');
  const heroBadgeHtml = sanitizeHeroHtml(hero.badgeText || '');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0c10] dark:text-slate-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/70 via-white to-amber-100/50 dark:from-primary/15 dark:via-red-500/10 dark:to-transparent blur-3xl" />
        <header className="container mx-auto px-4 md:px-6 max-w-6xl pt-12 pb-10 relative space-y-8">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 bg-amber-100 px-3 py-1 rounded-full w-fit border border-amber-200 dark:text-amber-100 dark:bg-red-900/60 dark:border-red-700/60">
            <Sparkles className="w-4 h-4" />
            <span dangerouslySetInnerHTML={{ __html: heroBadgeHtml }} />
          </div>
          <div className="flex flex-wrap gap-8 items-start">
            <div className="flex-1 min-w-[280px] space-y-4">
              <h1
                className={cn(
                  "font-headline text-4xl md:text-5xl font-bold leading-tight",
                  hasHeroTitleHtml
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-900 dark:text-white bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent"
                )}
                dangerouslySetInnerHTML={{ __html: heroTitleHtml }}
              />
              <p
                className="text-lg text-slate-700 dark:text-slate-200 max-w-2xl"
                dangerouslySetInnerHTML={{ __html: heroDescriptionHtml }}
              />
              <div className="flex flex-wrap gap-3 pt-2">
                {hero.primaryButton?.text && (
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <Link href={hero.primaryButton.href || '/blog'}>
                      {hero.primaryButton.text}
                    </Link>
                  </Button>
                )}
                {hero.secondaryButton?.text && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border border-slate-300 text-slate-900 hover:bg-slate-100 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
                  >
                    <Link href={hero.secondaryButton.href || '/blog'}>
                      {hero.secondaryButton.text}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto md:min-w-[320px]">
              {hero.pills.slice(0,2).map((pill:any, i:number) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white/80 px-4 py-4 shadow-lg backdrop-blur dark:border-white/15 dark:bg-white/5">
                  <div className="flex items-center gap-3 mb-2 text-primary">
                    {i === 0 ? <BookOpen className="w-5 h-5" /> : <PenLine className="w-5 h-5" />}
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{pill.title || (i===0?'Deep dives':'Creator desk')}</span>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-200">{pill.description || (i===0?'Guides & how-tos':'Release briefs')}</div>
                </div>
              ))}
            </div>
          </div>
        </header>
      </div>

      <div className="container mx-auto pb-14 px-4 md:px-6 max-w-6xl">
        <Suspense fallback={<BlogSkeleton />}>
          <BlogListClient initialBlogs={initialBlogs} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}


