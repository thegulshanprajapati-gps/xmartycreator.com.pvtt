import { getSiteSettings } from '@/lib/site-settings';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return Response.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: 'Failed to fetch site settings', details: message }, { status: 500 });
  }
}

