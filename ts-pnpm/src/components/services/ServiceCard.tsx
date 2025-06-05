import Image from 'next/image';
import Link from 'next/link';

import { type Service } from '../../../generated/prisma-client'; // Adjusted path

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  // Fallback image if service.imageUrl is null or undefined
  const fallbackImageUrl = '/images/placeholder-service.jpg'; // Ensure this placeholder exists in /public/images

  return (
    <div className="flex flex-col rounded-lg shadow-lg overflow-hidden h-full bg-white transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/services/${service.slug}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={service.imageUrl || fallbackImageUrl}
            alt={service.name}
            layout="fill"
            objectFit="cover"
            className="transition-opacity duration-300 group-hover:opacity-90"
          />
        </div>
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          <Link href={`/services/${service.slug}`} className="hover:text-blue-600 transition-colors">
            {service.name}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {service.description}
        </p>
        <div className="mt-auto">
          <Link
            href={`/services/${service.slug}`}
            className="inline-block text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
          >
            Learn More &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard; 