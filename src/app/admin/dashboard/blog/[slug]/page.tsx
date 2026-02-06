import BlogEditClient from '@/components/admin/blog-edit-client';

export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return <BlogEditClient slug={slug} />;
}
