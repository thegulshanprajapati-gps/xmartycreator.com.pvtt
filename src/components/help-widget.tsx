'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Single, site-wide persona (no page-based switching)
const PERSONA = {
  name: 'Vasant AI',
  greeting: 'Namaste! I am Vasant AI. How can I guide you today?',
};

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: PERSONA.greeting,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          pageTitle: typeof document !== 'undefined' ? document.title : '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response || 'Sorry, I could not process that. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error || 'Sorry, there was an error. Please try again.';
        setApiError(message);
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, there was an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setApiError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // close when clicking outside
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isOpen && overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      <div
        className="fixed bottom-12 right-4 z-30 pointer-events-none md:right-6"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <motion.div
          animate={{ rotate: isOpen ? 4 : 0, scale: hovering ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="pointer-events-auto"
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/70 text-white shadow-[0_18px_65px_-28px_rgba(32,55,90,0.65)] border border-white/60 backdrop-blur-xl transition-all duration-200 hover:shadow-[0_22px_70px_-24px_rgba(32,55,90,0.75)] overflow-hidden"
            aria-label="Open chat"
          >
            <motion.span
              className="absolute inset-[-18%] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-orange-400"
              animate={{ rotate: isOpen ? 20 : 0 }}
              transition={{ duration: 0.4 }}
            />
            <div className="absolute inset-[2px] rounded-[18px] bg-white/85 backdrop-blur-xl" />
            <div className="relative flex flex-col items-center gap-1 text-xs font-semibold text-slate-900">
              <div className="relative">
                <div className="absolute inset-[-6px] rounded-2xl bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/20 to-orange-400/30 blur" />
                <Image src="/logo/1000010559.png" alt="Vasant AI icon" width={28} height={28} className="rounded-xl shadow-sm" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
              </div>
              <span className="leading-tight">Vasant AI</span>
            </div>
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: hovering ? 1 : 0, y: hovering ? 0 : 6 }}
          transition={{ duration: 0.18 }}
          className="mt-2 px-3 py-2 rounded-lg bg-[#0f172a]/90 text-slate-50 text-xs shadow-lg border border-white/10 backdrop-blur pointer-events-none w-max"
        >
          {PERSONA.name}
        </motion.div>
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          ref={overlayRef}
          className="fixed bottom-20 right-4 md:bottom-32 md:right-6 z-40 w-[380px] max-w-[94vw] max-h-[78vh]"
        >
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/50 via-fuchsia-500/50 to-orange-400/50 shadow-[0_30px_90px_-65px_rgba(99,102,241,0.9)]">
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#05070f]/92 backdrop-blur-2xl text-slate-900 dark:text-slate-50 flex flex-col overflow-hidden min-h-0 max-h-[78vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10 bg-gradient-to-r from-indigo-500/90 via-fuchsia-500/90 to-orange-400/90 text-white">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-white/90 flex items-center justify-center shadow-lg">
                <Image src="/logo/1000010559.png" alt="Vasant AI" width={28} height={28} className="rounded-lg" />
                <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(255,255,255,0.35)]" />
              </div>
              <div>
                <div className="font-semibold leading-tight">Vasant AI</div>
                <div className="text-xs opacity-90">Instant answers - Smarter help</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>Live</span>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-[220px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-transparent via-slate-50 to-transparent dark:via-white/5">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none shadow-sm'
                      : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm dark:bg-white/15 dark:text-slate-50 dark:border-white/10 backdrop-blur'
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            {apiError && (
              <div className="text-xs text-amber-300 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg w-fit">
                {apiError} (check GROQ_API_KEY in .env)
              </div>
            )}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 px-4 py-3 bg-slate-100 rounded-lg rounded-bl-none w-fit border border-slate-200/80 dark:bg-white/15 dark:border-white/10 backdrop-blur"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200/80 dark:border-white/10 p-3 bg-white dark:bg-[#05070f]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200/80 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-50 dark:placeholder:text-slate-400"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-orange-400 text-white shadow-lg hover:scale-[1.02] transition"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200/80 dark:bg-white/5 dark:border-white/10">Try: "Summarize this page"</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200/80 dark:bg-white/5 dark:border-white/10">"Give me next steps"</span>
            </div>
          </div>
        </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
