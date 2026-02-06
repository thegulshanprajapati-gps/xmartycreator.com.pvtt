'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  apiError?: string | null;
  emptyStateText?: string;
}

export default function ChatMessages({
  messages,
  isTyping,
  apiError,
  emptyStateText = 'Hey, ask me anything...',
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      className="relative flex-1 min-h-[220px] overflow-y-auto p-4 space-y-3 chat-scrollbar bg-white/95 dark:bg-slate-950/85 transition-colors"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-50 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.08),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(14,165,233,0.08),transparent_35%)]" />

      {messages.length === 0 && (
        <div className="relative flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-300">
          <div className="mb-3 h-12 w-12 rounded-2xl border border-white/20 bg-white/70 dark:bg-white/10 backdrop-blur grid place-items-center">
            <span className="text-xs font-semibold tracking-[0.2em] text-emerald-600/80 dark:text-emerald-200">AI</span>
          </div>
          <p className="text-sm">{emptyStateText}</p>
        </div>
      )}

      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[78%] sm:max-w-[70%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
              message.type === 'user'
                ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-br-none shadow-[0_12px_30px_-18px_rgba(16,185,129,0.8)]'
                : 'bg-slate-50/90 text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm dark:bg-white/10 dark:text-slate-50 dark:border-white/10 backdrop-blur'
            }`}
          >
            {message.content}
          </div>
        </motion.div>
      ))}

      {apiError && (
        <div className="relative text-xs text-amber-600 dark:text-amber-300 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg w-fit">
          {apiError} (check GROQ_API_KEY in .env)
        </div>
      )}

      {isTyping && (
        <div className="relative flex items-center gap-2 px-4 py-3 bg-white/80 rounded-2xl rounded-bl-none w-fit border border-slate-200/80 dark:bg-white/10 dark:border-white/10 backdrop-blur">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
