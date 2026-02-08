'use client';

import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  return (
    <div className="px-3.5 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-1.5">
      <div className="relative rounded-[999px] border border-cyan-300/30 bg-[hsl(var(--vasant-panel)/0.72)] p-1 shadow-[0_18px_40px_-28px_rgba(6,182,212,0.8)] backdrop-blur-xl transition-all duration-200 ease-out focus-within:border-teal-300/65 focus-within:shadow-[0_20px_44px_-24px_rgba(20,184,166,0.55)] dark:border-cyan-200/20 dark:bg-[hsl(var(--vasant-panel)/0.52)] dark:focus-within:border-cyan-300/55">
        <div className="pointer-events-none absolute inset-0 rounded-[999px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && value.trim()) onSend();
            }
          }}
          placeholder="Ask anything about your studies..."
          rows={1}
          className="relative min-h-[42px] max-h-28 w-full resize-none rounded-[999px] bg-transparent px-4 py-2.5 pr-12 text-sm leading-relaxed text-[hsl(var(--vasant-text))] outline-none placeholder:text-slate-500/80 dark:text-slate-100 dark:placeholder:text-slate-300/70"
          disabled={disabled}
          aria-label="Chat message"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-[0_16px_32px_-18px_rgba(6,182,212,0.95)] ring-1 ring-white/40 transition-all duration-200 ease-out hover:scale-105 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-55"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
