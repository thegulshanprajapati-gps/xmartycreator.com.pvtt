"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function CommunityHubComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/2 h-96 w-96 rounded-full bg-purple-300/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 bottom-0 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/60 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-100 border border-white/70 dark:border-slate-700 shadow-sm">
          <Sparkles className="h-4 w-4" />
          Community Hub
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
          Coming Soon
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          We’re crafting a dedicated hub for events, resources, and member highlights. Stay tuned for the big launch!
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg" variant="outline" className="gap-2 border-2">
            <Link href="/community">
              <ArrowLeft className="h-4 w-4" />
              Back to community
            </Link>
          </Button>
          <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
            <Sparkles className="h-4 w-4" />
            Notify me
          </Button>
        </div>
      </div>
    </div>
  );
}
