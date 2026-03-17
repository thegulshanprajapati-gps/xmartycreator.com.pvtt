const XMARTY_ROOT_DOMAIN = 'xmartycreator.com';

const normalizeCandidate = (value?: string) => (value || '').trim();

const toHostname = (value: string) => {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    try {
      return new URL(`https://${value}`).hostname.toLowerCase();
    } catch {
      return '';
    }
  }
};

const toCookieDomain = (hostname: string) => {
  if (!hostname) return '';
  if (hostname === XMARTY_ROOT_DOMAIN || hostname.endsWith(`.${XMARTY_ROOT_DOMAIN}`)) {
    return `.${XMARTY_ROOT_DOMAIN}`;
  }
  return '';
};

export function resolveSharedCookieDomain() {
  const explicit = normalizeCandidate(process.env.SESSION_COOKIE_DOMAIN);
  if (explicit) return explicit;

  const candidates = [
    normalizeCandidate(process.env.NEXT_PUBLIC_URL),
    normalizeCandidate(process.env.NEXTAUTH_URL),
  ];

  for (const candidate of candidates) {
    const hostname = toHostname(candidate);
    const domain = toCookieDomain(hostname);
    if (domain) return domain;
  }

  return '';
}
