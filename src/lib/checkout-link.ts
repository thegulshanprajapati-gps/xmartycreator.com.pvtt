import 'server-only';

import { createHmac, randomUUID } from 'crypto';

const DEFAULT_CHECKOUT_BASE_URL = 'https://check.xmartycreator.com';
const LOCAL_CHECKOUT_BASE_URL = 'http://localhost:3012';
const DEFAULT_LINK_TTL_SECONDS = 15 * 60;
const MIN_LINK_TTL_SECONDS = 60;
const MAX_LINK_TTL_SECONDS = 24 * 60 * 60;
const LINK_VERSION = '1';

type BuildSignaturePayloadInput = {
  courseSlug: string;
  expiresAtUnix: number;
  nonce: string;
  source?: string;
  reference?: string;
};

export type CheckoutLinkInput = {
  courseSlug: string;
  hostname: string;
  source?: string;
  reference?: string;
};

export type CheckoutLinkResult = {
  url: string;
  courseSlug: string;
  baseUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
  signature: string;
  version: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeText = (value: unknown, maxLength = 120): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

const normalizeBaseUrl = (value: unknown): string => {
  const text = normalizeText(value, 300);
  if (!text || !/^https?:\/\//i.test(text)) return '';
  return trimTrailingSlash(text);
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const normalizeCourseSlug = (value: unknown): string => {
  const slug = normalizeText(value, 180).toLowerCase();
  if (!slug) return '';
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug) ? slug : '';
};

const isLocalHostname = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
};

const getCheckoutLinkTtlSeconds = (): number => {
  const configured = Number(process.env.CHECKOUT_LINK_TTL_SECONDS);
  if (!Number.isFinite(configured)) return DEFAULT_LINK_TTL_SECONDS;
  return clampNumber(Math.floor(configured), MIN_LINK_TTL_SECONDS, MAX_LINK_TTL_SECONDS);
};

const getCheckoutSigningSecret = (): string => {
  const configured =
    normalizeText(process.env.CHECKOUT_LINK_SECRET, 400) ||
    normalizeText(process.env.CHECKOUT_LINK_SIGNING_SECRET, 400) ||
    normalizeText(process.env.NEXTAUTH_SECRET, 400);

  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') return '';
  return 'xmarty-checkout-local-dev-secret';
};

export const resolveCheckoutBaseUrl = (hostname: string): string => {
  const configured =
    normalizeBaseUrl(process.env.CHECKOUT_LINK_BASE_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_CHECKOUT_APP_URL);

  if (configured) return configured;
  if (isLocalHostname(hostname)) return LOCAL_CHECKOUT_BASE_URL;
  return DEFAULT_CHECKOUT_BASE_URL;
};

export const buildCheckoutSignaturePayload = ({
  courseSlug,
  expiresAtUnix,
  nonce,
  source,
  reference,
}: BuildSignaturePayloadInput): string =>
  [courseSlug, String(expiresAtUnix), nonce, normalizeText(source), normalizeText(reference)].join('|');

const signPayload = (payload: string): string => {
  const secret = getCheckoutSigningSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('hex');
};

export function createTimeLimitedCheckoutLink({
  courseSlug,
  hostname,
  source,
  reference,
}: CheckoutLinkInput): CheckoutLinkResult {
  const safeSlug = normalizeCourseSlug(courseSlug);
  if (!safeSlug) {
    throw new Error('Invalid course slug');
  }

  const expiresInSeconds = getCheckoutLinkTtlSeconds();
  const expiresAtUnix = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const nonce = randomUUID().replace(/-/g, '');
  const safeSource = normalizeText(source) || 'course-preview';
  const safeReference = normalizeText(reference);
  const payload = buildCheckoutSignaturePayload({
    courseSlug: safeSlug,
    expiresAtUnix,
    nonce,
    source: safeSource,
    reference: safeReference,
  });
  const signature = signPayload(payload);
  const baseUrl = resolveCheckoutBaseUrl(hostname);
  const url = new URL(`/${encodeURIComponent(safeSlug)}`, `${trimTrailingSlash(baseUrl)}/`);

  url.searchParams.set('course', safeSlug);
  url.searchParams.set('source', safeSource);
  if (safeReference) {
    url.searchParams.set('ref', safeReference);
  }
  url.searchParams.set('exp', String(expiresAtUnix));
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('v', LINK_VERSION);
  if (signature) {
    url.searchParams.set('sig', signature);
  }

  return {
    url: url.toString(),
    courseSlug: safeSlug,
    baseUrl,
    expiresAt: new Date(expiresAtUnix * 1000).toISOString(),
    expiresInSeconds,
    signature,
    version: LINK_VERSION,
  };
}
