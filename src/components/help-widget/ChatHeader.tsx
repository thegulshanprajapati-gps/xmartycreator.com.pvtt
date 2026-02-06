'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  name: string;
  subtitle?: string;
  onClose: () => void;
}

export default function ChatHeader({ name, subtitle, onClose }: ChatHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-t-[22px] border-b border-white/15 dark:border-white/10 bg-gradient-to-r from-emerald-500/90 via-sky-500/90 to-amber-400/90 dark:from-emerald-400/70 dark:via-sky-400/70 dark:to-amber-300/70 px-4 py-3 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_60%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 shadow-lg">
            <Image src="/logo/1000010559.png" alt={name} width={28} height={28} className="rounded-lg" />
            <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(255,255,255,0.35)]" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{name}</div>
            {subtitle && <div className="text-xs opacity-90">{subtitle}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Live</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
