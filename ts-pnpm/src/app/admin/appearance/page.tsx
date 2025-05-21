import Link from 'next/link';

export default function AppearanceSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Appearance Settings</h1>
      <p className="mb-6">Manage the visual appearance of your website, including general settings, colors, fonts, and more.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/appearance/general"
          className="block p-4 border rounded-lg hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">General</h2>
          <p>Site title, logo, favicon.</p>
        </Link>
        <Link href="/admin/appearance/colors-fonts"
          className="block p-4 border rounded-lg hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Colors & Fonts</h2>
          <p>Theme colors, typography.</p>
        </Link>
        <Link href="/admin/appearance/header-footer"
          className="block p-4 border rounded-lg hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Header & Footer</h2>
          <p>Customize header and footer sections.</p>
        </Link>
        <Link href="/admin/appearance/homepage"
          className="block p-4 border rounded-lg hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Homepage</h2>
          <p>Homepage layout and content.</p>
        </Link>
        {/* Add more links as other appearance sub-sections are created */}
      </div>
    </div>
  );
} 