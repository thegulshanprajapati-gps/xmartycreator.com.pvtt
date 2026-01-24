'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Copy, ClipboardPaste, RotateCcw, ArrowLeft, ArrowRight, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ContextMenuPosition {
  x: number;
  y: number;
}

// Image Icon Component for WhatsApp
const WhatsAppImage = ({ className }: { className: string }) => (
  <img src="/logo/whatsapp.png" alt="WhatsApp" className={`w-4 h-4 ${className}`} />
);

// Image Icon Component for Instagram
const InstagramImage = ({ className }: { className: string }) => (
  <img src="/logo/insta.png" alt="Instagram" className={`w-4 h-4 ${className}`} />
);

export function ContextMenu() {
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleClick = () => setPosition(null);

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const handleCut = async () => {
    try {
      const text = window.getSelection()?.toString() || '';
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error('Cut failed:', err);
    }
  };

  const handleCopy = async () => {
    try {
      const text = window.getSelection()?.toString() || '';
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('paste');
      document.body.removeChild(textarea);
    } catch (err) {
      console.error('Paste failed:', err);
    }
  };

  const menuItems = [
    {
      icon: Scissors,
      label: 'Cut',
      action: handleCut,
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Copy,
      label: 'Copy',
      action: handleCopy,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: ClipboardPaste,
      label: 'Paste',
      action: handlePaste,
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: RotateCcw,
      label: 'Reload',
      action: () => window.location.reload(),
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      icon: ArrowLeft,
      label: 'Back',
      action: () => window.history.back(),
      color: 'from-slate-500 to-slate-600',
    },
    {
      icon: ArrowRight,
      label: 'Forward',
      action: () => window.history.forward(),
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: Palette,
      label: `Theme: ${mounted && theme ? (theme === 'dark' ? 'Light' : 'Dark') : 'System'}`,
      action: () => {
        if (mounted && theme) {
          setTheme(theme === 'dark' ? 'light' : 'dark');
        }
      },
      color: 'from-yellow-500 to-orange-600',
    },
    {
      icon: WhatsAppImage,
      label: 'WhatsApp',
      action: () => {
        window.open('https://wa.me/919999999999', '_blank');
      },
      color: 'from-green-400 to-green-600',
      premium: true,
      isImage: true,
    },
    {
      icon: InstagramImage,
      label: 'Instagram',
      action: () => {
        window.open('https://instagram.com/xmartycreator', '_blank');
      },
      color: 'from-pink-500 via-red-500 to-yellow-500',
      premium: true,
      isImage: true,
    },
  ];

  if (!position) return null;

  const adjustedX = Math.min(position.x, window.innerWidth - 240);
  const adjustedY = Math.min(position.y, window.innerHeight - 400);

  // Determine background based on theme
  const isDark = theme === 'dark';
  const bgColor = isDark
    ? 'rgba(20, 20, 20, 0.85)'
    : 'rgba(255, 255, 255, 0.85)';
  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.3)';
  const textColor = isDark ? '#fff' : '#000';

  return (
    <AnimatePresence>
      {position && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed z-[9999] w-56 rounded-2xl shadow-2xl backdrop-blur-xl"
          style={{
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
            background: bgColor,
            border: `1px solid ${borderColor}`,
            boxShadow: isDark
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(31, 38, 135, 0.37)',
            color: textColor,
          }}
        >
          <div className="py-2 px-1">
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  item.action();
                  setPosition(null);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-sm rounded-xl transition-all relative group ${
                  item.premium ? 'mb-1' : ''
                }`}
                style={{ color: textColor }}
                whileHover={{ x: 6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background gradient for premium items */}
                {item.premium && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity`}
                    initial={false}
                  />
                )}

                {/* Icon with premium glow */}
                <div className="relative">
                  <motion.div
                    animate={{
                      boxShadow: item.premium
                        ? ['0 0 0px rgba(0,0,0,0)', '0 0 10px rgba(168, 85, 247, 0.5)', '0 0 0px rgba(0,0,0,0)']
                        : 'none',
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    {item.isImage ? (
                      <item.icon className="relative z-10" />
                    ) : (
                      <item.icon
                        className={`w-4 h-4 relative z-10 ${
                          item.premium ? 'text-transparent bg-clip-text bg-gradient-to-r ' + item.color : ''
                        }`}
                        style={item.premium ? {} : { color: textColor }}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Label */}
                <span
                  className={`relative z-10 font-medium ${
                    item.premium
                      ? `text-transparent bg-clip-text bg-gradient-to-r ${item.color}`
                      : ''
                  }`}
                  style={item.premium ? {} : { color: textColor }}
                >
                  {item.label}
                </span>

                {/* Premium badge */}
                {item.premium && (
                  <motion.div
                    className="ml-auto relative z-10"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color}`} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Separator between standard and social items */}
          <motion.div
            className="h-px mx-2 my-1 opacity-50"
            style={{
              background: isDark
                ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)'
                : 'linear-gradient(to right, transparent, rgba(0,0,0,0.1), transparent)',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.1 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
