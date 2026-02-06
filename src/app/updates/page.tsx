'use client';

import { Fragment, useEffect, useState, useMemo } from 'react';
import { Bell, ArrowRight, Calendar, User, Search, AlertCircle, Sparkles, FileText, ExternalLink, Zap, BookOpen, FileCheck, Megaphone, Settings, AlertTriangle, FileSymlink, X } from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useThemeStyles } from '@/hooks/use-theme-styles';

type Update = {
  _id: string;
  title: string;
  subtitle: string;
  content: string;
  details?: string;
  type: 'general' | 'platform' | 'course' | 'maintenance' | 'exam' | 'event' | 'announcement' | 'system';
  isUrgent: boolean;
  status: 'draft' | 'published';
  author: string;
  createdAt: string;
  updatedAt: string;
  documentLink?: string;
  readMoreLink?: string;
};

type UpdatesContent = {
  title: string;
  description: string;
  updates: Update[];
};

const CATEGORIES = ['All', 'general', 'platform', 'course', 'maintenance', 'exam', 'event', 'announcement', 'system'];

const normalizeCurrencyText = (text?: string) => {
  if (!text) return text;
  return text
    .replace(/â‚¹/g, '₹')
    .replace(/₱/g, '₹')
    .replace(/\bPHP\b\s?/gi, '₹')
    .replace(/\bINR\b\s?/gi, '₹');
};

const rupeeSymbolStyle = {
  fontFamily:
    "'Noto Sans Devanagari','Noto Sans','Segoe UI Symbol','Arial Unicode MS',system-ui,sans-serif",
};

const rupeeTextStyle = {
  fontFamily:
    "'Noto Sans Devanagari','Noto Sans','Segoe UI','Inter',system-ui,sans-serif",
};

