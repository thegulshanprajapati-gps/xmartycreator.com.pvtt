'use client';

import { Sparkles, ChevronRight } from 'lucide-react';

interface QuickActionChipsProps {
  actions: string[];
  onAction: (action: string) => void;
}

export default function QuickActionChips({ actions, onAction }: QuickActionChipsProps) {
  return (
    <div className="px-3 pb-3 border-t border-slate-200/70 dark:border-white/10 bg-white/95 dark:bg-slate-950/90 transition-colors">
      <div className="flex gap-2 overflow-x-auto chat-scrollbar">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-emerald-300/70 hover:text-emerald-700 hover:bg-white transition dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {action}
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
}
