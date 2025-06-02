'use client';

import Link from 'next/link';
import Image from 'next/image'; // Added Image
import { usePathname } from 'next/navigation';
// import { AppearanceSettings } from '@/types/appearance'; // AppearanceSettings not directly used
import { useSession } from 'next-auth/react'; // Import useSession
import { createRef,useEffect, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

import { accessibleKeyboardEventHandler,trapFocus } from '@/lib/accessibility';

// Removed hardcoded serviceCategories as navLinks will be dynamic
// export const serviceCategories = [...];

interface NavLink {
  id: string;
  text: string;
  href: string;
  subLinks?: NavLink[];
  iconSrc?: string; // Added iconSrc
}

interface DesktopNavigationProps {
  navLinks?: NavLink[];
  showCta?: boolean;
  ctaText?: string;
  ctaLink?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
}

const DesktopNavigation = ({ 
  navLinks: propNavLinks,
  showCta,
  ctaText,
  ctaLink,
  ctaBackgroundColor,
  ctaTextColor,
}: DesktopNavigationProps) => {
  const { data: session, status } = useSession(); // Get session data
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Correctly initialize refs for dynamic elements
  const dropdownContainerRefs = useRef<Record<string, React.RefObject<HTMLLIElement>>>({});
  const dropdownButtonRefs = useRef<Record<string, React.RefObject<HTMLButtonElement>>>({});

  const pathname = usePathname();

  const serviceCategoriesWithIcons = [
    { id: 'roofing', text: 'Roofing', href: '/services/roofing', iconSrc: '/images/icons/roofing.png' },
    { id: 'plumbing', text: 'Plumbing', href: '/services/plumbing', iconSrc: '/images/icons/plumb.png' },
    { id: 'painting', text: 'Painting', href: '/services/painting', iconSrc: '/images/icons/paint.png' },
    { id: 'hvac', text: 'HVAC', href: '/services/hvac', iconSrc: '/images/icons/hvac.png' },
    { id: 'flooring', text: 'Flooring', href: '/services/flooring', iconSrc: '/images/icons/flooring.png' },
    { id: 'exterior-work', text: 'Exterior Work', href: '/services/exterior-work', iconSrc: '/images/icons/exterior.png' },
    { id: 'electrical', text: 'Electrical', href: '/services/electrical', iconSrc: '/images/icons/electric.png' },
    { id: 'general-repair', text: 'General Repair', href: '/services/general-repair', iconSrc: '/images/icons/repair.png' },
  ];

  const baseNavLinks = propNavLinks || [
    { id: 'home', text: 'Home', href: '/' },
    { 
      id: 'services', 
      text: 'Services', 
      href: '/services', // Main services overview page
      subLinks: serviceCategoriesWithIcons 
    },
    { id: 'about', text: 'About Us', href: '/about' },
  ];

  const actualNavLinks = [...baseNavLinks];

  if (status === 'authenticated' && session?.user?.role === 'CUSTOMER') {
    actualNavLinks.push({ id: 'portal', text: 'Customer Portal', href: '/portal' });
  }

  // Ensure refs are created for each dropdown link based on actualNavLinks
  actualNavLinks.forEach(link => {
    if (link.subLinks && link.subLinks.length > 0) {
      if (!dropdownContainerRefs.current[link.id]) {
        dropdownContainerRefs.current[link.id] = createRef<HTMLLIElement>();
      }
      if (!dropdownButtonRefs.current[link.id]) {
        dropdownButtonRefs.current[link.id] = createRef<HTMLButtonElement>();
      }
    }
  });

  const ctaDetails = {
    text: ctaText || 'Contact Us',
    link: ctaLink || '/contact',
    bgColor: ctaBackgroundColor,
    textColor: ctaTextColor,
  };

  const toggleDropdown = (linkId: string) => {
    setOpenDropdownId(prevId => (prevId === linkId ? null : linkId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const currentDropdownRef = dropdownContainerRefs.current[openDropdownId];
        if (currentDropdownRef && currentDropdownRef.current && !currentDropdownRef.current.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const handleDropdownKeyDown = (event: React.KeyboardEvent, linkId: string) => {
    if (openDropdownId === linkId) {
      const currentDropdownRef = dropdownContainerRefs.current[linkId];
      const currentButtonRef = dropdownButtonRefs.current[linkId];
      if (currentDropdownRef && currentDropdownRef.current) {
        trapFocus(currentDropdownRef, event); // Pass the RefObject directly
      }
      if (event.key === 'Escape') {
        setOpenDropdownId(null);
        currentButtonRef?.current?.focus();
      }
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    const parentLink = actualNavLinks.find(link => link.href === href && link.subLinks);
    if (parentLink && parentLink.subLinks?.some(sub => pathname?.startsWith(sub.href))) {
        return true;
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="hidden lg:block">
      <ul className="flex items-center space-x-8">
        {actualNavLinks.map((link) => {
          if (link.subLinks && link.subLinks.length > 0) {
            const isDropdownOpen = openDropdownId === link.id;
            return (
              <li 
                key={link.id} 
                className="relative" 
                ref={dropdownContainerRefs.current[link.id]} // Assign the RefObject
                onKeyDown={(e) => handleDropdownKeyDown(e, link.id)}
              >
                <button 
                  ref={dropdownButtonRefs.current[link.id]} // Assign the RefObject
                  onClick={() => toggleDropdown(link.id)}
                  onKeyDown={accessibleKeyboardEventHandler(
                    () => toggleDropdown(link.id),
                    () => setOpenDropdownId(null), // Close on Tab/Shift+Tab away
                    () => toggleDropdown(link.id)
                  )}
                  className={`flex items-center focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-primary-navy rounded-md p-1 ${isActive(link.href) ? 'text-text-light font-medium' : 'text-secondary-gray-light'} hover:text-text-light transition-colors`}
                  aria-expanded={isDropdownOpen}
                  aria-controls={`${link.id}-desktop-dropdown`}
                  aria-haspopup="true"
                >
                  {link.text} <FaChevronDown className={`ml-1 h-3 w-3 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div 
                    id={`${link.id}-desktop-dropdown`}
                    className="absolute left-0 top-full mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg z-10" // Added z-10
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby={`${link.id}-menu-button`}
                  >
                    {link.subLinks.map((subLink) => (
                      <Link 
                        key={subLink.id}
                        href={subLink.href}
                        className={`block px-4 py-2 text-sm ${isActive(subLink.href) ? 'bg-gray-100 text-primary-500 font-medium' : 'text-gray-700'} hover:bg-gray-100 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        onClick={() => setOpenDropdownId(null)} // Close dropdown on sublink click
                        role="menuitem"
                      >
                        {subLink.iconSrc && (
                          <Image 
                            src={subLink.iconSrc} 
                            alt={`${subLink.text} icon`} 
                            width={20} 
                            height={20} 
                            className="mr-2 inline-block" 
                          />
                        )}
                        {subLink.text}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          }
          // Regular link without sublinks
          return (
            <li key={link.id}>
              <Link 
                href={link.href} 
                className={`${isActive(link.href) ? 'text-text-light font-medium' : 'text-secondary-gray-light'} hover:text-text-light focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-primary-navy rounded-md p-1 transition-colors`}
              >
                {link.text}
              </Link>
            </li>
          );
        })}
        {showCta && ctaDetails.link && (
          <li>
            <Link 
              href={ctaDetails.link} 
              className="rounded-md px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-accent-gold bg-accent-gold text-primary-navy hover:bg-yellow-600 font-semibold"
            >
              {ctaDetails.text}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default DesktopNavigation; 