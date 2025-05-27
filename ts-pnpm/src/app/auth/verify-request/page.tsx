export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Check your email
        </h2>
        <p className="text-gray-600">
          A sign-in link has been sent to your email address.
        </p>
        <p className="text-sm text-gray-500">
          Please check your inbox (and spam folder) to complete your sign-in.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          You can close this window.
        </p>
      </div>
    </div>
  );
} 