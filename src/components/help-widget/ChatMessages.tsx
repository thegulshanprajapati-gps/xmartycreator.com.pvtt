'use client';

import Image from 'next/image';
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
  emptyStateText = 'Ask anything about your studies...',
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      className="relative flex-1 min-h-[240px] space-y-3 overflow-y-auto px-3.5 py-4 chat-scrollbar bg-[hsl(var(--vasant-bg)/0.52)] dark:bg-[hsl(var(--vasant-bg)/0.66)]"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_90%_2%,rgba(56,189,248,0.2),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(250,204,21,0.08),transparent_50%)] opacity-60" />

      {messages.length === 0 && (
        <div className="relative flex flex-col items-center justify-center py-12 text-center text-slate-600 dark:text-slate-300">
          <div className="mb-3 grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-teal-300/30 bg-white/75 shadow-[0_14px_30px_-22px_rgba(16,185,129,0.7)] backdrop-blur dark:bg-slate-900/70">
            <Image src="/logo/1000010559.png" alt="Vasant AI" width={26} height={26} className="rounded-lg" />
          </div>
          <p className="text-sm">{emptyStateText}</p>
        </div>
      )}

      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className={`relative flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.type === 'assistant' ? (
            <div className="flex max-w-[92%] items-end gap-2 sm:max-w-[84%]">
              <div className="mb-1 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-teal-300/45 bg-white/80 shadow-[0_10px_24px_-16px_rgba(16,185,129,0.8)] backdrop-blur dark:bg-slate-900/80">
                <Image src="/logo/1000010559.png" alt="Vasant AI" width={16} height={16} className="rounded-full" />
              </div>
              <div className="rounded-[20px] rounded-bl-[10px] border border-white/55 bg-[hsl(var(--vasant-assistant)/0.82)] px-4 py-2.5 text-sm text-[hsl(var(--vasant-text))] shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[hsl(var(--vasant-assistant)/0.55)] dark:text-slate-100">
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ) : (
            <div className="max-w-[86%] rounded-[999px] bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 px-4 py-2.5 text-sm text-white shadow-[0_18px_34px_-22px_rgba(6,182,212,0.9)] ring-1 ring-white/20 sm:max-w-[72%]">
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          )}
        </motion.div>
      ))}

      {apiError && (
        <div className="relative w-fit rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">
          {apiError} (check GROQ_API_KEY in .env)
        </div>
      )}

      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end gap-2"
        >
          <div className="mb-1 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-teal-300/45 bg-white/80 shadow-[0_10px_24px_-16px_rgba(16,185,129,0.8)] backdrop-blur dark:bg-slate-900/80">
            <Image src="/logo/1000010559.png" alt="Vasant AI" width={16} height={16} className="rounded-full" />
          </div>
          <div className="flex items-center gap-1.5 rounded-[999px] border border-white/55 bg-[hsl(var(--vasant-assistant)/0.82)] px-3.5 py-2.5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[hsl(var(--vasant-assistant)/0.55)]">
            {[0, 1, 2].map((dotIndex) => (
              <motion.span
                key={`typing-${dotIndex}`}
                className="h-1.5 w-1.5 rounded-full bg-teal-400 dark:bg-cyan-300"
                animate={{ y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
                transition={{
                  duration: 0.95,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: dotIndex * 0.15,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  );
}
