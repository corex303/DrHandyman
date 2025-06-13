'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Checkbox,
  Spinner,
} from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaintenanceWorker } from '@prisma/client';

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  serviceFusionId: z.string().optional(),
  isActive: z.boolean().optional(),
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface MaintenanceClientProps {
  initialWorkers: MaintenanceWorker[];
}

export function MaintenanceClient({ initialWorkers }: MaintenanceClientProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [selectedWorker, setSelectedWorker] = useState<MaintenanceWorker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: '',
      email: '',
      serviceFusionId: '',
      isActive: true,
    },
  });

  const handleOpenCreate = () => {
    setSelectedWorker(null);
    reset({ name: '', email: '', serviceFusionId: '', isActive: true });
    setFormError(null);
    onOpen();
  };

  const handleOpenEdit = (worker: MaintenanceWorker) => {
    setSelectedWorker(worker);
    reset({
      name: worker.name,
      email: worker.email || '',
      serviceFusionId: worker.serviceFusionId || '',
      isActive: worker.isActive,
    });
    setFormError(null);
    onOpen();
  };
  
  const handleOpenDelete = (worker: MaintenanceWorker) => {
    setSelectedWorker(worker);
    setIsDeleting(true);
  };
  
  const handleCloseDelete = () => {
    setSelectedWorker(null);
    setIsDeleting(false);
  };

  const onSubmit = async (data: WorkerFormData) => {
    setFormError(null);
    const url = selectedWorker
      ? `/api/admin/maintenance/${selectedWorker.id}`
      : '/api/admin/maintenance';
    const method = selectedWorker ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const firstError = Object.values(errorData.error)[0] as string[];
        throw new Error(firstError[0] || 'An unknown error occurred');
      }

      const result = await response.json();

      if (selectedWorker) {
        setWorkers(workers.map(w => (w.id === result.id ? result : w)));
      } else {
        setWorkers([result, ...workers]);
      }
      onClose();
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedWorker) return;

    try {
        await fetch(`/api/admin/maintenance/${selectedWorker.id}`, {
            method: 'DELETE',
        });
        setWorkers(workers.filter(w => w.id !== selectedWorker.id));
        handleCloseDelete();
    } catch (error) {
        console.error('Failed to delete worker', error);
        // You might want to show an error to the user here
        handleCloseDelete();
    }
  };


  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onPress={handleOpenCreate} color="primary">
          Add New Staff
        </Button>
      </div>
      <Table aria-label="Maintenance Staff Table">
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody items={workers}>
          {item => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    item.isActive
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="flex gap-2">
                <Button size="sm" onPress={() => handleOpenEdit(item)}>
                  Edit
                </Button>
                <Button size="sm" color="danger" onPress={() => handleOpenDelete(item)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {selectedWorker ? 'Edit Staff' : 'Add New Staff'}
            </ModalHeader>
            <ModalBody>
              {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Name"
                    placeholder="Enter staff member's name"
                    variant="bordered"
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Email"
                    placeholder="Enter staff member's email"
                    variant="bordered"
                    type="email"
                    className="my-4"
                    isInvalid={!!errors.email}
                    errorMessage={errors.email?.message}
                  />
                )}
              />
               <Controller
                name="serviceFusionId"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Service Fusion ID"
                    placeholder="Enter Service Fusion ID"
                    variant="bordered"
                    isInvalid={!!errors.serviceFusionId}
                    errorMessage={errors.serviceFusionId?.message}
                  />
                )}
              />
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    isSelected={field.value}
                    onValueChange={field.onChange}
                    className="mt-4"
                  >
                    Active
                  </Checkbox>
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  selectedWorker ? 'Save Changes' : 'Create Staff'
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleting} onClose={handleCloseDelete}>
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            Are you sure you want to delete {selectedWorker?.name}? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseDelete}>
              Cancel
            </Button>
            <Button color="danger" onPress={onDeleteConfirm}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 