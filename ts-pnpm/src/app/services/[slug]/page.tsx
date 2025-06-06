import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import prisma from '@/lib/prisma';

import { Button } from '@/components/ui/button';
import BeforeAfterGallery from '@/components/services/BeforeAfterGallery';
import ServiceSchemaMarkup from '@/components/services/ServiceSchemaMarkup';

import { type Service as BaseService, ApprovalStatus, Photo,PhotoSet, Prisma } from '../../../../generated/prisma-client'; // Path seems correct

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

// Define a type for PhotoSet with its photos
export interface ApprovedPhotoSetWithPhotos extends PhotoSet {
  photos: Photo[];
}

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Define a more specific type for the service with included portfolio items
type ServiceWithPortfolio = Prisma.ServiceGetPayload<{
  include: { portfolioItems: true } // This is for the old PortfolioItem model
}>;

// We'll also define a type for the service detail page data including new PhotoSets
interface ServicePageData {
  service: BaseService;
  approvedPhotoSets: ApprovedPhotoSetWithPhotos[];
}

async function getServicePageData(slug: string): Promise<ServicePageData | null> {
  const service = await prisma.service.findUnique({
    where: { slug },
    // We don't need to include the old portfolioItems here anymore if switching to PhotoSet
  });

  if (!service) {
    return null;
  }

  // Fetch approved PhotoSets for this service
  const approvedPhotoSets = await prisma.photoSet.findMany({
    where: {
      serviceCategory: service.name, // Assumes PhotoSet.serviceCategory matches Service.name
      status: ApprovalStatus.APPROVED,
    },
    include: {
      photos: true, // Include all related photos
      maintenanceWorker: true, // Optionally include worker if needed for display
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  return { service, approvedPhotoSets };
}

export async function generateStaticParams() {
  const services = await prisma.service.findMany({
    select: { slug: true },
  });
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata(props: ServiceDetailPageProps) {
  const params = await props.params;
  const pageData = await getServicePageData(params.slug);
  if (!pageData || !pageData.service) {
    return {
      title: 'Service Not Found',
    };
  }
  return {
    title: `${pageData.service.name} | Services | Dr. Handyman NC`,
    description: pageData.service.description.substring(0, 160), 
  };
}

export default async function ServiceDetailPage(props: ServiceDetailPageProps) {
  const params = await props.params;
  const pageData = await getServicePageData(params.slug);

  if (!pageData || !pageData.service) {
    notFound();
  }

  const { service, approvedPhotoSets } = pageData;

  // siteUrl and siteName are now sourced from @/config/site within ServiceSchemaMarkup
  // The generateMetadata function also sources these from process.env variables.

  return (
    <>
      <ServiceSchemaMarkup service={service} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <article>
          <h1 className="mb-6 text-3xl sm:text-4xl font-bold text-foreground text-center text-balance">{service.name}</h1>

          {service.imageUrl && (
            <div className="mb-8 w-full max-w-3xl mx-auto">
              <Image
                src={service.imageUrl}
                alt={service.name}
                width={500}
                height={281}
                className="rounded-xl shadow-lg object-cover mx-auto"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-lg dark:prose-invert lg:prose-xl max-w-3xl mx-auto text-foreground/90 mb-10 sm:mb-12 text-center"
            dangerouslySetInnerHTML={{ __html: service.description }}
          />

          {/* Use BeforeAfterGallery component - This will need to be adapted */}
          {approvedPhotoSets && approvedPhotoSets.length > 0 ? (
            <BeforeAfterGallery items={approvedPhotoSets} serviceName={service.name} />
          ) : (
            <p className="mt-12 text-center text-foreground/80">
              No portfolio items available for this service yet.
            </p>
          )}

          <div className="mt-12 sm:mt-16 text-center">
            <Button asChild size="lg">
              <Link href="/service-inquiry">
                Get a Quote for {service.name}
              </Link>
            </Button>
          </div>

        </article>
      </div>
    </>
  );
} 