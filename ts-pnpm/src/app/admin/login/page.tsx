'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect,useState } from 'react';

import Button from '@/components/buttons/Button';
import Input from '@/components/forms/Input';
import Label from '@/components/forms/Label';

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'SessionExpired') {
      setError('Your session has expired. Please log in again.');
    } else if (errorParam === 'InvalidSession') {
      setError('Your session is invalid. Please log in again.');
    } else if (errorParam === 'AccessDenied') { // Though middleware now uses SessionExpired/InvalidSession
      setError('Access Denied. Please ensure you have the correct password.');
    } else if (errorParam) {
      setError('An error occurred. Please try again.')
    }
    // Optional: Clear the error query param from URL
    // const currentPath = window.location.pathname;
    // router.replace(currentPath, { scroll: false });
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const fromPath = searchParams.get('from') || '/admin/dashboard';
        router.push(fromPath);
      } else {
        const data = await response.json();
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error("Admin login fetch error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the global admin password to proceed
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <Label htmlFor="password">Global Admin Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Admin Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  {/* Icon placeholder */}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Enter Admin Portal"}
            </Button>
          </div>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Or{" "}
          <Link href="/" className="font-medium text-purple-600 hover:text-purple-500">
           return to homepage
          </Link>
        </p>
      </div>
    </div>
  );
} 