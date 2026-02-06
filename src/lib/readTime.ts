export function calculateReadTime(htmlContent: string): string {
  const text = htmlContent.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).length;
  const readTimeMinutes = Math.ceil(words / 200);
  return `${readTimeMinutes} min read`;
}
