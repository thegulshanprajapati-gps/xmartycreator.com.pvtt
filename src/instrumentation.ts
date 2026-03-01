import { createGitHubFetchWrapper } from '@/lib/github-fetch';

type GlobalFetchState = {
  __xmartyGitHubFetchPatched?: boolean;
};

export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const globalState = globalThis as typeof globalThis & GlobalFetchState;
  if (globalState.__xmartyGitHubFetchPatched) {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = createGitHubFetchWrapper(originalFetch);
  globalState.__xmartyGitHubFetchPatched = true;
}

