"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Wrench, Sparkles, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CourseDevelopmentPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-[calc(100vh_-_64px)] overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-sky-100 dark:from-[#0f1018] dark:via-[#15182a] dark:to-[#0f2233]">
      <div className="pointer-events-none absolute -top-24 left-10 h-72 w-72 rounded-full bg-orange-300/35 blur-3xl dark:bg-orange-500/20" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-200/35 blur-3xl dark:bg-fuchsia-500/15" />

      <div className="container relative mx-auto flex min-h-[calc(100vh_-_64px)] items-center justify-center px-4 py-10 md:px-6">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/50 bg-white/70 shadow-[0_35px_120px_-70px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.22),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.22),transparent_45%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.18),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.18),transparent_45%)]" />
          <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="relative grid md:grid-cols-[1.15fr_0.85fr]">
            <div className="p-8 md:p-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-100">
                <Sparkles className="h-4 w-4 text-orange-500 dark:text-orange-300" />
                Course Section Maintenance
              </div>

              <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white md:text-5xl">
                This page is in development mode
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-700 dark:text-slate-200/85 md:text-lg">
                We are upgrading the full courses experience. It will be back very soon with a cleaner
                flow and faster pages.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="h-11 rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="h-11 rounded-xl border-slate-300/80 bg-white/70 px-5 text-slate-800 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>
            </div>

            <div className="relative border-t border-slate-200/70 p-8 md:border-l md:border-t-0 md:p-10 dark:border-white/10">
              <div className="relative mb-7 flex items-center justify-center">
                <div className="absolute h-24 w-24 rounded-full border border-slate-300/60 dark:border-white/25" />
                <div className="absolute h-24 w-24 animate-[spin_8s_linear_infinite] rounded-full border-2 border-transparent border-t-orange-500 border-r-cyan-500/90 dark:border-t-orange-300 dark:border-r-cyan-300" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-lg dark:bg-slate-800/90 dark:text-white">
                  <Wrench className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300/80">
                    Status
                  </div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-white">Under Active Build</div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300/80">
                    Scope
                  </div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-white">Entire Courses Section</div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300/80">
                    Live Signal
                  </div>
                  <div className="mt-1 inline-flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-300">
                    <CircleDashed className="h-4 w-4 animate-[spin_3s_linear_infinite]" />
                    Work in Progress
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
