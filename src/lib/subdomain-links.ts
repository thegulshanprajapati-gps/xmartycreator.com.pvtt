const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const DEFAULT_TEST_APP_BASE_URL = 'https://test.xmartycreator.com';
const LOCAL_TEST_APP_BASE_URL = 'http://localhost:3011';

const normalizeOptionalBaseUrl = (value: string | undefined) => {
  const candidate = (value || '').trim();
  if (!candidate) return '';
  if (!/^https?:\/\//i.test(candidate)) return '';
  return trimTrailingSlash(candidate);
};

const normalizeBaseUrl = (value: string | undefined, fallback: string) =>
  normalizeOptionalBaseUrl(value) || fallback;

const stripPort = (value: string) => value.replace(/:\d+$/, '').trim().toLowerCase();

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

export const TEST_APP_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_TEST_APP_URL,
  DEFAULT_TEST_APP_BASE_URL
);

export const CHECKOUT_APP_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_CHECKOUT_APP_URL,
  'https://check.xmartycreator.com'
);

export const COURSE_APP_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_COURSE_APP_URL,
  'https://course.xmartycreator.com'
);

export function resolveTestAppBaseUrl(hostname?: string) {
  const explicit = normalizeOptionalBaseUrl(process.env.TEST_APP_BASE_URL);
  if (explicit) return explicit;

  const publicConfigured = normalizeOptionalBaseUrl(process.env.NEXT_PUBLIC_TEST_APP_URL);
  if (publicConfigured) return publicConfigured;

  if (hostname && isLocalHostname(stripPort(hostname))) {
    return normalizeBaseUrl(
      process.env.TEST_APP_LOCAL_URL || process.env.NEXT_PUBLIC_TEST_APP_LOCAL_URL,
      LOCAL_TEST_APP_BASE_URL
    );
  }

  return DEFAULT_TEST_APP_BASE_URL;
}

export function buildCoursePreviewUrl(slug: string, baseUrl = COURSE_APP_BASE_URL) {
  const safeSlug = encodeURIComponent((slug || '').trim());
  return `${trimTrailingSlash(baseUrl)}/course/${safeSlug}`;
}

export function buildCheckoutUrl(
  courseSlug: string,
  options?: { source?: string; ref?: string },
  baseUrl = CHECKOUT_APP_BASE_URL
) {
  const url = new URL('/checkout', `${trimTrailingSlash(baseUrl)}/`);
  url.searchParams.set('course', (courseSlug || '').trim());

  if (options?.source) {
    url.searchParams.set('source', options.source);
  }

  if (options?.ref) {
    url.searchParams.set('ref', options.ref);
  }

  return url.toString();
}

export function buildTestAppUrl(path = '/', baseUrl = TEST_APP_BASE_URL) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimTrailingSlash(baseUrl)}${normalizedPath}`;
}
