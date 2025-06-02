// import { Service } from "@prisma/client"; // Ensure this is commented out or removed
// import { PrismaClient, type Service } from '../../../node_modules/.prisma/client'; // REMOVE THIS LINE
import Link from 'next/link';

import prisma from '@/lib/prisma';

import type { Service } from '../../../generated/prisma-client'; // Corrected path for Service type
import ServiceCard from '@/components/services/ServiceCard'; // Import the new ServiceCard

// Placeholder for ServiceCard component - to be implemented later
// import ServiceCard from '@/components/services/ServiceCard';

// Manual type removed
// interface Service {
//   id: string;
//   name: string;
//   description: string;
//   slug: string;
//   imageUrl: string | null;
// }

async function getServices(): Promise<Service[]> {
  const services = await prisma.service.findMany({
    orderBy: {
      name: 'asc',
    },
  });
  return services;
}

export default async function ServicesOverviewPage() {
  const services = await getServices();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="mb-8 text-3xl sm:text-4xl font-bold text-center text-gray-800">
        Our Services
      </h1>
      {services.length === 0 ? (
        <p className="text-center text-gray-600">
          No services available at the moment. Please check back later.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service: Service) => (
            <ServiceCard key={service.id} service={service} /> // Use ServiceCard component
          ))}
        </div>
      )}
    </div>
  );
}

export const metadata = {
  title: 'Our Services | Dr. Handyman NC',
  description:
    'Explore the wide range of handyman services offered by Dr. Handyman NC. From carpentry to concrete repair, we have you covered.',
}; 