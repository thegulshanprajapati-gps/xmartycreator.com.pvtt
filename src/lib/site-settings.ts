import clientPromise from './mongodb';

export type CursorStyle =
  | 'sparkle'
  | 'neon'
  | 'classic'
  | 'magic'
  | 'pulse'
  | 'orbit'
  | 'glow'
  | 'ripple';

export type SiteSettings = {
  cursorStyle: CursorStyle;
  loginButtonOnlyOnBceceLe: boolean;
};

const CURSOR_STYLE_SET = new Set<CursorStyle>([
  'sparkle',
  'neon',
  'classic',
  'magic',
  'pulse',
  'orbit',
  'glow',
  'ripple',
]);

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  cursorStyle: 'sparkle',
  loginButtonOnlyOnBceceLe: false,
};

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
      return false;
    }
  }
  return fallback;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const collection = db.collection('site_settings');
    const doc =
      (await collection.findOne({ slug: 'global' })) ||
      (await collection.findOne({}));

    if (!doc) {
      return DEFAULT_SITE_SETTINGS;
    }

    const rawCursorStyle =
      (doc as any).cursorStyle ||
      (doc as any)?.content?.cursorStyle ||
      DEFAULT_SITE_SETTINGS.cursorStyle;

    const cursorStyle = CURSOR_STYLE_SET.has(rawCursorStyle)
      ? (rawCursorStyle as CursorStyle)
      : DEFAULT_SITE_SETTINGS.cursorStyle;

    const rawLoginButtonOnlyOnBceceLe =
      (doc as any).loginButtonOnlyOnBceceLe ??
      (doc as any)?.content?.loginButtonOnlyOnBceceLe ??
      DEFAULT_SITE_SETTINGS.loginButtonOnlyOnBceceLe;

    const loginButtonOnlyOnBceceLe = parseBoolean(
      rawLoginButtonOnlyOnBceceLe,
      DEFAULT_SITE_SETTINGS.loginButtonOnlyOnBceceLe
    );

    return { cursorStyle, loginButtonOnlyOnBceceLe };
  } catch (error) {
    console.error('❌ [Site Settings] Failed to fetch settings:', error);
    return DEFAULT_SITE_SETTINGS;
  }
}

export function isValidCursorStyle(value: string | null | undefined): value is CursorStyle {
  return Boolean(value && CURSOR_STYLE_SET.has(value as CursorStyle));
}
