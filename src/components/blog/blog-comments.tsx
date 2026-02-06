'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import type { BlogComment } from '@/types/comment';

interface BlogCommentsProps {
  slug: string;
  title?: string;
}

const initialForm = {
  name: '',
  email: '',
  message: '',
};

export function BlogComments({ slug, title }: BlogCommentsProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatDate = (value?: string | Date) => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blog/${slug}/comments?limit=50`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Failed to load comments');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.comments || [];
      setComments(list);
      setTotal(typeof data?.total === 'number' ? data.total : list.length);
      setError(null);
    } catch (err) {
      console.error('Comments fetch error:', err);
      setError('Unable to load comments right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [slug]);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setError('Please fill out all fields.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit comment');
      }

      if (data?.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setTotal((prev) => prev + 1);
      } else {
        await loadComments();
      }

      setForm(initialForm);
      setSuccess('Comment submitted successfully.');
    } catch (err: any) {
      console.error('Comment submit error:', err);
      setError(err?.message || 'Failed to submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Comments</h2>
          <p className="text-sm text-muted-foreground">
            Share your thoughts about {title || 'this post'}.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {total} comment{total === 1 ? '' : 's'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Your name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            maxLength={80}
            required
          />
          <Input
            type="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <Textarea
          placeholder="Write your comment..."
          rows={4}
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          maxLength={2000}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Post Comment
              </>
            )}
          </Button>
          {error && <span className="text-sm text-destructive">{error}</span>}
          {success && <span className="text-sm text-emerald-600">{success}</span>}
        </div>
        <p className="text-xs text-muted-foreground">Your email won&apos;t be shown publicly.</p>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-muted-foreground">
            Be the first to comment on this post.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id || `${comment.name}-${comment.createdAt}`}
              className="rounded-2xl border border-slate-200/70 bg-white/80 dark:border-slate-800/70 dark:bg-slate-900/60 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold grid place-items-center flex-shrink-0">
                  {(comment.name || '?').trim().charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{comment.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {comment.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
