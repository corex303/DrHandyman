import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  redirect('/admin/dashboard');
  // This component will not render anything as redirect() throws an error.
  // However, Next.js requires a default export for a page.
  return null;
} 