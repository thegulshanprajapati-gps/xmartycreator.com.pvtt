
'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function UnauthorizedToast() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unauthorized = searchParams.get('unauthorized');
        if (unauthorized === 'true') {
            toast({
                title: 'Unauthorized',
                description: 'You must be logged in as an admin to view that page. Please log in.',
                variant: 'destructive',
            });
            // Clean up the URL by replacing the history state
            const timer = setTimeout(() => {
                router.replace(pathname, { scroll: false });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [searchParams, toast, pathname, router]);

    return null;
}
