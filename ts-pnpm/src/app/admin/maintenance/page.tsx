import { MaintenanceClient } from './MaintenanceClient';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function getWorkers() {
  const workers = await prisma.maintenanceWorker.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  });
  return workers;
}

export default async function MaintenancePage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const workers = await getWorkers();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Maintenance Staff</h1>
      <MaintenanceClient initialWorkers={workers} />
    </div>
  );
} 