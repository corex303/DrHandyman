'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Using next/navigation for App Router

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCredentialsSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually to show errors on this page
        email,
        password,
      });

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
      } else if (result?.ok) {
        // Successful sign-in, redirect to home or dashboard
        router.push('/'); // Or a protected route like '/dashboard'
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error("Sign-in error:", err);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // Redirects to Google, then back to the callback URL configured in NextAuth and GCP
    // No need to handle result here as NextAuth handles the redirect flow
    await signIn('google', { callbackUrl: '/' }); 
    // setIsLoading(false); // This line might not be reached if redirect happens immediately
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Sign In</h1>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCredentialsSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading} style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isLoading ? 'Signing In...' : 'Sign In with Email'}
        </button>
      </form>

      <hr style={{ margin: '20px 0' }} />

      <button 
        onClick={handleGoogleSignIn} 
        disabled={isLoading} 
        style={{ width: '100%', padding: '10px', backgroundColor: '#db4437', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {isLoading ? 'Redirecting...' : 'Sign In with Google'}
      </button>
    </div>
  );
} 