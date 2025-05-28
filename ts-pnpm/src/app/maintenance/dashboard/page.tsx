"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Button from '@/components/buttons/Button';
// No longer using next-auth for this page
// import { useSession, signOut } from 'next-auth/react'; 
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// export async function getServerSideProps(context: any) {
//   const session = await getServerSession(context.req, context.res, authOptions);

//   if (!session || session.user?.role !== 'MAINTENANCE') {
//     return {
//       redirect: {
//         destination: '/maintenance/login?error=AccessDenied',
//         permanent: false,
//       },
//     };
//   }

//   return {
//     props: { session }, 
//   };
// }

export default function MaintenanceDashboardPage() {
  const router = useRouter();
  // const { data: session, status } = useSession(); // No longer needed

  const handleLogout = async () => {
    try {
      await fetch('/api/maintenance/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error("Failed to logout from maintenance session", error);
      // Even if API call fails, attempt to redirect
    } finally {
      router.push('/maintenance/login');
    }
  };

  // Middleware now handles the auth check. 
  // If the user reaches this page, they are considered authenticated for maintenance.

  // if (status === "loading") {
  //   return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  // }

  // if (status === "unauthenticated" || session?.user?.role !== 'MAINTENANCE') {
  //   // This should ideally be caught by middleware or getServerSideProps earlier
  //   // router.push('/maintenance/login?error=AccessDenied'); 
  //   // return <div className="flex justify-center items-center min-h-screen">Redirecting to login...</div>;
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
  //       <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
  //         <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
  //         <p className="text-gray-700 mb-6">
  //           You do not have permission to access this page.
  //         </p>
  //         <Button onClick={() => router.push('/maintenance/login')} className="w-full">
  //           Go to Login
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Maintenance Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Placeholder for future functionality, e.g., photo upload form */}
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-blue-700 mb-3">Upload Work Photos</h2>
            <p className="text-gray-600 mb-4">
              Submit before and after photos of the completed maintenance work.
            </p>
            {/* Example link, can be developed into a form/component */}
            <Link href="/maintenance/dashboard/upload" passHref>
              <Button variant="primary" className="w-full">Go to Photo Upload</Button>
            </Link>
          </div>

          {/* New Card for Chat/Messages */}
          <div className="bg-purple-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-purple-700 mb-3">Messages & Chat</h2>
            <p className="text-gray-600 mb-4">
              Communicate with customers and administrative staff.
            </p>
            <Link href="/maintenance/dashboard/chat" passHref>
              <Button variant="outline" className="w-full">Open Chat</Button>
            </Link>
          </div>

          {/* Placeholder for another feature */}
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-green-700 mb-3">View Work Orders</h2>
            <p className="text-gray-600 mb-4">
              Access the list of assigned maintenance tasks and their details.
            </p>
            <Button variant="outline" className="w-full" onClick={() => alert('Feature coming soon!')}>
              View Work Orders (Soon)
            </Button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            For assistance, contact support.
          </p>
        </div>
      </div>
    </div>
  );
} 