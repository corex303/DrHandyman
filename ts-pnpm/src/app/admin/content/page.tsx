import Link from 'next/link';

export default function ContentManagementPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Content Management</h1>
      <p className="mb-8 text-gray-600">Manage various content sections of your website, such as services, testimonials, FAQ, and static page content.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card for Services Management */}
        <div className="p-6 bg-white border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Services</h2>
          <p className="text-gray-600 mb-4">Manage service categories, descriptions, and associated images/galleries.</p>
          <Link href="/admin/content/services" className="text-blue-600 hover:underline">
            Manage Services
          </Link>
          {/* TODO: Link to actual services management page (Task 15) */}
        </div>

        {/* Card for Testimonials Management */}
        <div className="p-6 bg-white border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Testimonials</h2>
          <p className="text-gray-600 mb-4">Add, edit, approve, and delete customer testimonials.</p>
          <Link href="/admin/content/testimonials" className="text-blue-600 hover:underline">
            Manage Testimonials
          </Link>
          {/* TODO: Link to actual testimonials management page (Task 18) */}
        </div>

        {/* Card for Portfolio Management */}
        <div className="p-6 bg-white border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Portfolio</h2>
          <p className="text-gray-600 mb-4">Manage portfolio items, approve worker uploads, and categorize projects.</p>
          <Link href="/admin/content/portfolio" className="text-blue-600 hover:underline">
            Manage Portfolio
          </Link>
          {/* TODO: Link to actual portfolio management page (Task 16) */}
        </div>
        
        {/* Card for Static Page Content (About, FAQ) */}
        <div className="p-6 bg-white border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Static Pages</h2>
          <p className="text-gray-600 mb-4">Edit content for pages like 'About Us', 'FAQ', etc.</p>
          <Link href="/admin/content/static-pages" className="text-blue-600 hover:underline">
            Manage Static Pages
          </Link>
          {/* TODO: Link to actual static page content management (Task 17) */}
        </div>
      </div>
    </div>
  );
} 