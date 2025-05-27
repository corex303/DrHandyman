import React from 'react';

import ButtonLink from '@/components/links/ButtonLink';
import NextImage from '@/components/NextImage';

const HeroSection: React.FC = () => {
  const logoUrl = '/images/dr-handyman-logo-transparent.png';

  return (
    <section className='bg-primary-navy text-text-light pb-20 md:pb-32'>
      <div className='layout container mx-auto flex flex-col items-center text-center'>
        <div className="">
          <NextImage
            src={logoUrl}
            width={675}
            height={225}
            alt="Dr. Handyman Logo"
          />
        </div>
        <h1 className='font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6'>
          Expert Home Repairs, Reliable Service.
        </h1>
        <p className='text-lg md:text-xl text-secondary-gray-light mb-10 max-w-2xl'>
          Dr. Handyman provides top-quality craftsmanship for all your home maintenance and renovation needs. Your satisfaction is our priority.
        </p>
        <ButtonLink href='/contact' variant='primary' className='bg-accent-gold hover:bg-yellow-600 text-primary-navy px-10 py-3 text-lg font-semibold rounded-lg'>
          Get a Free Quote
        </ButtonLink>
      </div>
    </section>
  );
};

export default HeroSection; 