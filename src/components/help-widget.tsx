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
  const [hovering, setHovering] = useState(false);
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

    const handler = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEmbedded, isOpen]);

  const showPanel = isEmbedded || isOpen;

  return (
    <>
      {!isEmbedded && (
        <div
          className="fixed bottom-8 right-4 z-30 pointer-events-none md:right-6"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <motion.div
            animate={{ y: isOpen ? -2 : 0, scale: hovering ? 1.04 : 1 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            className="pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="group relative grid h-14 w-14 place-items-center overflow-hidden rounded-[18px] border border-cyan-300/35 bg-[linear-gradient(160deg,rgba(6,182,212,0.95),rgba(20,184,166,0.95))] text-white shadow-[0_20px_46px_-22px_rgba(8,145,178,0.95)] ring-1 ring-white/35 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_52px_-20px_rgba(6,182,212,0.95)] active:scale-95"
              aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.34),transparent_45%)]" />
              <span className="pointer-events-none absolute -inset-2 rounded-[22px] bg-cyan-300/30 opacity-70 blur-xl transition-opacity duration-200 group-hover:opacity-100" />
              <Image
                src="/logo/1000010559.png"
                alt="Vasant AI icon"
                width={26}
                height={26}
                className="relative rounded-lg shadow-sm"
              />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.3)]" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: hovering ? 1 : 0, y: hovering ? 0 : 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none mt-2 w-max rounded-full border border-cyan-300/25 bg-[#07131c]/92 px-3 py-1.5 text-xs font-medium text-cyan-50 shadow-[0_10px_32px_-18px_rgba(6,182,212,0.9)] backdrop-blur"
          >
            {PERSONA.name}
          </motion.div>
        </div>
      )}

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
                ? 'relative w-full max-w-[460px]'
                : 'fixed bottom-20 left-3 right-3 z-40 md:bottom-24 md:left-auto md:right-6 md:w-[430px]',
              className
            )}
          >
            <div className="relative rounded-[28px] p-[1px] bg-[linear-gradient(140deg,rgba(13,148,136,0.92),rgba(6,182,212,0.88),rgba(250,204,21,0.22),rgba(13,148,136,0.92))] shadow-[0_35px_90px_-55px_rgba(6,182,212,0.9)]">
              <div className="relative min-h-0 overflow-hidden rounded-[27px] border border-cyan-300/25 bg-[hsl(var(--vasant-panel)/0.9)] text-[hsl(var(--vasant-text))] backdrop-blur-2xl dark:border-cyan-200/20 dark:bg-[hsl(var(--vasant-panel)/0.62)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.24),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.17),transparent_55%),linear-gradient(180deg,rgba(7,18,24,0.02),rgba(2,6,23,0.18))]" />
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
