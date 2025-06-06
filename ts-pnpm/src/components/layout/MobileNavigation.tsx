'use client';

import Image from 'next/image'; // Added Image
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { AppearanceSettings } from '@/types/appearance'; // Not directly used
import { useSession } from 'next-auth/react'; // Import useSession
import { useEffect,useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

// import { serviceCategories } from './DesktopNavigation'; // Removed hardcoded import
import { accessibleKeyboardEventHandler,trapFocus } from '@/lib/accessibility';

import WrappedReactIcon from '@/components/ui/WrappedReactIcon'; // Added import

interface NavLink {
  id: string;
  text: string;
  href: string;
  subLinks?: NavLink[];
  iconSrc?: string; // Added iconSrc
}

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks?: NavLink[];
  showCta?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

const MobileNavigation = ({ 
  isOpen, 
  onClose, 
  navLinks: propNavLinks,
  showCta,
  ctaText,
  ctaLink,
}: MobileNavigationProps) => {
  const { data: session } = useSession();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const portalLink = { id: 'portal-dashboard', text: 'Customer Portal', href: '/portal/dashboard' };
  const shouldShowPortalLink = session && session.user?.role === 'CUSTOMER';

  let finalNavLinks = propNavLinks ? [...propNavLinks] : [];

  if (shouldShowPortalLink) {
    // If showing portal link, filter out the login link
    finalNavLinks = finalNavLinks.filter(link => link.id !== 'customer-login');
    finalNavLinks.push(portalLink);
  } else if (session) {
    // If any other user is logged in, hide the login link, but don't add portal link
    finalNavLinks = finalNavLinks.filter(link => link.id !== 'customer-login');
  }

  const ctaDetails = {
    text: ctaText || 'Contact Us',
    link: ctaLink || '/contact',
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && mobileMenuRef.current) {
      const firstFocusable = mobileMenuRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )[0] as HTMLElement;
      
      setTimeout(() => {
        firstFocusable?.focus();
      }, 50);
    }
  }, [isOpen]);

  const toggleDropdown = (linkId: string) => {
    setOpenDropdownId(openDropdownId === linkId ? null : linkId);
  };

  const isActive = (href: string, subLinks?: NavLink[]) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (subLinks && subLinks.some(sub => pathname?.startsWith(sub.href))) {
      return true;
    }
    return pathname?.startsWith(href);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (mobileMenuRef.current) {
      trapFocus(mobileMenuRef, event);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute left-0 top-20 z-40 w-full bg-white p-4 shadow-md lg:hidden"
      ref={mobileMenuRef}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
    >
      <nav className="overflow-y-auto max-h-[calc(100vh-10rem)]">
        <ul className="flex flex-col space-y-1">
          {finalNavLinks.map((link) => {
            if (link.subLinks && link.subLinks.length > 0) {
              const isDropdownOpen = openDropdownId === link.id;
              return (
                <li key={link.id}>
                  <button
                    onClick={() => toggleDropdown(link.id)}
                    onKeyDown={accessibleKeyboardEventHandler(
                      () => toggleDropdown(link.id),
                      undefined, 
                      () => toggleDropdown(link.id)
                    )}
                    className={`flex w-full items-center justify-between py-2.5 px-2 rounded-md ${isActive(link.href, link.subLinks) ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'} hover:bg-gray-100 hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    aria-expanded={isDropdownOpen}
                    aria-controls={`${link.id}-mobile-submenu`}
                  >
                    {link.text}
                    <WrappedReactIcon icon={FaChevronDown} className={`h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div 
                      id={`${link.id}-mobile-submenu`} 
                      className="ml-4 mt-1 mb-1 flex flex-col space-y-1 border-l-2 border-gray-200 pl-3 pt-1"
                      role="menu"
                      aria-labelledby={`${link.id}-mobile-button`}
                    >
                      {link.subLinks.map((subLink: NavLink) => (
                        <Link 
                          key={subLink.id}
                          href={subLink.href}
                          className={`block py-2 px-2 rounded-md ${isActive(subLink.href) ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-600'} hover:bg-gray-100 hover:text-primary-600 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-400`}
                          onClick={onClose}
                          role="menuitem"
                        >
                          {subLink.iconSrc && (
                            <Image 
                              src={subLink.iconSrc} 
                              alt={`${subLink.text} icon`} 
                              width={20} 
                              height={20} 
                              className="mr-2 inline-block align-middle" // align-middle for better text alignment
                            />
                          )}
                          <span className="align-middle">{subLink.text}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            }
            return (
              <li key={link.id}>
                <Link 
                  href={link.href} 
                  className={`block py-2.5 px-2 rounded-md ${isActive(link.href) ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'} hover:bg-gray-100 hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  onClick={onClose}
                >
                  {link.text}
                </Link>
              </li>
            );
          })}
          {showCta && ctaDetails.link && (
            <li className="mt-3 pt-3 border-t border-gray-200">
              <Link 
                href={ctaDetails.link} 
                className="block rounded-md bg-accent-gold px-4 py-2.5 text-center text-base font-semibold text-primary-navy hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-accent-gold"
                onClick={onClose}
              >
                {ctaDetails.text}
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default MobileNavigation;