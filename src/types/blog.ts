/**
 * Blog-related TypeScript Types
 */

export type BlogStatus = 'draft' | 'published';

export interface BlogCoverImage {
  url: string;
  alt: string;
}

export interface BlogAuthor {
  name: string;
  image?: string;
  bio?: string;
}

export interface BlogSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  canonicalUrl?: string;
}

export interface BlogPost {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any; // TipTap JSON
  htmlContent: string;
  coverImage?: BlogCoverImage;
  author: string;
  authorImage?: string;
  readTime: string;
  tags: string[];
  status: BlogStatus;
  publishedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
  views: number;
  likes: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
}

export interface BlogCreateInput {
  title: string;
  slug: string;
  excerpt: string;
  content: any;
  htmlContent: string;
  coverImage?: BlogCoverImage;
  author: string;
  authorImage?: string;
  tags: string[];
  status: BlogStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
}

export interface BlogUpdateInput extends Partial<BlogCreateInput> {
  publishedAt?: Date;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  status?: BlogStatus;
  tags?: string[];
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'views' | 'likes';
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TableOfContentsItem {
  id: string;
  level: number;
  text: string;
}

export interface BlogMetadata {
  title: string;
  description: string;
  url: string;
  image?: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  tags: string[];
}

export interface TipTapEditorContent {
  type: 'doc';
  content: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TipTapNode[] | Array<{ type: 'text'; text: string }>;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}
