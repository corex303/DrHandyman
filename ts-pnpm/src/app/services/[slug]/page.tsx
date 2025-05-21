import { PrismaClient, type Service as BaseService, type PortfolioItem, Prisma } from '../../../../node_modules/.prisma/client'; // Direct import workaround
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import BeforeAfterGallery from '@/components/services/BeforeAfterGallery';
import ServiceSchemaMarkup from '@/components/services/ServiceSchemaMarkup';

// Manual types removed
// interface PortfolioItem {
//   id: string;
//   title: string | null;
//   description: string | null;
//   beforeImageUrl: string;
//   afterImageUrl: string;
//   serviceId: string;
// }

// interface Service {
//   id: string;
//   name: string;
//   description: string;
//   slug: string;
//   imageUrl: string | null;
//   portfolioItems: PortfolioItem[];
// }

const prisma = new PrismaClient();

interface ServiceDetailPageProps {
  params: {
    slug: string;
  };
}

// Define a more specific type for the service with included portfolio items
type ServiceWithPortfolio = Prisma.ServiceGetPayload<{
  include: { portfolioItems: true }
}>;

async function getServiceBySlug(slug: string): Promise<ServiceWithPortfolio | null> {
  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      portfolioItems: true, // Explicitly include portfolioItems
    },
  });
  return service;
}

export async function generateStaticParams() {
  const services = await prisma.service.findMany({
    select: { slug: true },
  });
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: ServiceDetailPageProps) {
  const service = await getServiceBySlug(params.slug);
  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }
  return {
    title: `${service.name} | Services | Dr. Handyman NC`,
    description: service.description.substring(0, 160), // Use a snippet for meta description
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = await getServiceBySlug(params.slug);

  if (!service) {
    notFound();
  }

  // TODO: Fetch these from a global config or environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.drhandymannc.com'; // Fallback
  const siteName = 'Dr. Handyman NC';

  return (
    <>
      <ServiceSchemaMarkup service={service} siteUrl={siteUrl} siteName={siteName} />
      <div className="container mx-auto px-4 py-8">
        <article>
          <h1 className="mb-6 text-4xl font-bold text-gray-800 text-center">{service.name}</h1>

          {service.imageUrl && (
            <div className="mb-8 w-full max-w-3xl mx-auto">
              <Image
                src={service.imageUrl}
                alt={service.name}
                width={1000} // Adjusted for a larger display
                height={563} // Maintain 16:9 aspect ratio
                className="rounded-xl shadow-lg object-cover"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-3xl mx-auto text-gray-700 mb-10"
            dangerouslySetInnerHTML={{ __html: service.description }}
          />

          {/* Use BeforeAfterGallery component */}
          {service.portfolioItems && service.portfolioItems.length > 0 ? (
            <BeforeAfterGallery items={service.portfolioItems} serviceName={service.name} />
          ) : (
            <p className="mt-12 text-center text-gray-500">
              No portfolio items available for this service yet.
            </p>
          )}

          <div className="mt-16 text-center">
            <Link 
              href="/contact" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Get a Quote for {service.name}
            </Link>
          </div>

        </article>
      </div>
    </>
  );
} 