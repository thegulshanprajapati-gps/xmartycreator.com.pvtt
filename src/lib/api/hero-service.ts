export type HeroContent = {
  heading: string;
  subheading: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  isActive: boolean;
};

export const DEFAULT_HERO_FALLBACK_CONTENT: HeroContent = {
  heading: 'BCECE LE 2026 Admissions Open',
  subheading: 'Limited Seats | Batch Starting Soon | Expert Faculty',
  primaryButtonText: 'Enroll Now',
  primaryButtonLink: '/courses',
  secondaryButtonText: 'Download Syllabus',
  secondaryButtonLink: '#',
  isActive: true,
};

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeHeroPayload(payload: unknown): HeroContent | null {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Partial<HeroContent>;
  const heading = sanitizeString(data.heading);
  const subheading = sanitizeString(data.subheading);
  const primaryButtonText = sanitizeString(data.primaryButtonText);
  const primaryButtonLink = sanitizeString(data.primaryButtonLink);
  const secondaryButtonText = sanitizeString(data.secondaryButtonText);
  const secondaryButtonLink = sanitizeString(data.secondaryButtonLink);
  const isActive = data.isActive === true;

  if (
    !heading
    || !subheading
    || !primaryButtonText
    || !primaryButtonLink
    || !secondaryButtonText
    || !secondaryButtonLink
    || !isActive
  ) {
    return null;
  }

  return {
    heading,
    subheading,
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink,
    isActive,
  };
}

export async function fetchHeroContent(signal?: AbortSignal): Promise<HeroContent | null> {
  const response = await fetch('/api/hero', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Hero API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return normalizeHeroPayload(payload);
}
