'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

type NotificationContent = {
  enabled: boolean;
  message: string;
  linkText: string;
  linkHref: string;
};

export function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [notificationContent, setNotificationContent] = useState<NotificationContent>({
    enabled: false,
    message: '',
    linkText: '',
    linkHref: ''
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/notification');
        if (res.ok) {
          const data = await res.json();
          setNotificationContent(data);
        }
      } catch (error) {
        console.error('Error fetching notification content:', error);
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    if (!notificationContent.enabled) {
      setIsVisible(false);
      return;
    }
    const isDismissed = sessionStorage.getItem('notificationDismissed');
    if (isDismissed !== 'true') {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [notificationContent.enabled]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('notificationDismissed', 'true');
  };

  const renderMessage = () => {
    const linkElement = (
      <Link href={notificationContent.linkHref} className="underline hover:text-white/80">
        {notificationContent.linkText}
      </Link>
    );

    if (notificationContent.message.includes('{link}')) {
      const parts = notificationContent.message.split('{link}');
      return (
        <>
          <span dangerouslySetInnerHTML={{ __html: parts[0] }} />
          {linkElement}
          {parts[1] && <span dangerouslySetInnerHTML={{ __html: parts[1] }} />}
        </>
      );
    }
    return <span dangerouslySetInnerHTML={{ __html: notificationContent.message }} />;
  };

  return (
    <AnimatePresence>
      {isVisible && notificationContent.enabled && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative overflow-hidden bg-destructive text-destructive-foreground"
        >
          <div className="container mx-auto px-4 py-2 text-sm">
            <div className="flex items-center justify-center gap-4">
              <Megaphone className="h-5 w-5 flex-shrink-0" />
              <p className="flex-grow text-center font-medium">
                {renderMessage()}
              </p>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
