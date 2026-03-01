import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { buildTestAppUrl, resolveTestAppBaseUrl } from '@/lib/subdomain-links';

export default async function AdminEditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const host = (await headers()).get('host') || '';
  const targetUrl = buildTestAppUrl(
    `/admin/tests/${encodeURIComponent(id)}/edit?source=main-admin`,
    resolveTestAppBaseUrl(host)
  );

  redirect(targetUrl);
}
