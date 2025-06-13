import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import NextImage from '@/components/NextImage';

const HeroSection: React.FC = () => {
  const logoUrl = '/images/dr-handyman-logo-transparent.png';

  return (
    <section className='bg-primary-navy text-text-light pb-20 md:pb-32'>
      <div className='layout container mx-auto flex flex-col items-center text-center'>
        <div className=''>
          <NextImage
            src={logoUrl}
            width={675}
            height={225}
            alt='Dr. Handyman Logo'
            priority
          />
        </div>
        <h1 className='font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6'>
          Expert Home Repairs, Reliable Service.
        </h1>
        <p className='text-lg md:text-xl text-secondary-gray-light mb-10 max-w-2xl'>
          Select the option that best describes you to find tailored information
          and services.
        </p>
        <div className='flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4'>
          <Link href='/for-homeowners' passHref>
            <Button
              size='lg'
              className='bg-accent-gold hover:bg-yellow-600 text-primary-navy px-10 py-3 text-lg font-semibold rounded-lg'
            >
              I'm a Homeowner
            </Button>
          </Link>
          <Link href='/for-property-managers' passHref>
            <Button
              size='lg'
              variant='outline'
              className='bg-accent-gold hover:bg-yellow-600 text-primary-navy px-10 py-3 text-lg font-semibold rounded-lg'
            >
              I Manage Apartments or HOAs
            </Button>
          </Link>
          <Link href='/for-commercial' passHref>
            <Button
              size='lg'
              variant='outline'
              className='bg-accent-gold hover:bg-yellow-600 text-primary-navy px-10 py-3 text-lg font-semibold rounded-lg'
            >
              I Represent a Business
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 