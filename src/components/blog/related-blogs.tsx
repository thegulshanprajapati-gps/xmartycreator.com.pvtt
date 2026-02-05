import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types/blog';
import { formatDistanceToNow } from 'date-fns';

interface RelatedBlogsProps {
  blogs: BlogPost[];
  className?: string;
}

export default function RelatedBlogs({ blogs, className = '' }: RelatedBlogsProps) {
  if (blogs.length === 0) return null;

  return (
    <section className={`space-y-6 ${className}`}>
      <h3 className="text-2xl font-bold">Related Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog, index) => {
          const getTimeAgo = () => {
            if (!blog.publishedAt) return 'recently';
            const date = new Date(blog.publishedAt);
            if (isNaN(date.getTime())) return 'recently';
            return formatDistanceToNow(date, { addSuffix: true });
          };
          const timeAgo = getTimeAgo();

          return (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href={`/blog/${blog.slug}`}>
                <Card className="h-full overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {blog.coverImage && (
                    <div className="relative h-40 w-full overflow-hidden bg-muted">
                      <Image
                        src={
                          typeof blog.coverImage === 'string'
                            ? blog.coverImage
                            : blog.coverImage.url
                        }
                        alt={
                          typeof blog.coverImage === 'string'
                            ? blog.title
                            : blog.coverImage.alt || blog.title
                        }
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <h4 className="line-clamp-2 font-semibold group-hover:text-primary transition-colors">
                      {blog.title}
                    </h4>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {blog.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{blog.author}</span>
                      <span>{timeAgo}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
