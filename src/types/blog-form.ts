import { z } from 'zod';

/**
 * Blog Form Validation Schema
 * Used for both create and edit forms
 */

export const blogEditorFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  
  slug: z
    .string()
    .min(1, 'Slug is required')
    .min(3, 'Slug must be at least 3 characters')
    .max(200, 'Slug must be less than 200 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  
  excerpt: z
    .string()
    .min(1, 'Excerpt is required')
    .min(10, 'Excerpt must be at least 10 characters')
    .max(500, 'Excerpt must be less than 500 characters'),
  
  author: z
    .string()
    .min(1, 'Author name is required')
    .min(2, 'Author name must be at least 2 characters')
    .max(100, 'Author name must be less than 100 characters'),
  
  authorImage: z
    .string()
    .url('Author image must be a valid URL')
    .optional()
    .or(z.literal('')),
  
  metaTitle: z
    .string()
    .max(60, 'Meta title should be less than 60 characters')
    .optional()
    .or(z.literal('')),
  
  metaDescription: z
    .string()
    .max(160, 'Meta description should be less than 160 characters')
    .optional()
    .or(z.literal('')),
  
  status: z
    .enum(['draft', 'published'], {
      errorMap: () => ({ message: 'Status must be either draft or published' }),
    })
});

export type BlogEditorFormValues = z.infer<typeof blogEditorFormSchema>;
