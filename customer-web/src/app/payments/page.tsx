'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/payments');
  }, [router]);

  return null;
}
