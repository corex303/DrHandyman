'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChevronRight, FaHome } from 'react-icons/fa';

import WrappedReactIcon from '@/components/ui/WrappedReactIcon';

// Custom mapping for breadcrumb labels
const breadcrumbNameMap: Record<string, string> = {
  services: 'Services',
  about: 'About Us',
  contact: 'Contact Us',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  payment: 'Payment Options',
  // Service pages
  flooring: 'Flooring',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  painting: 'Painting',
  roofing: 'Roofing',
  exterior: 'Exterior',
  repairs: 'Repairs',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // If we're on the homepage, don't render breadcrumbs
  if (pathname === '/') {
    return null;
  }
  
  // Split the pathname into segments and remove empty segments
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // If there are no segments (we're on the homepage), don't render
  if (pathSegments.length === 0) {
    return null;
  }
  
  // Build breadcrumb data with segment names and paths
  const breadcrumbs = pathSegments.map((segment, index) => {
    // Build the path for this breadcrumb
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    
    // Get the display name from our map, or use a capitalized version of the segment
    const name = breadcrumbNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    return { name, path };
  });
  
  return (
    <nav className="flex w-full bg-gray-50 px-4 py-3" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center space-x-2">
        <li className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center text-gray-600 hover:text-primary-500 transition-colors"
          >
            <WrappedReactIcon icon={FaHome} className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={breadcrumb.path} className="flex items-center">
              <WrappedReactIcon
                icon={FaChevronRight}
                className="mx-2 h-3 w-3 text-gray-400"
                aria-hidden="true"
              />
              {isLast ? (
                <span className="font-medium text-primary-600" aria-current="page">
                  {breadcrumb.name}
                </span>
              ) : (
                <Link 
                  href={breadcrumb.path}
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
} 