'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  return (
    <div className="border-t border-slate-200/80 dark:border-white/10 p-3 bg-white/95 dark:bg-slate-950/90 transition-colors pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && value.trim()) onSend();
            }
          }}
          placeholder="Ask anything..."
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-slate-200/80 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:ring-emerald-300/70"
          disabled={disabled}
          aria-label="Chat message"
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="rounded-2xl h-11 w-11 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-400 text-white shadow-lg hover:scale-[1.02] transition"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
