'use client';

export default function SiteSettingsPage() {
  // TODO: Replace with actual form handling (e.g., React Hook Form, Zod) and state management

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Placeholder for form submission logic
    alert('Site settings submitted (placeholder)');
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Site Settings & Configuration</h1>
      <p className="mb-8 text-gray-600">Manage global site settings, API keys, integrations, and general site behavior.</p>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg shadow-md p-6">
        {/* Section: General Site Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input type="text" name="siteName" id="siteName" defaultValue="Dr. Handyman" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">Admin Contact Email</label>
              <input type="email" name="adminEmail" id="adminEmail" defaultValue="admin@drhandyman.com" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
        </div>

        {/* Section: API Keys & Integrations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">API Keys & Integrations</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="stripeApiKey" className="block text-sm font-medium text-gray-700 mb-1">Stripe API Key (Secret)</label>
              <input type="password" name="stripeApiKey" id="stripeApiKey" placeholder="sk_test_********" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="googleAnalyticsId" className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
              <input type="text" name="googleAnalyticsId" id="googleAnalyticsId" placeholder="UA-XXXXX-Y" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            {/* Add more integration fields as needed */}
          </div>
        </div>
        
        {/* Section: Maintenance Mode */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Maintenance Mode</h2>
          <div className="flex items-center">
            <input id="maintenanceMode" name="maintenanceMode" type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">Enable Maintenance Mode</label>
          </div>
          <p className="text-xs text-gray-500 mt-1">When enabled, site visitors will be redirected to a maintenance page.</p>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200">
          <div className="flex justify-end">
            <button type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3">
              Cancel
            </button>
            <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 