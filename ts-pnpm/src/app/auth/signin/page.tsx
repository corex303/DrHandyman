'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import React, { Suspense, FormEvent, useEffect, useState } from 'react';

// New component to handle logic depending on useSearchParams
function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      const callbackUrl = searchParams.get('callbackUrl');
      const target = callbackUrl || '/portal';
      router.replace(`/auth/redirecting?target=${encodeURIComponent(target)}`);
      return;
    }

    const err = searchParams.get('error');
    const msg = searchParams.get('message');
    
    if (err) {
      switch (err) {
        case 'EmailSignin':
        case 'EmailSendError':
          setError('Failed to send the sign-in link. Please try again or contact support.');
          break;
        case 'Configuration':
          setError('There is a server configuration error. Please contact support.');
          break;
        case 'Verification':
        case 'VerificationInvalidToken':
        case 'VerificationMissingToken':
          setError('The sign-in/verification link is invalid or has been used. Please try sending a new one.');
          break;
        case 'VerificationExpiredToken':
          setError('The sign-in/verification link has expired. Please request a new one.');
          break;
        case 'VerificationFailed':
            setError('Email verification failed. Please try again or contact support.');
            break;
        case 'MissingCredentials':
            setError('Please enter both email and password.');
            break;
        case 'InvalidCredentials':
            setError('Invalid email or password. Please try again.');
            break;
        case 'EmailNotVerified':
            setError('Your email address is not verified. Please check your email for a verification link, or use the magic link option to resend one.');
            setMessage(null);
            break;
        default:
          setError(`An unknown error occurred: ${err}`);
      }
    }
    
    if (msg) {
        switch (msg) {
            case 'VerificationRequest':
                setMessage('A sign-in link has been sent to your email address.');
                break;
            case 'EmailVerified':
                setMessage('Your email has been verified successfully! You can now sign in with your password.');
                break;
        }
    }
  }, [searchParams, router, status]);

  const handleMagicLinkSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoadingMagicLink(true);

    if (!magicLinkEmail) {
      setError('Please enter your email address for the magic link.');
      setIsLoadingMagicLink(false);
      return;
    }

    try {
      const result = await signIn('email', {
        email: magicLinkEmail,
        redirect: false, 
      });

      if (result?.error) {
        if (result.error === 'EmailSignin' || result.error === 'EmailSendError') {
            setError('Could not send the sign-in email. Please check the email address or try again later.');
        } else {
            setError(result.error);
        }
        console.error("Magic Link Sign-in error:", result.error);
      } else {
        router.push('/auth/verify-request'); 
      }
    } catch (err) {
      setError('An unexpected error occurred during magic link sign-in. Please try again.');
      console.error("Magic Link Sign-in error catch:", err);
    }
    setIsLoadingMagicLink(false);
  };

  const handleCredentialsSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoadingCredentials(true);

    if (!email || !password) {
      setError('Please enter both your email and password.');
      setIsLoadingCredentials(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error === 'EmailNotVerified') {
            setError('Your email address is not verified. Please check your email for a verification link, or use the magic link option to resend one.');
        } else if (result.error === 'InvalidCredentials' || result.error === 'CredentialsSignin') {
            setError('Invalid email or password. Please try again.');
        } else {
            setError(`Sign-in failed: ${result.error}`);
        }
        console.error("Credentials Sign-in error:", result.error);
      } else if (result?.ok && result.url) {
        // Successful sign-in, redirect through intermediate page
        const callbackUrl = searchParams.get('callbackUrl'); // Check if original callbackUrl exists
        const target = callbackUrl || '/portal';
        router.push(`/auth/redirecting?target=${encodeURIComponent(target)}`);
      } else if (result?.ok && !result.url) {
        // Successful sign-in (e.g. already signed in via another tab, or no specific url to go to)
        const callbackUrl = searchParams.get('callbackUrl');
        const target = callbackUrl || '/portal';
        router.push(`/auth/redirecting?target=${encodeURIComponent(target)}`);
      }

    } catch (err) {
      setError('An unexpected error occurred during sign-in. Please try again.');
      console.error("Credentials Sign-in error catch:", err);
    }
    setIsLoadingCredentials(false);
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or
          <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500 ml-1">
            create a new account
          </Link>
        </p>
      </div>
      
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
      {message && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">{message}</p>}

      <form onSubmit={handleCredentialsSignIn} className="mt-8 space-y-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 text-center">Sign in with password</h3>
        <div className="rounded-md shadow-sm space-y-3">
          <div>
            <label htmlFor="credentials-email" className="sr-only">Email address</label>
            <input
              id="credentials-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoadingCredentials || isLoadingMagicLink}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoadingCredentials || isLoadingMagicLink}
            />
          </div>
        </div>
        <div>
          <button 
            type="submit" 
            disabled={isLoadingCredentials || isLoadingMagicLink}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
          >
            {isLoadingCredentials ? 'Signing in...' : 'Sign In with Password'}
          </button>
        </div>
      </form>

      {/* Divider for OR */}
      <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
      </div>

      {/* Magic Link Form - Corrected Placement */}
      <div className="mt-8 space-y-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 text-center">Sign in with a magic link</h3>
        <p className="text-center text-sm text-gray-600">We'll email you a link to sign in instantly.</p>
        <form onSubmit={handleMagicLinkSignIn} className="mt-2">
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="magiclink-email" className="sr-only">Email address</label>
              <input
                id="magiclink-email"
                name="magiclink-email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address for magic link"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                disabled={isLoadingCredentials || isLoadingMagicLink}
              />
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              disabled={isLoadingMagicLink || isLoadingCredentials}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary-500 hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-400 disabled:bg-gray-400 mt-3"
            >
              {isLoadingMagicLink ? 'Sending Link...' : 'Send Magic Link'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm">
          <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center"><p>Loading page...</p></div>}>
        <SignInContent />
      </Suspense>
    </div>
  );
} 