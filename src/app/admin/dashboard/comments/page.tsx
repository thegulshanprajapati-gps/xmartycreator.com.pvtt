import Link from 'next/link';
import connectDB from '@/lib/db-connection';
import BlogComment from '@/lib/models/blog-comment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

type CommentRow = {
  _id: string;
  blogSlug: string;
  blogTitle?: string;
  name: string;
  email: string;
  message: string;
  createdAt?: string | Date;
};

async function getComments(): Promise<CommentRow[]> {
  await connectDB();
  const comments = await BlogComment.find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean()
    .exec();

  return (comments || []).map((comment: any) => ({
    ...comment,
    _id: comment?._id?.toString?.() ?? comment?._id,
  }));
}

export default async function AdminCommentsPage() {
  const comments = await getComments();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Blog Comments</h1>
        <p className="text-muted-foreground">
          Read-only list of comments submitted by visitors.
        </p>
      </div>

      {comments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-2xl font-bold tracking-tight">No Comments Yet</h3>
            <p className="text-sm text-muted-foreground">
              When visitors comment on a blog, their messages will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Blog</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment._id} className="hover:bg-muted/50">
                  <TableCell className="min-w-[180px]">
                    <div className="flex flex-col">
                      <Link
                        href={`/blog/${comment.blogSlug}`}
                        className="font-medium text-foreground hover:text-primary transition"
                      >
                        {comment.blogTitle || comment.blogSlug}
                      </Link>
                      <span className="text-xs text-muted-foreground">/{comment.blogSlug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{comment.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{comment.email}</TableCell>
                  <TableCell className="max-w-[360px]">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {comment.message}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
