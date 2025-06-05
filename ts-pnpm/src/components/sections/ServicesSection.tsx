'use client';

import Link from 'next/link';
import React from 'react';
import { FaArrowRight, FaPaintRoller, FaTools, FaWrench } from 'react-icons/fa';
import { IconType } from 'react-icons';

import ButtonLink from '@/components/links/ButtonLink';
import WrappedReactIcon from '@/components/ui/WrappedReactIcon';

import { ServiceItem, ServicesSectionSettings } from '@/types/appearance';

interface ServicesSectionProps {
  settings?: ServicesSectionSettings;
}

// Icon map helper
const iconMap: Record<string, IconType> = {
  FaTools: FaTools,
  FaPaintRoller: FaPaintRoller,
  FaWrench: FaWrench,
  // Add more icons as needed
};

const defaultSectionSettings: ServicesSectionSettings = {
  title: 'Our Services',
  subtitle: 'Explore the range of services we offer.',
  textAlignment: 'center',
  columns: 3,
  items: [
    { id: 's1', icon: 'FaTools', title: 'Service One', description: 'Description for service one.', link: '#' },
    { id: 's2', icon: 'FaPaintRoller', title: 'Service Two', description: 'Description for service two.', link: '#' },
    { id: 's3', icon: 'FaWrench', title: 'Service Three', description: 'Description for service three.', link: '#' },
  ],
  viewAllServicesText: 'View All Services',
  viewAllServicesLink: '/services',
  backgroundColor: '#F3F4F6', // gray-100
  textColor: '#1F2937', // gray-800
  itemBackgroundColor: '#FFFFFF', // white
  itemTitleColor: '#111827',
  itemTextColor: '#4B5563', // gray-600
  iconColor: '#3B82F6',
  paddingTop: 'py-12',
  paddingBottom: 'pb-12',
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ settings: propsSettings }) => {
  const settings = { ...defaultSectionSettings, ...propsSettings };
  const itemsToRender = settings.items || [];

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const columnClasses = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 md:grid-cols-3',
    4: 'sm:grid-cols-2 md:grid-cols-4',
  };

  const SectionWrapper: React.FC<{children: React.ReactNode, link: string}> = ({ children, link }) => {
    if (link) {
      return <Link href={link} className="block hover:shadow-lg transition-shadow duration-300 rounded-lg h-full">{children}</Link>;
    }
    return <>{children}</>;
  };

  return (
    <section 
      className={`${settings.paddingTop} ${settings.paddingBottom}`}
      style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}
    >
      <div className="layout mx-auto px-4">
        {(settings.title || settings.subtitle) && (
          <div className={`mb-12 ${textAlignClasses[settings.textAlignment || 'center']}`}>
            {settings.title && (
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: settings.textColor }}>
                {settings.title}
              </h2>
            )}
            {settings.subtitle && (
              <p className="mx-auto max-w-2xl text-lg" style={{ color: settings.textColor ? 'rgba(0,0,0,0.7)' : undefined }}>
                {settings.subtitle}
              </p>
            )}
          </div>
        )}

        {itemsToRender.length > 0 && (
          <div className={`grid gap-8 ${columnClasses[settings.columns || 3]}`}>
            {itemsToRender.map((service: ServiceItem) => {
              const IconComponent = service.icon && iconMap[service.icon] ? iconMap[service.icon] : null;
              return (
                <SectionWrapper key={service.id} link={service.link || ''}>
                  <div 
                    className="p-6 rounded-lg transition-transform duration-300 h-full flex flex-col"
                    style={{
                      backgroundColor: settings.itemBackgroundColor,
                      color: settings.itemTextColor,
                      transform: service.link ? 'translateY(0)' : undefined,
                    }}
                    onMouseEnter={(e) => { if (service.link) e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={(e) => { if (service.link) e.currentTarget.style.transform = 'translateY(0px)'; }}
                  >
                    {IconComponent && (
                      <div className="mb-4 rounded-full p-3 inline-block" style={{ backgroundColor: settings.iconColor ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <WrappedReactIcon icon={IconComponent} className="h-8 w-8" style={{ color: settings.iconColor || settings.textColor }} />
                      </div>
                    )}
                    <h3 className="mb-3 text-xl font-semibold" style={{ color: settings.itemTitleColor || settings.textColor }}>{service.title}</h3>
                    <p className="mb-4 flex-grow" style={{ color: settings.itemTextColor }}>{service.description}</p>
                    {service.link && (
                      <div className="mt-auto">
                        <span className="inline-flex items-center font-medium" style={{ color: settings.textColor }}>
                          Learn more <WrappedReactIcon icon={FaArrowRight} className="ml-1" />
                        </span>
                      </div>
                    )}
                  </div>
                </SectionWrapper>
              );
            })}
          </div>
        )}

        {settings.viewAllServicesLink && settings.viewAllServicesText && (
          <div className={`mt-12 ${textAlignClasses[settings.textAlignment || 'center']}`}>
            <ButtonLink href={settings.viewAllServicesLink} variant="primary">
              {settings.viewAllServicesText}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}; 