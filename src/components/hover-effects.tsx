import { motion } from 'framer-motion';
import Link from 'next/link';
import { ReactNode } from 'react';

interface HoverCardProps {
  href?: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}

export function HoverCard({ href, children, className, external }: HoverCardProps) {
  const Comp = motion[href ? 'a' : 'div'];
  const props = href
    ? {
        href,
        target: external ? '_blank' : undefined,
        rel: external ? 'noopener noreferrer' : undefined,
      }
    : {};

  return (
    <Comp
      className={className}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </Comp>
  );
}

interface HoverImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function HoverImage({ src, alt, className }: HoverImageProps) {
  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      whileHover={{
        scale: 1.05,
        filter: 'brightness(1.1)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    />
  );
}

interface HoverLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}

export function HoverLink({ href, children, className, external }: HoverLinkProps) {
  return (
    <Link href={href}>
      <motion.div
        className={className}
        whileHover={{
          x: 4,
          color: 'var(--primary)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </Link>
  );
}

interface HoverTextProps {
  children: ReactNode;
  className?: string;
}

export function HoverText({ children, className }: HoverTextProps) {
  return (
    <motion.span
      className={className}
      whileHover={{
        backgroundImage: 'linear-gradient(90deg, var(--primary), var(--destructive))',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.span>
  );
}
