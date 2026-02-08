'use client';

import { Sparkles, ChevronRight } from 'lucide-react';

interface QuickActionChipsProps {
  actions: string[];
  onAction: (action: string) => void;
}

export default function QuickActionChips({ actions, onAction }: QuickActionChipsProps) {
  return (
    <div className="px-3.5 pb-2 pt-1.5">
      <div className="flex gap-2 overflow-x-auto chat-scrollbar">
        {actions.map((action) => (
          <button
            type="button"
            key={action}
            onClick={() => onAction(action)}
            className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-cyan-300/25 bg-[hsl(var(--vasant-chip)/0.62)] px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_24px_-20px_rgba(6,182,212,0.65)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-teal-300/60 hover:bg-[hsl(var(--vasant-chip)/0.9)] hover:text-teal-700 dark:border-cyan-200/20 dark:bg-[hsl(var(--vasant-chip)/0.5)] dark:text-cyan-100 dark:hover:text-cyan-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-500 transition-colors duration-200 group-hover:text-cyan-500 dark:text-cyan-300 dark:group-hover:text-cyan-200" />
            {action}
            <ChevronRight className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
