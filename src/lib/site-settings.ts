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

    return { cursorStyle };
  } catch (error) {
    console.error('❌ [Site Settings] Failed to fetch settings:', error);
    return DEFAULT_SITE_SETTINGS;
  }
}

export function isValidCursorStyle(value: string | null | undefined): value is CursorStyle {
  return Boolean(value && CURSOR_STYLE_SET.has(value as CursorStyle));
}
