export interface BlogComment {
  _id?: string;
  blogSlug: string;
  blogTitle?: string;
  name: string;
  email: string;
  message: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
