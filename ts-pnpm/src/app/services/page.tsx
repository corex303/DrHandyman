// import { Service } from "@prisma/client"; // Ensure this is commented out or removed
// import { PrismaClient, type Service } from '../../../node_modules/.prisma/client'; // REMOVE THIS LINE
import Link from 'next/link';

import prisma from '@/lib/prisma';

import type { Service } from '../../generated/prisma-client'; // Corrected path for Service type

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold text-center text-gray-800">
        Our Services
      </h1>
      {services.length === 0 ? (
        <p className="text-center text-gray-600">
          No services available at the moment. Please check back later.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service: Service) => (
            // Replace with ServiceCard component once created
            <div key={service.id} className="border p-4 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-2">{service.name}</h2>
              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
              )}
              <p className="text-gray-700 mb-4 line-clamp-3">
                {service.description}
              </p>
              <Link
                href={`/services/${service.slug}`}
                className="text-blue-600 hover:underline"
              >
                Learn More
              </Link>
            </div>
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