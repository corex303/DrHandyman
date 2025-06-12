'use client';

import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';
import React from 'react';

import ButtonLink from '@/components/links/ButtonLink';

interface WorkItemProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  category: string;
  title: string;
  description: string;
  linkUrl: string;
}

const WorkItem: React.FC<WorkItemProps> = ({
  beforeImageUrl,
  afterImageUrl,
  category,
  title,
  description,
  linkUrl,
}) => {
  return (
    <div className='bg-white rounded-lg shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl'>
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={beforeImageUrl}
            alt='Before image'
            style={{ filter: 'grayscale(1)' }}
          />
        }
        itemTwo={
          <ReactCompareSliderImage src={afterImageUrl} alt='After image' />
        }
        className='h-64 w-full'
      />
      <div className='p-6'>
        <p className='text-accent-gold text-sm font-semibold mb-1 tracking-wider uppercase'>
          {category}
        </p>
        <h3 className='font-serif text-2xl font-semibold text-primary-navy mb-3'>
          {title}
        </h3>
        <p className='text-secondary-gray text-base leading-relaxed mb-4 line-clamp-3'>
          {description}
        </p>
        <ButtonLink
          href={linkUrl}
          variant='outline'
          className='text-primary-navy border-primary-navy hover:bg-primary-navy hover:text-white transition-colors duration-300'
        >
          View Project
        </ButtonLink>
      </div>
    </div>
  );
};

const RecentWorkSection: React.FC = () => {
  const workItems = [
    {
      beforeImageUrl: '/uploads/portfolio/kitchen-remodel-modern-farmhouse.jpg',
      afterImageUrl: '/uploads/portfolio/kitchen-remodel-modern-farmhouse.jpg',
      category: 'Kitchen Renovation',
      title: 'Modern Farmhouse Kitchen',
      description:
        'Complete kitchen remodel featuring custom cabinetry, quartz countertops, and energy-efficient appliances for a bright and functional family space.',
      linkUrl: '/portfolio/modern-farmhouse-kitchen',
    },
    {
      beforeImageUrl: '/uploads/portfolio/bathroom-remodel-luxury-spa.jpg',
      afterImageUrl: '/uploads/portfolio/bathroom-remodel-luxury-spa.jpg',
      category: 'Bathroom Remodel',
      title: 'Luxury Spa Bathroom',
      description:
        'Transformed a dated bathroom into a spa-like retreat with a walk-in shower, freestanding tub, and premium fixtures.',
      linkUrl: '/portfolio/luxury-spa-bathroom',
    },
    {
      beforeImageUrl: '/uploads/portfolio/outdoor-living-deck-pergola.jpg',
      afterImageUrl: '/uploads/portfolio/outdoor-living-deck-pergola.jpg',
      category: 'Outdoor Living',
      title: 'Spacious Deck & Pergola',
      description:
        'Designed and built a multi-level deck with a custom pergola, creating an inviting outdoor entertainment area.',
      linkUrl: '/portfolio/deck-and-pergola',
    },
  ];

  return (
    <section className='bg-secondary-gray-lighter py-20 md:py-28'>
      <div className='layout container mx-auto'>
        <div className='text-center mb-16'>
          <h2 className='font-serif text-3xl md:text-4xl font-bold text-primary-navy mb-4'>
            See Our Quality Work
          </h2>
          <p className='text-lg md:text-xl text-secondary-gray max-w-2xl mx-auto'>
            We take pride in our craftsmanship. Explore some of our recently
            completed projects for local homeowners.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10'>
          {workItems.map((item, index) => (
            <WorkItem key={index} {...item} />
          ))}
        </div>
        <div className='text-center mt-16'>
          <ButtonLink
            href='/portfolio'
            variant='primary'
            className='bg-primary-navy hover:bg-opacity-80 text-white px-10 py-3 text-lg font-semibold rounded-lg'
          >
            View Full Portfolio
          </ButtonLink>
        </div>
      </div>
    </section>
  );
};

export default RecentWorkSection; 