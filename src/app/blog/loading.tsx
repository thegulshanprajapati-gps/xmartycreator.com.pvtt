"use client";

import { Loader2 } from "lucide-react";

/**
 * Route-level loading UI for /blog.
 * Appears while the page data streams; leaves header visible (higher z-index).
 */
export default function BlogLoading() {
  return (
    <div className="fixed inset-0 top-16 z-40 flex items-center justify-center bg-background/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-foreground/80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading blog articles…</p>
      </div>
    </div>
  );
}
