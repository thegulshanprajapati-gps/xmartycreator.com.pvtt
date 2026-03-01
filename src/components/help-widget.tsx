'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ChatHeader from '@/components/help-widget/ChatHeader';
import ChatMessages, { type ChatMessage } from '@/components/help-widget/ChatMessages';
import ChatInput from '@/components/help-widget/ChatInput';
import QuickActionChips from '@/components/help-widget/QuickActionChips';
import { cn } from '@/lib/utils';

const PERSONA = {
  name: 'Vasant AI',
  greeting: 'Namaste! I am Vasant AI. How can I guide you today?',
  subtitle: 'Student support assistant',
};

const QUICK_ACTIONS = ['Summarize this topic', 'Create a study plan', 'Explain in simple steps'];

interface HelpWidgetProps {
  variant?: 'floating' | 'embedded';
  className?: string;
}

export function HelpWidget({ variant = 'floating', className }: HelpWidgetProps) {
  const isEmbedded = variant === 'embedded';
  const [isOpen, setIsOpen] = useState(() => isEmbedded);
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
  const launcherRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEmbedded) {
      setIsOpen(true);
    }
  }, [isEmbedded]);

  const handleSendMessage = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? input).trim();
    if (!text || isLoading) return;

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

  useEffect(() => {
    if (isEmbedded || !isOpen) return;

    const handler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (overlayRef.current?.contains(target)) return;
      if (launcherRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [isEmbedded, isOpen]);

  const showPanel = isEmbedded || isOpen;

  return (
    <>
      <AnimatePresence>
        {!isEmbedded && !isOpen && (
          <motion.button
            ref={launcherRef}
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            type="button"
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-cyan-200/45 bg-[linear-gradient(150deg,rgba(14,116,144,0.96),rgba(13,148,136,0.96))] text-white shadow-[0_20px_45px_-24px_rgba(13,148,136,0.9)] ring-1 ring-white/35 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_52px_-24px_rgba(13,148,136,0.9)] active:scale-95 md:bottom-6 md:right-6"
            aria-label="Open chat"
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_45%)]" />
            <Image
              src="/logo/1000010559.png"
              alt="Vasant AI icon"
              width={26}
              height={26}
              className="relative rounded-lg"
            />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.28)]" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            ref={overlayRef}
            className={cn(
              'font-["Inter","Poppins","Segoe_UI","system-ui",sans-serif] max-h-[82vh]',
              isEmbedded
                ? 'relative w-full max-w-[440px]'
                : 'fixed bottom-4 left-3 right-3 z-40 md:bottom-6 md:left-auto md:right-6 md:w-[420px]',
              className
            )}
          >
            <div className="relative min-h-0 overflow-hidden rounded-[24px] border border-cyan-300/30 bg-[linear-gradient(160deg,rgba(5,25,34,0.95),rgba(6,39,53,0.94))] text-[hsl(var(--vasant-text))] shadow-[0_32px_80px_-48px_rgba(14,116,144,0.95)] backdrop-blur-2xl dark:border-cyan-200/20 dark:bg-[linear-gradient(160deg,rgba(6,30,40,0.93),rgba(7,34,47,0.93))]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.2),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_50%)]" />
              <div className="relative flex min-h-0 max-h-[82vh] flex-col">
                <ChatHeader
                  name={PERSONA.name}
                  subtitle={PERSONA.subtitle}
                  onClose={isEmbedded ? undefined : () => setIsOpen(false)}
                />
                <ChatMessages messages={messages} isTyping={isLoading} apiError={apiError} />
                <QuickActionChips actions={QUICK_ACTIONS} onAction={(action) => handleSendMessage(action)} />
                <ChatInput value={input} onChange={setInput} onSend={() => handleSendMessage()} disabled={isLoading} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function EmbeddedHelpWidget({ className }: { className?: string }) {
  return <HelpWidget variant="embedded" className={className} />;
}
