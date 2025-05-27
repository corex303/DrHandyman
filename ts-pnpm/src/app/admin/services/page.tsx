'use client';

import { EyeIcon,PencilIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Chip, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner,Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from '@heroui/react';
import Link from 'next/link';
import React, { useCallback,useEffect, useState } from 'react';
import { toast } from 'sonner';

import ServiceForm from '@/components/admin/ServiceForm';

import { type Service } from '../../../../generated/prisma-client'; // Assuming Service type is available

const ServicesAdminPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openFormModal = (service?: Service) => {
    setSelectedService(service || null);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setSelectedService(null);
    setIsFormModalOpen(false);
  };

  const openDeleteModal = (service: Service) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedService(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/services/${selectedService.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }
      toast.success('Service deleted successfully');
      fetchServices(); // Refresh the list
      closeDeleteModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred while deleting');
    }
    setIsSubmitting(false);
  };

  const handleFormSuccess = () => {
    fetchServices();
    closeFormModal();
  };

  const columns = [
    { name: "NAME", uid: "name" },
    { name: "SLUG", uid: "slug" },
    { name: "IMAGE", uid: "imageUrl" },
    { name: "ACTIONS", uid: "actions" },
  ];

  const renderCell = useCallback((service: Service, columnKey: React.Key) => {
    const cellValue = service[columnKey as keyof Service];

    switch (columnKey) {
      case "name":
        return <p className="font-semibold">{String(cellValue)}</p>;
      case "slug":
        return <Chip color="secondary" variant="flat">{String(cellValue)}</Chip>;
      case "imageUrl":
        return cellValue ? (
          <Link href={String(cellValue)} target="_blank" rel="noopener noreferrer">
            <EyeIcon className="h-5 w-5 text-blue-500 hover:text-blue-700" />
          </Link>
        ) : (
          <span className="text-gray-400">No Image</span>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit service">
              <Button isIconOnly size="sm" variant="light" onPress={() => openFormModal(service)}>
                <PencilIcon className="h-5 w-5 text-default-600" />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content="Delete service">
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => openDeleteModal(service)}>
                <TrashIcon className="h-5 w-5" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return String(cellValue);
    }
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Services</h1>
        <Button color="primary" startContent={<PlusCircleIcon className="h-5 w-5" />} onPress={() => openFormModal()}>
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner label="Loading services..." color="primary" />
        </div>
      ) : (
        <Table aria-label="Services table">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={services} emptyContent={services.length === 0 ? "No services found." : " "}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Service Form Modal */}
      <Modal isOpen={isFormModalOpen} onOpenChange={setIsFormModalOpen} placement="top-center" backdrop="blur" size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedService ? 'Edit Service' : 'Add New Service'}
              </ModalHeader>
              <ModalBody>
                <ServiceForm 
                  service={selectedService} 
                  onSuccess={handleFormSuccess} 
                  onCancel={onClose} 
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} placement="top-center" backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Confirm Deletion</ModalHeader>
              <ModalBody>
                <p>Are you sure you want to delete the service "{selectedService?.name}"?</p>
                <p className="text-sm text-warning-500">This action cannot be undone.</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button color="danger" onPress={handleDeleteService} isLoading={isSubmitting} disabled={isSubmitting}>
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ServicesAdminPage; 