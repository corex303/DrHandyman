import prisma from '@/lib/prisma';

export const getApprovedPhotoSets = async () => {
  try {
    const photoSets = await prisma.photoSet.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        photos: true, // Include the related photos for before/after
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
    return photoSets;
  } catch (error) {
    console.error('Error fetching approved photo sets:', error);
    return [];
  }
}; 