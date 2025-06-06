import React from 'react';
import { IconType } from 'react-icons';
import { FiCheckSquare, FiHome, FiTool } from 'react-icons/fi';

import WrappedReactIcon from '@/components/ui/WrappedReactIcon';

interface ServiceCardProps {
  icon: IconType;
  title: string;
  description: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description }) => {
  return (
    <div className='bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center'>
      <WrappedReactIcon icon={icon} className='text-accent-gold text-4xl mb-6' />
      <h3 className='font-serif text-2xl font-semibold text-primary-navy mb-3'>{title}</h3>
      <p className='text-secondary-gray text-base leading-relaxed'>{description}</p>
    </div>
  );
};

const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: FiTool,
      title: 'General Home Repairs',
      description: 'From leaky faucets to drywall patches, no job is too small. We handle all your everyday home repair needs efficiently.',
    },
    {
      icon: FiHome,
      title: 'Renovations & Remodeling',
      description: 'Kitchens, bathrooms, basements, and more. Let us help you transform your space with quality and precision.',
    },
    {
      icon: FiCheckSquare,
      title: 'Installation Services',
      description: 'Appliance installation, light fixtures, shelving, and more. We ensure everything is set up correctly and safely.',
    },
  ];

  return (
    <section className='bg-background-light py-20 md:py-28'>
      <div className='layout container mx-auto'>
        <div className='text-center mb-16'>
          <h2 className='font-serif text-3xl md:text-4xl font-bold text-primary-navy mb-4'>
            Our Comprehensive Handyman Services
          </h2>
          <p className='text-lg md:text-xl text-secondary-gray max-w-2xl mx-auto'>
            We offer a wide range of professional handyman services to keep your home in top condition. Quality work, done right.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-10'>
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection; 