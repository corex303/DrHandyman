'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const AudienceSegmentation = () => {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
        <h2 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          What Are You Looking For Help With?
        </h2>
        <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-400">
          Select the option that best describes you to find tailored information and services.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
          <Link href="/for-homeowners" passHref>
            <Button size="lg">
              I'm a Homeowner
            </Button>
          </Link>
          <Link href="/for-property-managers" passHref>
            <Button size="lg" variant="outline">
              I Manage Apartments or HOAs
            </Button>
          </Link>
          <Link href="/for-commercial" passHref>
            <Button size="lg" variant="outline">
              I Represent a Business
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AudienceSegmentation; 