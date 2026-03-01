'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  name: string;
  subtitle?: string;
  onClose?: () => void;
  className?: string;
}

export default function ChatHeader({ name, subtitle, onClose, className }: ChatHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-t-[24px] border-b border-cyan-300/25 px-4 py-3 text-white',
        'bg-[linear-gradient(145deg,rgba(8,40,52,0.94),rgba(10,57,72,0.9))] dark:border-cyan-200/15',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.2),transparent_55%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-[0_14px_34px_-24px_rgba(6,182,212,0.75)]">
            <Image src="/logo/1000010559.png" alt={name} width={26} height={26} className="rounded-lg" />
            <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-50">{name}</p>
            {subtitle && <p className="truncate text-[11px] text-cyan-100/80">{subtitle}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-medium text-emerald-100 min-[400px]:text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span>Online</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-white/90 transition-all duration-200 ease-out hover:bg-white/20 hover:text-white active:scale-95"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
