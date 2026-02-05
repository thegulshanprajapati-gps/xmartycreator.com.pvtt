/**
 * Updates Management System
 * TypeScript types for the updates system
 */

export type UpdateType = 'platform' | 'course' | 'general';
export type UpdateStatus = 'draft' | 'published';

export interface Update {
  _id: string;
  title: string;
  subtitle: string;
  content: string;
  type: UpdateType;
  isUrgent: boolean;
  status: UpdateStatus;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUpdateInput {
  title: string;
  subtitle?: string;
  content: string;
  type: UpdateType;
  isUrgent?: boolean;
  status?: UpdateStatus;
  author?: string;
}

export interface UpdateUpdateInput {
  title?: string;
  subtitle?: string;
  content?: string;
  type?: UpdateType;
  isUrgent?: boolean;
  status?: UpdateStatus;
  author?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  count?: number;
  data?: T;
  update?: T;
  updates?: T[];
  _id?: string;
  modifiedCount?: number;
  deletedCount?: number;
}
