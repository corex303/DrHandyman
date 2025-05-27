'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const targetUrl = searchParams.get('target');
    const defaultUrl = '/'; // Fallback to homepage if no target

    // Perform the client-side redirect
    if (targetUrl) {
      router.replace(targetUrl);
    } else {
      router.replace(defaultUrl);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-lg rounded-lg text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we take you to your page.</p>
        {/* Optional: Add a spinner here */}
      </div>
    </div>
  );
} 