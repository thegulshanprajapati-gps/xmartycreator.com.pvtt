import { NextRequest } from 'next/server';

const SUSPICIOUS_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
  'python', 'java', 'php', 'perl', 'ruby', 'go', 'rust',
  'headless', 'puppeteer', 'selenium', 'playwright'
];

const BROWSER_USER_AGENTS = [
  'mozilla', 'chrome', 'firefox', 'safari', 'edge', 'opera'
];

export interface BotDetectionResult {
  isBot: boolean;
  score: number;
  reasons: string[];
}

export function detectBot(req: NextRequest): BotDetectionResult {
  const reasons: string[] = [];
  let score = 0;

  const userAgent = (req.headers.get('user-agent') || '').toLowerCase();
  const referer = req.headers.get('referer') || '';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

  // Check User-Agent
  const isSuspiciousUA = SUSPICIOUS_USER_AGENTS.some(ua => userAgent.includes(ua));
  const isBrowserUA = BROWSER_USER_AGENTS.some(ua => userAgent.includes(ua));

  if (isSuspiciousUA) {
    score += 40;
    reasons.push('Suspicious user agent');
  }

  if (!isBrowserUA && userAgent.length < 10) {
    score += 30;
    reasons.push('Missing or invalid browser user agent');
  }

  // Check for missing headers
  if (!req.headers.get('accept')) {
    score += 15;
    reasons.push('Missing Accept header');
  }

  if (!req.headers.get('accept-language')) {
    score += 10;
    reasons.push('Missing Accept-Language header');
  }

  if (!req.headers.get('accept-encoding')) {
    score += 10;
    reasons.push('Missing Accept-Encoding header');
  }

  // Check for suspicious patterns
  if (ip.includes('datacenter') || ip.includes('vps')) {
    score += 20;
    reasons.push('Datacenter/VPS IP detected');
  }

  // Check referer
  if (!referer && req.method === 'POST') {
    score += 15;
    reasons.push('Missing referrer on POST request');
  }

  // Check for rapid requests (rate limit check is separate)
  const accept = req.headers.get('accept') || '';
  if (!accept.includes('text/html') && req.method === 'GET') {
    score += 10;
    reasons.push('Non-browser Accept header on GET');
  }

  return {
    isBot: score >= 50,
    score,
    reasons: reasons.length > 0 ? reasons : [],
  };
}

export function getBotFingerprint(req: NextRequest): string {
  const components = [
    req.headers.get('user-agent') || 'unknown',
    req.headers.get('accept-language') || 'unknown',
    req.headers.get('accept-encoding') || 'unknown',
  ];
  
  return btoa(components.join('|'));
}
