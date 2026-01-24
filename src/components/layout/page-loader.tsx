'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export function PageLoader({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
        >
          <div className="flex items-center gap-4">
            <Image 
              src="/logo/1000010559.png" 
              alt="Xmarty Creator Logo" 
              width={40} 
              height={40} 
              className="animate-spin" 
              style={{animationDuration: '2s'}} 
            />
            <span className="text-xl font-headline text-foreground">
              Loading Xmarty Creator...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
