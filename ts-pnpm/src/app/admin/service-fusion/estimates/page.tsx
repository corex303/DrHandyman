'use client';

import React, { useEffect, useState } from 'react';
import {
  getEstimates,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  convertEstimateToJob,
  getCustomers,
} from '@/lib/service-fusion/client';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Textarea,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { EstimateView, EstimateBody, CustomerView } from 'service-fusion';

export default function ServiceFusionEstimatesPage() {
  const [estimates, setEstimates] = useState<EstimateView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateView | null>(null);

  const fetchEstimates = async () => {
    try {
      setIsLoading(true);
      const response = await getEstimates({ 'per-page': 50, expand: 'customer' });
      setEstimates(response || []);
    } catch (err) {
      setError('Failed to fetch estimates.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  const handleCreate = () => {
    setSelectedEstimate(null);
    onOpen();
  };

  const handleEdit = (estimate: EstimateView) => {
    setSelectedEstimate(estimate);
    onOpen();
  };

  const handleDelete = async (estimateId: number) => {
    if (window.confirm('Are you sure you want to delete this estimate?')) {
      try {
        await deleteEstimate(estimateId);
        fetchEstimates();
      } catch (err) {
        alert('Failed to delete estimate.');
        console.error(err);
      }
    }
  };

  const handleConvert = async (estimateId: number) => {
    if (window.confirm('Are you sure you want to convert this estimate to a job? This cannot be undone.')) {
      try {
        await convertEstimateToJob(estimateId);
        alert('Estimate successfully converted to job.');
        fetchEstimates();
      } catch (err: any) {
        alert(`Failed to convert estimate: ${err.message}`);
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (formData: EstimateBody) => {
    try {
      if (selectedEstimate) {
        await updateEstimate(selectedEstimate.id, formData);
      } else {
        await createEstimate(formData);
      }
      fetchEstimates();
      onOpenChange();
    } catch (err: any) {
      const errorDetails = err.response?.data?.map((e: any) => `${e.field}: ${e.message}`).join('\n') || err.message;
      alert(`Failed to ${selectedEstimate ? 'update' : 'create'} estimate.\n${errorDetails}`);
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Fusion Estimates</h1>
          <Button color="primary" onClick={handleCreate}>
            Create Estimate
          </Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center">
              <Spinner label="Loading estimates..." />
            </div>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <Table aria-label="Service Fusion Estimates Table">
              <TableHeader>
                <TableColumn>ESTIMATE #</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={estimates}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.estimate_number}</TableCell>
                    <TableCell>{item.customer?.customer_name || 'N/A'}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" color="primary" onClick={() => handleEdit(item)}>Edit</Button>
                        <Button size="sm" color="secondary" onClick={() => handleConvert(item.id)}>Convert to Job</Button>
                        <Button size="sm" color="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <EstimateFormModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        estimate={selectedEstimate}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

// Form Modal
interface EstimateFormModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  estimate: EstimateView | null;
  onSubmit: (data: EstimateBody) => void;
}

function EstimateFormModal({ isOpen, onOpenChange, estimate, onSubmit }: EstimateFormModalProps) {
  const [formData, setFormData] = useState<Partial<EstimateBody>>({});
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const response = await getCustomers({ 'per-page': 200 });
        setCustomers(response || []);
      } catch (error) {
        console.error("Failed to fetch customers for estimate form", error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (estimate) {
      setFormData({
        customer_id: estimate.customer_id,
        description: estimate.description || '',
      });
    } else {
      setFormData({
        description: '',
      });
    }
  }, [estimate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, customer_id: Number(e.target.value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      alert('Customer is required.');
      return;
    }
    onSubmit(formData as EstimateBody);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {estimate ? 'Edit Estimate' : 'Create New Estimate'}
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <Select
                  isRequired
                  label="Customer"
                  name="customer_id"
                  selectedKeys={formData.customer_id ? [String(formData.customer_id)] : []}
                  onChange={handleSelectChange}
                  isLoading={isLoadingCustomers}
                  placeholder="Select a customer"
                >
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.customer_name}
                    </SelectItem>
                  ))}
                </Select>
                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description ?? ''}
                  onChange={handleChange}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" type="submit">
                  {estimate ? 'Save Changes' : 'Create Estimate'}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 