const renderCurrencySafeText = (text?: string) => {
  const normalized = normalizeCurrencyText(text) || '';
  if (!normalized.includes('₹')) return normalized;
  const parts = normalized.split('₹');
  return parts.map((part, index) => (
    <Fragment key={`rupee-part-${index}`}>
      {index > 0 && (
        <span style={rupeeSymbolStyle} className="font-semibold">
          ₹
        </span>
      )}
      {part}
    </Fragment>
  ));
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function UpdatesPage() {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [updatesContent, setUpdatesContent] = useState<UpdatesContent>({
    title: 'Notices & Updates',
    description: 'Stay informed with the latest updates, announcements, and important information',
    updates: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Request notification permission
  const handleNotificationClick = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');
        new Notification('Notifications Enabled', {
          body: 'You will now receive notifications about new updates!',
          icon: '/logo/logo.png'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationEnabled(true);
          localStorage.setItem('notificationsEnabled', 'true');
          new Notification('Notifications Enabled', {
            body: 'You will now receive notifications about new updates!',
            icon: '/logo/logo.png'
          });
        }
      }
    }
  };

  // Check notification status on mount
  useEffect(() => {
    const notifEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    if ('Notification' in window) {
      const isPermitted = Notification.permission === 'granted' || notifEnabled;
      setNotificationEnabled(isPermitted);
    }
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('📰 [Updates] Fetching updates from API...');
        
        const res = await fetch('/api/updates');
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ [Updates] Updates fetched:', data.count || 0, 'updates');
        
        // Filter only published updates
        const publishedUpdates = (data.updates?.filter((u: Update) => u.status === 'published') || [])
          .map((u: Update) => ({
            ...u,
            title: normalizeCurrencyText(u.title) || '',
            subtitle: normalizeCurrencyText(u.subtitle) || '',
            content: normalizeCurrencyText(u.content) || '',
            details: normalizeCurrencyText(u.details) || '',
          }));
        
        setUpdatesContent({
          title: 'Notices & Updates',
          description: 'Stay informed with the latest updates, announcements, and important information',
          updates: publishedUpdates
        });

        if (publishedUpdates.length > 0) {
          const latestAt = Math.max(
            ...publishedUpdates.map((u: Update) => new Date(u.createdAt || u.updatedAt || Date.now()).getTime())
          );
          localStorage.setItem('updatesLastSeenAt', String(latestAt));
          localStorage.setItem('updatesUnreadCount', '0');
          window.dispatchEvent(new CustomEvent('updates:unread', { detail: { count: 0 } }));
        }
      } catch (error) {
        console.error('❌ [Updates] Error fetching updates:', error);
        setError('Failed to load updates');
        setUpdatesContent({
          title: 'Notices & Updates',
          description: 'Stay informed with the latest updates, announcements, and important information',
          updates: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const filteredUpdates = useMemo(() => {
    return updatesContent.updates.filter(update => {
      const matchesSearch = update.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           update.subtitle.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || update.type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [updatesContent.updates, debouncedSearchQuery, selectedCategory]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      if (cat === 'All') {
        stats[cat] = updatesContent.updates.length;
      } else {
        stats[cat] = updatesContent.updates.filter(u => u.type === cat).length;
      }
    });
    return stats;
  }, [updatesContent.updates]);

  const getCategoryColor = (type?: string) => {
    switch (type) {
      case 'platform':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: <Settings className="h-3 w-3" />, label: '⚙️' };
      case 'course':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', icon: <BookOpen className="h-3 w-3" />, label: '🎓' };
      case 'general':
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: <FileText className="h-3 w-3" />, label: '📰' };
      case 'maintenance':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: <Zap className="h-3 w-3" />, label: '🔧' };
      case 'exam':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: <FileCheck className="h-3 w-3" />, label: '📝' };
      case 'event':
        return { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', icon: <Bell className="h-3 w-3" />, label: '🎉' };
      case 'announcement':
        return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', icon: <Megaphone className="h-3 w-3" />, label: '📢' };
      case 'system':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: <AlertTriangle className="h-3 w-3" />, label: '⚠️' };
      default:
        return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: <FileSymlink className="h-3 w-3" />, label: '📰' };
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const urgentUpdates = filteredUpdates.filter(u => u.isUrgent).slice(0, 1);

  return (
    <>
      <div className="flex flex-col bg-background min-h-screen">
        {/* Top Banner */}
        <motion.div
          className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 py-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="container mx-auto px-4 md:px-6 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Stay Updated With Latest Information</p>
          </div>
        </motion.div>

        {/* Hero Section */}
        <section className="w-full py-8 md:py-12 bg-gradient-to-b from-background to-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              className="text-center mb-8"
              initial="hidden"
              animate="visible"
              variants={itemVariants}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                Notices & <span className="text-orange-500">Updates</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                {updatesContent.description}
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              className="max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles, announcements, updates ..."
                  className="pl-12 pr-10 py-6 text-base rounded-lg border-slate-700/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Category Filters */}
            <motion.div
              className="flex flex-wrap gap-3 justify-center mb-12 overflow-x-auto pb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/50 scale-105'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500'
                  }`}
                >
                  {category === 'All' && <Bell className="h-4 w-4" />}
                  {category === 'course' && '🎓'}
                  {category === 'platform' && '⚙️'}
                  {category === 'general' && '📰'}
                  {category === 'maintenance' && '🔧'}
                  {category === 'exam' && '📝'}
                  {category === 'event' && '🎉'}
                  {category === 'announcement' && '📢'}
                  {category === 'system' && '⚠️'}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((idx) => (
                    <Skeleton key={idx} className="h-24 rounded-lg bg-slate-700/50" />
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: 'Total Updates', count: categoryStats['All'] || 0, color: 'from-blue-500 to-blue-600', icon: '🔔' },
                    { label: 'Platform', count: categoryStats['platform'] || 0, color: 'from-purple-500 to-purple-600', icon: '⚙️' },
                    { label: 'Courses', count: categoryStats['course'] || 0, color: 'from-blue-500 to-blue-600', icon: '🎓' },
                    { label: 'General', count: categoryStats['general'] || 0, color: 'from-gray-500 to-gray-600', icon: '📰' },
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      className={`bg-gradient-to-br ${stat.color} p-6 rounded-lg text-white hover:shadow-xl hover:shadow-${stat.color.split('-')[1]}-500/20 transition-all duration-300`}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">{stat.label}</p>
                          <p className="text-3xl font-bold mt-2">{stat.count}</p>
                        </div>
                        <span className="text-4xl opacity-50">{stat.icon}</span>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          </div>
        </section>

        {/* Updates Content */}
        <section className="w-full flex-1 py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            {isLoading ? (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-20 rounded-full bg-slate-700/50" />
                      <Skeleton className="h-6 w-32 rounded bg-slate-700/50" />
                    </div>
                    <Skeleton className="h-6 w-3/4 rounded bg-slate-700/50" />
                    <Skeleton className="h-4 w-full rounded bg-slate-700/50" />
                    <Skeleton className="h-4 w-5/6 rounded bg-slate-700/50" />
                  </div>
                ))}
              </motion.div>
            ) : error ? (
              <div className="text-center py-12 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            ) : updatesContent.updates.length === 0 ? (
              <motion.div
                className="text-center py-16 bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                  <Bell className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                </motion.div>
                <p className="text-muted-foreground text-xl font-semibold mb-2">No updates yet</p>
                <p className="text-muted-foreground text-sm">Check back later for new updates and announcements</p>
              </motion.div>
            ) : (
              <>
                {/* Urgent Section */}
                {urgentUpdates.length > 0 && (
                  <motion.div
                    className="mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      </motion.div>
                      Urgent Notice
                    </h2>
                    <div className="space-y-4">
                      {urgentUpdates.map((update, index) => {
                        const colors = getCategoryColor(update.type);
                        return (
                          <motion.div
                            key={update._id}
                            className={`rounded-lg p-6 border transition-all duration-300 group cursor-pointer overflow-hidden relative ${
                              theme === 'dark'
                                ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-red-500/30 hover:border-red-500/60'
                                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:border-red-300'
                            }`}
                            whileHover={{ x: 4 }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            {/* Urgent pulse background */}
                            <motion.div
                              className={`absolute inset-0 pointer-events-none ${
                                theme === 'dark' ? 'bg-red-500/5' : 'bg-red-300/5'
                              }`}
                              animate={{ opacity: [0.5, 0.8, 0.5] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                            <div className="relative z-10 flex items-start justify-between gap-4" style={rupeeTextStyle}>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                    theme === 'dark'
                                      ? `${colors.bg} ${colors.text} ${colors.border}`
                                      : 'bg-red-100 text-red-700 border-red-300'
                                  }`}>
                                    {update.type}
                                  </span>
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                    theme === 'dark'
                                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                      : 'bg-red-200 text-red-800 border-red-300'
                                  }`}>
                                    ⚠️ URGENT
                                  </span>
                                </div>
                                <h3 className={`text-xl font-bold transition-colors mb-2 ${
                                  theme === 'dark'
                                    ? 'text-white group-hover:text-red-400'
                                    : 'text-red-900 group-hover:text-red-700'
                                }`}>
                                  {renderCurrencySafeText(update.title)}
                                </h3>
                                {update.subtitle && (
                                  <p className={`mb-4 ${
                                    theme === 'dark' ? 'text-slate-300' : 'text-red-800/70'
                                  }`}>
                                    {renderCurrencySafeText(update.subtitle)}
                                  </p>
                                )}
                                <p className={`mb-4 line-clamp-2 ${
                                  theme === 'dark' ? 'text-slate-400' : 'text-red-800/60'
                                }`}>
                                  {renderCurrencySafeText(update.content)}
                                </p>
                                <div className={`flex items-center gap-4 text-sm flex-wrap ${
                                  theme === 'dark' ? 'text-muted-foreground' : 'text-red-800/70'
                                }`}>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(update.createdAt)}
                                  </span>
                                  {update.author && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-4 w-4" />
                                      {update.author}
                                    </span>
                                  )}
                                </div>
                                {/* Link Buttons */}
                                <div className="flex items-center gap-2 mt-4 flex-wrap">
                                  {update.documentLink && (
                                    <motion.a
                                      href={update.documentLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                        theme === 'dark'
                                          ? 'bg-red-600/30 hover:bg-red-600/50 text-red-300 border-red-500/30'
                                          : 'bg-red-200/50 hover:bg-red-300/50 text-red-700 border-red-400'
                                      }`}
                                    >
                                      <FileText className="h-4 w-4" />
                                      Document
                                    </motion.a>
                                  )}
                                  {update.readMoreLink && (
                                    <motion.a
                                      href={update.readMoreLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                        theme === 'dark'
                                          ? 'bg-red-600/30 hover:bg-red-600/50 text-red-300 border-red-500/30'
                                          : 'bg-red-200/50 hover:bg-red-300/50 text-red-700 border-red-400'
                                      }`}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Read More
                                    </motion.a>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  const link = update.readMoreLink || update.documentLink;
                                  if (link) {
                                    window.open(link, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                className={theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white rounded-lg whitespace-nowrap' : 'bg-red-400 hover:bg-red-500 text-white rounded-lg whitespace-nowrap'}
                              >
                                Read
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* All Updates */}
                <motion.div
                  className="mb-16"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="text-2xl font-bold mb-8">
                    All Updates<span className="text-slate-500">({filteredUpdates.length})</span>
                  </h2>

                  {filteredUpdates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredUpdates.map((update, index) => {
                        const colors = getCategoryColor(update.type);
                        return (
                          <motion.div
                            key={update._id}
                            className={`rounded-lg border transition-all duration-300 group p-6 overflow-hidden relative ${
                              theme === 'dark'
                                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-500/10'
                                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-300/10'
                            }`}
                            variants={itemVariants}
                            whileHover={{ y: -6 }}
                          >
                            {/* Hover gradient background */}
                            <motion.div
                              className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                theme === 'dark'
                                  ? 'bg-gradient-to-br from-slate-600/5 to-transparent'
                                  : 'bg-gradient-to-br from-gray-300/5 to-transparent'
                              }`}
                            />

                            <div className="relative z-10" style={rupeeTextStyle}>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                                    theme === 'dark'
                                      ? `${colors.bg} ${colors.text} ${colors.border}`
                                      : 'bg-gray-200 text-gray-700 border-gray-300'
                                  }`}>
                                    {colors.icon}
                                    {update.type}
                                  </span>
                                  {update.isUrgent && (
                                    <motion.span
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
                                        theme === 'dark'
                                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                          : 'bg-red-200 text-red-700 border-red-300'
                                      }`}
                                      animate={{ scale: [1, 1.05, 1] }}
                                      transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                      ⚠️ Urgent
                                    </motion.span>
                                  )}
                                </div>
                              </div>

                              <h3 className={`text-lg font-bold transition-colors mb-2 line-clamp-2 ${
                                theme === 'dark'
                                  ? 'text-white group-hover:text-cyan-400'
                                  : 'text-gray-900 group-hover:text-gray-700'
                              }`}>
                              {renderCurrencySafeText(update.title)}
                              </h3>

                              {update.subtitle && (
                                <p className={`text-sm mb-4 line-clamp-2 ${
                                  theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                                }`}>
                                  {renderCurrencySafeText(update.subtitle)}
                                </p>
                              )}

                              <p className={`text-sm mb-4 line-clamp-3 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                              }`}>
                                {renderCurrencySafeText(update.content)}
                              </p>

                              {/* Link Buttons */}
                              <div className="flex items-center gap-2 mb-4 flex-wrap">
                                {update.documentLink && (
                                  <motion.a
                                    href={update.documentLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                      theme === 'dark'
                                        ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border-slate-600/50 hover:border-slate-500'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Document
                                  </motion.a>
                                )}
                                {update.readMoreLink && (
                                  <motion.a
                                    href={update.readMoreLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                      theme === 'dark'
                                        ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border-slate-600/50 hover:border-slate-500'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Read More
                                  </motion.a>
                                )}
                              </div>

                              <div className={`flex items-center justify-between pt-4 border-t ${
                                theme === 'dark' ? 'border-slate-700/30' : 'border-gray-200'
                              }`}>
                                <div className={`flex flex-col text-xs gap-1 ${
                                  theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                                }`}>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(update.createdAt)}
                                  </span>
                                  {update.author && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {update.author}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  onClick={() => {
                                    const link = update.readMoreLink || update.documentLink;
                                    if (link) {
                                      window.open(link, '_blank', 'noopener,noreferrer');
                                    }
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className={theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}
                                >
                                  Read <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-muted-foreground">No updates found matching your search</p>
                    </motion.div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* CTA Banner */}
        <motion.section
          className="w-full bg-gradient-to-r from-red-600 via-orange-600 to-red-600 py-12 md:py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Bell className="h-12 w-12 mx-auto mb-4 text-white opacity-80" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Never Miss an Update
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Stay informed with the latest notices, exam schedules, and important announcements. Enable notifications to get alerts for urgent updates!
            </p>
            <motion.button
              onClick={handleNotificationClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${
                notificationEnabled
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-white hover:bg-white/90'
              } text-${notificationEnabled ? 'white' : 'red-600'} font-bold px-8 py-3 rounded-lg transition-all duration-300`}
            >
              {notificationEnabled ? '✓ Notifications Enabled' : 'Enable Notifications'}
            </motion.button>
          </div>
        </motion.section>
      </div>
      <Footer />

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-gray-200'
        }`}>
          <DialogHeader>
            <div className="flex items-start justify-between w-full gap-4">
              <div className="flex-1" style={rupeeTextStyle}>
                <DialogTitle className={theme === 'dark' ? 'text-white text-2xl' : 'text-gray-900 text-2xl'}>
                  {renderCurrencySafeText(selectedUpdate?.title || '')}
                </DialogTitle>
                {selectedUpdate?.subtitle && (
                  <DialogDescription className={`mt-2 text-base ${
                    theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {renderCurrencySafeText(selectedUpdate.subtitle)}
                  </DialogDescription>
                )}
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </DialogHeader>

          {selectedUpdate && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedUpdate.type === 'general' ? 'bg-gray-500/20 text-gray-400' :
                  selectedUpdate.type === 'platform' ? 'bg-blue-500/20 text-blue-400' :
                  selectedUpdate.type === 'course' ? 'bg-purple-500/20 text-purple-400' :
                  selectedUpdate.type === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedUpdate.type === 'exam' ? 'bg-orange-500/20 text-orange-400' :
                  selectedUpdate.type === 'event' ? 'bg-pink-500/20 text-pink-400' :
                  selectedUpdate.type === 'announcement' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {selectedUpdate.type}
                </span>
                {selectedUpdate.isUrgent && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border bg-red-500/20 text-red-400 border-red-500/30`}>
                    ?? Urgent
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedUpdate.status === 'published'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}>
                  {selectedUpdate.status}
                </span>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border border-slate-700/50'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`text-base leading-relaxed ${
                  theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  {renderCurrencySafeText(selectedUpdate.content)}
                </p>
              </div>

              {selectedUpdate.details && (
                <div className={`p-4 rounded-lg border-2 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-cyan-500/30'
                    : 'bg-cyan-50/30 border-cyan-300'
                }`}>
                  <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700'
                  }`}>
                    <FileCheck className="h-4 w-4" />
                    Detailed Information
                  </h4>
                  <div className={`prose prose-sm max-w-none whitespace-pre-wrap ${
                    theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    {renderCurrencySafeText(selectedUpdate.details)}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/30">
                {selectedUpdate.documentLink && (
                  <motion.a
                    href={selectedUpdate.documentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-cyan-300 hover:text-cyan-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    ?? Document
                  </motion.a>
                )}
                {selectedUpdate.readMoreLink && (
                  <motion.a
                    href={selectedUpdate.readMoreLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30'
                        : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700 hover:text-cyan-900 border border-cyan-300'
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    ?? Read More
                  </motion.a>
                )}
              </div>

              <div className={`flex items-center justify-between pt-4 border-t text-xs ${
                theme === 'dark'
                  ? 'border-slate-700/30 text-slate-400'
                  : 'border-gray-200 text-gray-600'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {formatDate(selectedUpdate.createdAt)}</span>
                  </div>
                  {selectedUpdate.author && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>By: {selectedUpdate.author}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
