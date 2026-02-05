
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { usePathname } from 'next/navigation';

type HelpContent = {
  [key: string]: {
    title: string;
    description: string;
    faqs: { question: string; answer: string }[];
  };
};

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [allHelpContent, setAllHelpContent] = useState<HelpContent>({});
  const [pageHelp, setPageHelp] = useState({
    title: 'Help',
    description: 'How can we help you?',
    faqs: []
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/help');
        if (res.ok) {
          const data = await res.json();
          setAllHelpContent(data);

          // Find the most specific match for the path
          const pathSegments = pathname.split('/').filter(Boolean);
          let currentPath = '';
          let foundHelp = data['/'] || {
            title: 'Help',
            description: 'How can we help you?',
            faqs: []
          };
          
          for (const segment of pathSegments) {
            currentPath += `/${segment}`;
            if (data[currentPath]) {
              foundHelp = data[currentPath];
            }
          }
          if (pathname !== '/' && data[pathname]) {
            foundHelp = data[pathname];
          }

          setPageHelp(foundHelp);
        }
      } catch (error) {
        console.error('Error fetching help content:', error);
      }
    };

    fetchContent();
  }, [pathname]);


  const toggleOpen = () => setIsOpen(prev => !prev);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            size="lg"
            className="rounded-full h-16 w-16 shadow-lg"
            onClick={toggleOpen}
            aria-label="Open Help"
          >
            <HelpCircle className="h-7 w-7" />
          </Button>
        </motion.div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                {pageHelp.title}
            </DialogTitle>
            <DialogDescription>{pageHelp.description}</DialogDescription>
          </DialogHeader>
          <Accordion type="single" collapsible className="w-full max-h-[60vh] overflow-y-auto pr-4">
            {pageHelp.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
            {pageHelp.faqs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No specific help topics found for this page.</p>
            )}
          </Accordion>
        </DialogContent>
      </Dialog>
    </>
  );
}
