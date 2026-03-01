import { redirect } from 'next/navigation';

type SearchParams = {
  callbackUrl?: string;
};

export default function StudentLoginRedirectPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const callbackUrl =
    typeof searchParams?.callbackUrl === 'string' && searchParams.callbackUrl
      ? searchParams.callbackUrl
      : '/';

  redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

