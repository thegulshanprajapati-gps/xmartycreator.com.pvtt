const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export function buildCoursePreviewUrl(slug: string) {
  const safeSlug = encodeURIComponent((slug || '').trim());
  return `/courses/${safeSlug}`;
}

export function buildCheckoutUrl(
  courseSlug: string,
  options?: { source?: string; ref?: string }
) {
  const url = new URL('/checkout', 'http://localhost');
  url.searchParams.set('course', (courseSlug || '').trim());

  if (options?.source) {
    url.searchParams.set('source', options.source);
  }

  if (options?.ref) {
    url.searchParams.set('ref', options.ref);
  }

  return `${url.pathname}${url.search}`;
}

export function resolveTestAppBaseUrl(_hostname?: string) {
  return '';
}

export function buildTestAppUrl(path = '/', _baseUrl?: string) {
  return path.startsWith('/') ? path : `/${path}`;
}
