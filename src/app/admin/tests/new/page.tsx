import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { buildTestAppUrl, resolveTestAppBaseUrl } from '@/lib/subdomain-links';

export default async function AdminNewTestPage() {
  const host = (await headers()).get('host') || '';
  const targetUrl = buildTestAppUrl(
    '/admin/tests/create?source=main-admin',
    resolveTestAppBaseUrl(host)
  );

  redirect(targetUrl);
}
