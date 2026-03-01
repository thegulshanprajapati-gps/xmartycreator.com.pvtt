const GITHUB_API_HOST = 'api.github.com';
const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 900;
const DEFAULT_CACHE_TTL_MS = 120000;

type CacheEntry = {
  expiresAt: number;
  response: Response;
};

const githubResponseCache = new Map<string, CacheEntry>();

function getEnvNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getGitHubToken(): string {
  return (
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.NEXT_GITHUB_TOKEN ||
    ''
  ).trim();
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isGitHubApiRequest(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase() === GITHUB_API_HOST;
  } catch {
    return false;
  }
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit): string {
  return (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
}

function buildGitHubHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    const override = new Headers(init.headers);
    override.forEach((value, key) => headers.set(key, value));
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/vnd.github+json');
  }
  if (!headers.has('X-GitHub-Api-Version')) {
    headers.set('X-GitHub-Api-Version', '2022-11-28');
  }
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'xmarty-creator-app');
  }

  const token = getGitHubToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

function getCacheKey(url: string, method: string): string {
  return `${method}:${url}`;
}

function getFreshCachedResponse(cacheKey: string): Response | null {
  const cached = githubResponseCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    githubResponseCache.delete(cacheKey);
    return null;
  }
  return cached.response.clone();
}

function getStaleCachedResponse(cacheKey: string): Response | null {
  const cached = githubResponseCache.get(cacheKey);
  return cached ? cached.response.clone() : null;
}

function setCachedResponse(cacheKey: string, response: Response, ttlMs: number) {
  githubResponseCache.set(cacheKey, {
    expiresAt: Date.now() + ttlMs,
    response: response.clone(),
  });
}

function shouldRetry(response: Response): boolean {
  if (response.status === 429) return true;
  if (response.status >= 500) return true;
  if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
    return true;
  }
  return false;
}

function getRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
    const retryDate = Date.parse(retryAfter);
    if (Number.isFinite(retryDate)) {
      return Math.max(0, retryDate - Date.now());
    }
  }

  const resetRaw = response.headers.get('x-ratelimit-reset');
  const remaining = response.headers.get('x-ratelimit-remaining');
  if (remaining === '0' && resetRaw) {
    const resetSeconds = Number(resetRaw);
    if (Number.isFinite(resetSeconds) && resetSeconds > 0) {
      const delay = resetSeconds * 1000 - Date.now();
      if (delay > 0) return delay;
    }
  }

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelayMs(attempt: number): number {
  const base = getEnvNumber('GITHUB_FETCH_BASE_DELAY_MS', DEFAULT_BASE_DELAY_MS);
  const jitter = Math.floor(Math.random() * 250);
  return base * Math.pow(2, Math.max(0, attempt - 1)) + jitter;
}

async function fetchGitHubWithRetry(
  originalFetch: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = resolveRequestUrl(input);
  const method = resolveMethod(input, init);
  const cacheKey = getCacheKey(url, method);
  const cacheTtlMs = getEnvNumber('GITHUB_FETCH_CACHE_TTL_MS', DEFAULT_CACHE_TTL_MS);
  const maxRetries = getEnvNumber('GITHUB_FETCH_MAX_RETRIES', DEFAULT_RETRIES);
  const attemptCount = Math.max(1, maxRetries + 1);
  const useCache = method === 'GET' && cacheTtlMs > 0;

  if (useCache) {
    const cached = getFreshCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const headers = buildGitHubHeaders(input, init);
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attemptCount; attempt += 1) {
    try {
      const response = await originalFetch(input, { ...init, headers });
      lastResponse = response;

      if (response.ok) {
        if (useCache) {
          setCachedResponse(cacheKey, response, cacheTtlMs);
        }
        return response;
      }

      if (!shouldRetry(response) || attempt === attemptCount) {
        if (response.status === 429 && useCache) {
          const stale = getStaleCachedResponse(cacheKey);
          if (stale) return stale;
        }
        return response;
      }

      const retryAfterMs = getRetryAfterMs(response);
      const delayMs = retryAfterMs ?? getBackoffDelayMs(attempt);
      await wait(delayMs);
    } catch (error) {
      lastError = error;
      if (attempt === attemptCount) {
        break;
      }
      await wait(getBackoffDelayMs(attempt));
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error
    ? lastError
    : new Error('GitHub request failed without a response.');
}

export function createGitHubFetchWrapper(originalFetch: typeof fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveRequestUrl(input);
    if (!isGitHubApiRequest(url)) {
      return originalFetch(input, init);
    }
    return fetchGitHubWithRetry(originalFetch, input, init);
  }) as typeof fetch;
}

