'use client';

import {
  ReactCompareSlider,
  ReactCompareSliderImageProps,
} from 'react-compare-slider';
import React, { useState } from 'react';
import Image from 'next/image';

import ButtonLink from '@/components/links/ButtonLink';
import { workItems as portfolioItems } from '@/lib/portfolio-items';

interface WorkItemProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  category: string;
  title: string;
  description: string;
  linkUrl: string;
  interactionType: 'slider' | 'hover';
}

const CompareImage = (props: ReactCompareSliderImageProps) => {
  return (
    <Image
      src={props.src || ''}
      alt={props.alt || ''}
      layout='fill'
      objectFit='cover'
      className='w-full h-full'
    />
  );
};

const WorkItem: React.FC<WorkItemProps> = ({
  beforeImageUrl,
  afterImageUrl,
  category,
  title,
  description,
  linkUrl,
  interactionType,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const renderImage = () => {
    if (interactionType === 'hover') {
      return (
        <div
          className='relative h-64 w-full overflow-hidden'
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <Image
            src={isHovering ? afterImageUrl : beforeImageUrl}
            alt={title}
            layout='fill'
            objectFit='cover'
            className='transition-opacity duration-300'
          />
          <div className='absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <span className='text-white text-lg font-semibold'>
              {isHovering ? 'After' : 'Before'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <ReactCompareSlider
        itemOne={<CompareImage src={beforeImageUrl} alt='Before image' />}
        itemTwo={<CompareImage src={afterImageUrl} alt='After image' />}
        className='h-64 w-full'
      />
    );
  };

  return (
    <div className='bg-white rounded-lg shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl'>
      {renderImage()}
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
          {portfolioItems.map((item, index) => (
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