'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ChatHeader from '@/components/help-widget/ChatHeader';
import ChatMessages, { type ChatMessage } from '@/components/help-widget/ChatMessages';
import ChatInput from '@/components/help-widget/ChatInput';
import QuickActionChips from '@/components/help-widget/QuickActionChips';

// Single, site-wide persona (no page-based switching)
const PERSONA = {
  name: 'Vasant AI',
  greeting: 'Namaste! I am Vasant AI. How can I guide you today?',
  subtitle: 'Instant answers - Smarter help',
};

const QUICK_ACTIONS = ['Summarize this page', 'Give me next steps'];

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
  const [hovering, setHovering] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? input).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
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
          message: text,
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
        className="fixed bottom-8 right-4 z-30 pointer-events-none md:right-6"
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
            className="relative flex items-center justify-center w-12 h-12 rounded-[16px] bg-white/70 text-white shadow-[0_14px_45px_-22px_rgba(120,53,15,0.7)] border border-white/60 backdrop-blur-xl transition-all duration-200 hover:shadow-[0_18px_55px_-20px_rgba(234,88,12,0.6)] overflow-hidden"
            aria-label="Open chat"
          >
            <motion.span
              className="absolute inset-[-30%] bg-[conic-gradient(from_120deg,rgba(239,68,68,0.95),rgba(249,115,22,0.95),rgba(251,191,36,0.9),rgba(239,68,68,0.95))]"
              animate={{ rotate: isOpen ? 40 : 0 }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-[2px] rounded-[14px] bg-white/90 backdrop-blur-xl" />
            <div className="absolute inset-[6px] rounded-[10px] border border-orange-200/70" />
            <div className="relative flex flex-col items-center gap-0.5 text-[10px] font-semibold text-slate-900">
              <div className="relative">
                <div className="absolute inset-[-7px] rounded-2xl bg-gradient-to-br from-red-500/30 via-orange-400/25 to-amber-300/30 blur" />
                <Image
                  src="/logo/1000010559.png"
                  alt="Vasant AI icon"
                  width={22}
                  height={22}
                  className="rounded-lg shadow-sm"
                />
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" />
              </div>
              <span className="leading-tight">Vasant</span>
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
          className="fixed bottom-20 left-3 right-3 md:left-auto md:right-6 md:bottom-28 z-40 md:w-[400px] max-h-[78vh]"
        >
          <div className="relative rounded-[26px] p-[1px] bg-[conic-gradient(from_140deg,rgba(16,185,129,0.5),rgba(14,165,233,0.5),rgba(251,191,36,0.5),rgba(16,185,129,0.5))] dark:bg-[conic-gradient(from_140deg,rgba(16,185,129,0.35),rgba(14,165,233,0.35),rgba(251,191,36,0.35),rgba(16,185,129,0.35))] shadow-[0_30px_90px_-65px_rgba(14,116,144,0.9)]">
            <div className="rounded-[24px] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl text-slate-900 dark:text-slate-50 flex flex-col overflow-hidden min-h-0 max-h-[78vh]">
              <ChatHeader name={PERSONA.name} subtitle={PERSONA.subtitle} onClose={() => setIsOpen(false)} />
              <ChatMessages messages={messages} isTyping={isLoading} apiError={apiError} />
              <QuickActionChips actions={QUICK_ACTIONS} onAction={(action) => handleSendMessage(action)} />
              <ChatInput value={input} onChange={setInput} onSend={() => handleSendMessage()} disabled={isLoading} />
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
