'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';
import { AppearanceSettings, defaultAppearanceSettings } from '@/types/appearance';

interface FooterProps {
  appearanceSettings?: AppearanceSettings;
}

const Footer = ({ appearanceSettings: propsAppearanceSettings }: FooterProps) => {
  const appearanceSettings = { ...defaultAppearanceSettings, ...propsAppearanceSettings };
  const footerSettings = {
    ...defaultAppearanceSettings.footer,
    ...(appearanceSettings.footer || {}),
  };

  const linkColumnsToDisplay = footerSettings.linkColumns || defaultAppearanceSettings.footer?.linkColumns || [];

  const initialExpandedState: Record<string, boolean> = {};
  linkColumnsToDisplay.forEach(col => {
    initialExpandedState[col.id] = false;
  });
  initialExpandedState['contact'] = false;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialExpandedState);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Static contact info for now, visibility controlled by footerSettings.showContactInfo
  const contactInfo = {
    address: '5108 NC Highway 55, Durham, NC 27713',
    phone: '(984) 244-0717',
    email: 'customerservice@drhandymannc.com',
    phoneHref: 'tel:9842440717',
    emailHref: 'mailto:customerservice@drhandymannc.com',
  };

  return (
    <footer 
      className="text-white"
      style={{
        backgroundColor: footerSettings.backgroundColor || defaultAppearanceSettings.footer?.backgroundColor || '#111827',
        color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor || '#D1D5DB',
      }}
    >
      <div className="layout mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xl font-bold" style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}>Dr. Handyman</h3>
            <p className="mb-4" style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}>
              Professional home repair and renovation services. Quality workmanship guaranteed.
            </p>
            {footerSettings.showSocialIcons && (
              <div className="flex space-x-4">
                <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <FaFacebook className="h-6 w-6 hover:text-primary-500 transition-colors" style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }} />
                </Link>
                <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <FaInstagram className="h-6 w-6 hover:text-primary-500 transition-colors" style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}/>
                </Link>
              </div>
            )}
          </div>

          {linkColumnsToDisplay.map((column) => (
            <div key={column.id}>
              <div className="flex items-center justify-between md:block">
                <h3 className="mb-4 text-xl font-bold" style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}>{column.title}</h3>
                {column.links.length > 0 && (
                  <button 
                    className="flex items-center md:hidden" 
                    onClick={() => toggleSection(column.id)}
                    aria-expanded={expandedSections[column.id]}
                    aria-controls={`${column.id}-list`}
                  >
                    <FaChevronDown 
                      className={`h-4 w-4 transform transition-transform ${expandedSections[column.id] ? 'rotate-180' : ''}`} 
                      style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}
                    />
                  </button>
                )}
              </div>
              {column.links.length > 0 && (
                <ul 
                  id={`${column.id}-list`}
                  className={`space-y-2 overflow-hidden transition-max-height duration-300 ease-in-out ${expandedSections[column.id] ? 'max-h-96' : 'max-h-0 md:max-h-96'}`}
                  style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}
                >
                  {column.links.map((link) => (
                    <li key={link.id}>
                      <Link href={link.href} className="hover:text-primary-500 transition-colors">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {footerSettings.showContactInfo && (
            <div>
              <div className="flex items-center justify-between md:block">
                <h3 className="mb-4 text-xl font-bold" style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}>Contact Us</h3>
                <button 
                  className="flex items-center md:hidden" 
                  onClick={() => toggleSection('contact')}
                  aria-expanded={expandedSections.contact}
                  aria-controls="contact-info-list"
                >
                  <FaChevronDown 
                    className={`h-4 w-4 transform transition-transform ${expandedSections.contact ? 'rotate-180' : ''}`} 
                    style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}
                  />
                </button>
              </div>
              <ul 
                id="contact-info-list"
                className={`space-y-4 overflow-hidden transition-max-height duration-300 ease-in-out ${expandedSections.contact ? 'max-h-96' : 'max-h-0 md:max-h-96'}`}
                style={{ color: footerSettings.textColor || defaultAppearanceSettings.footer?.textColor }}
              >
                <li className="flex items-start">
                  <FaMapMarkerAlt className="mr-2 mt-1 h-5 w-5 text-primary-500 flex-shrink-0" />
                  <span>{contactInfo.address}</span>
                </li>
                <li className="flex items-center">
                  <FaPhone className="mr-2 h-5 w-5 text-primary-500 flex-shrink-0" />
                  <a href={contactInfo.phoneHref} className="hover:text-primary-500 transition-colors">{contactInfo.phone}</a>
                </li>
                <li className="flex items-center">
                  <FaEnvelope className="mr-2 h-5 w-5 text-primary-500 flex-shrink-0" />
                  <a href={contactInfo.emailHref} className="hover:text-primary-500 transition-colors break-all">{contactInfo.email}</a>
                </li>
              </ul>
            </div>
          )}
        </div>

        {footerSettings.customHtml && (
          <div 
            className="mt-8 border-t border-gray-700 pt-8 text-center" 
            style={{ color: footerSettings.textColor ? blendColors(footerSettings.textColor, defaultAppearanceSettings.footer?.textColor || '#9CA3AF', 0.9) : (defaultAppearanceSettings.footer?.textColor || '#9CA3AF') }}
            dangerouslySetInnerHTML={{ __html: footerSettings.customHtml }}
          />
        )}

        <div 
          className="mt-8 border-t border-gray-700 pt-8 text-center" 
          style={{ color: footerSettings.textColor ? blendColors(footerSettings.textColor, defaultAppearanceSettings.footer?.textColor || '#9CA3AF', 0.8) : (defaultAppearanceSettings.footer?.textColor || '#9CA3AF') }}
        >
          <div className="mb-2">
            <Link href="/maintenance" className="hover:text-primary-500 transition-colors px-2">
              Maintenance
            </Link>
            <span style={{ color: footerSettings.textColor ? blendColors(footerSettings.textColor, defaultAppearanceSettings.footer?.textColor || '#9CA3AF', 0.7) : (defaultAppearanceSettings.footer?.textColor || '#9CA3AF') }}>|</span>
            <Link href="/admin" className="hover:text-primary-500 transition-colors px-2">
              Admin Portal
            </Link>
          </div>
          <p>
            {footerSettings.copyrightText || defaultAppearanceSettings.footer?.copyrightText || `© ${new Date().getFullYear()} Dr. Handyman. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

function blendColors(color1: string, color2: string, weight: number): string {
  try {
    const d2h = (d: number) => d.toString(16).padStart(2, '0');
    const h2d = (h: string) => parseInt(h, 16);

    const c1 = color1.startsWith('#') ? color1.substring(1) : color1;
    const c2 = color2.startsWith('#') ? color2.substring(1) : color2;

    if (c1.length !== 6 || c2.length !== 6) {
      return color1;
    }

    let r = Math.floor(h2d(c1.substring(0,2)) * weight + h2d(c2.substring(0,2)) * (1-weight));
    let g = Math.floor(h2d(c1.substring(2,4)) * weight + h2d(c2.substring(2,4)) * (1-weight));
    let b = Math.floor(h2d(c1.substring(4,6)) * weight + h2d(c2.substring(4,6)) * (1-weight));
    
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return `#${d2h(r)}${d2h(g)}${d2h(b)}`;

  } catch (e) {
    return color1;
  }
}

export default Footer; 