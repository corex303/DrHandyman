'use client';

import React, { useEffect, useState } from 'react';
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  convertJobToInvoice,
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
import { JobView, JobBody, CustomerView } from 'service-fusion';

export default function ServiceFusionJobsPage() {
  const [jobs, setJobs] = useState<JobView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedJob, setSelectedJob] = useState<JobView | null>(null);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs({ 'per-page': 50, expand: 'customer' });
      setJobs(response || []);
    } catch (err) {
      setError('Failed to fetch jobs.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreate = () => {
    setSelectedJob(null);
    onOpen();
  };

  const handleEdit = (job: JobView) => {
    setSelectedJob(job);
    onOpen();
  };

  const handleDelete = async (jobId: number) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(jobId);
        fetchJobs();
      } catch (err) {
        alert('Failed to delete job.');
        console.error(err);
      }
    }
  };

  const handleConvert = async (jobId: number) => {
    if (window.confirm('Are you sure you want to convert this job to an invoice? This cannot be undone.')) {
      try {
        await convertJobToInvoice(jobId);
        alert('Job successfully converted to invoice.');
        fetchJobs();
      } catch (err: any) {
        alert(`Failed to convert job: ${err.message}`);
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (formData: JobBody) => {
    try {
      if (selectedJob) {
        await updateJob(selectedJob.id, formData);
      } else {
        await createJob(formData);
      }
      fetchJobs();
      onOpenChange();
    } catch (err: any) {
      const errorDetails = err.response?.data?.map((e: any) => `${e.field}: ${e.message}`).join('\n') || err.message;
      alert(`Failed to ${selectedJob ? 'update' : 'create'} job.\n${errorDetails}`);
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Fusion Jobs</h1>
          <Button color="primary" onClick={handleCreate}>
            Create Job
          </Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center">
              <Spinner label="Loading jobs..." />
            </div>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <Table aria-label="Service Fusion Jobs Table">
              <TableHeader>
                <TableColumn>JOB #</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={jobs}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.job_number}</TableCell>
                    <TableCell>{item.customer?.customer_name || 'N/A'}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.status_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" color="primary" onClick={() => handleEdit(item)}>Edit</Button>
                        <Button size="sm" color="secondary" onClick={() => handleConvert(item.id)}>Convert to Invoice</Button>
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

      <JobFormModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        job={selectedJob}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

// Form Modal
interface JobFormModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  job: JobView | null;
  onSubmit: (data: JobBody) => void;
}

function JobFormModal({ isOpen, onOpenChange, job, onSubmit }: JobFormModalProps) {
  const [formData, setFormData] = useState<Partial<JobBody>>({});
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const response = await getCustomers({ 'per-page': 200 }); // Fetch a good number of customers
        setCustomers(response || []);
      } catch (error) {
        console.error("Failed to fetch customers for job form", error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (job) {
      setFormData({
        customer_id: job.customer_id,
        description: job.description || '',
        po_number: job.po_number || '',
        customer_notes: job.customer_notes || '',
      });
    } else {
      setFormData({
        description: '',
        po_number: '',
        customer_notes: '',
      });
    }
  }, [job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    onSubmit(formData as JobBody);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {job ? 'Edit Job' : 'Create New Job'}
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
                <Input
                  label="PO Number"
                  name="po_number"
                  value={formData.po_number ?? ''}
                  onChange={handleChange}
                />
                <Textarea
                  label="Customer Notes"
                  name="customer_notes"
                  value={formData.customer_notes ?? ''}
                  onChange={handleChange}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" type="submit">
                  {job ? 'Save Changes' : 'Create Job'}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}