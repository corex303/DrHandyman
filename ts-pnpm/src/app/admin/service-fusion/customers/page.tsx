'use client';

import React, { useEffect, useState } from 'react';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
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
  Switch,
} from '@nextui-org/react';
import { CustomerView, CustomerBody } from 'service-fusion';

export default function ServiceFusionCustomersPage() {
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerView | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await getCustomers({ 'per-page': 50, expand: 'contacts,locations' });
      setCustomers(response || []);
    } catch (err) {
      setError('Failed to fetch customers.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = () => {
    setSelectedCustomer(null);
    onOpen();
  };

  const handleEdit = (customer: CustomerView) => {
    setSelectedCustomer(customer);
    onOpen();
  };

  const handleDelete = async (customerId: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        fetchCustomers(); // Refresh list
      } catch (err) {
        alert('Failed to delete customer.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (formData: CustomerBody) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
      } else {
        await createCustomer(formData);
      }
      fetchCustomers();
      onOpenChange(); // Close modal
    } catch (err: any) {
      const errorDetails = err.response?.data?.map((e: any) => `${e.field}: ${e.message}`).join('\n') || err.message;
      alert(`Failed to ${selectedCustomer ? 'update' : 'create'} customer.\n${errorDetails}`);
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Fusion Customers</h1>
          <Button color="primary" onClick={handleCreate}>
            Create Customer
          </Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center">
              <Spinner label="Loading customers..." />
            </div>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <Table aria-label="Service Fusion Customers Table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>ACCOUNT #</TableColumn>
                <TableColumn>PRIMARY CONTACT</TableColumn>
                <TableColumn>PRIMARY LOCATION</TableColumn>
                <TableColumn>VIP</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={customers}>
                {(item) => {
                  const primaryContact = item.contacts?.find(c => c.is_primary);
                  const primaryLocation = item.locations?.find(l => l.is_primary);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.customer_name}</TableCell>
                      <TableCell>{item.account_number}</TableCell>
                      <TableCell>{primaryContact ? `${primaryContact.fname} ${primaryContact.lname}` : 'N/A'}</TableCell>
                      <TableCell>{primaryLocation ? `${primaryLocation.street_1}, ${primaryLocation.city}` : 'N/A'}</TableCell>
                      <TableCell>{item.is_vip ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" color="primary" onClick={() => handleEdit(item)}>
                            Edit
                          </Button>
                          <Button size="sm" color="danger" onClick={() => handleDelete(item.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <CustomerFormModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        customer={selectedCustomer}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

// Form Modal
interface CustomerFormModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  customer: CustomerView | null;
  onSubmit: (data: CustomerBody) => void;
}

function CustomerFormModal({
  isOpen,
  onOpenChange,
  customer,
  onSubmit,
}: CustomerFormModalProps) {
  const [formData, setFormData] = useState<Partial<CustomerBody>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_name: customer.customer_name,
        private_notes: customer.private_notes || '',
        public_notes: customer.public_notes || '',
        is_vip: customer.is_vip,
        // For simplicity, we are not editing contacts and locations here.
        // A full implementation would require more complex state management.
      });
    } else {
      setFormData({
        customer_name: '',
        private_notes: '',
        public_notes: '',
        is_vip: false,
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSwitchChange = (isSelected: boolean) => {
    setFormData({ ...formData, is_vip: isSelected });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name) {
      alert('Customer Name is required.');
      return;
    }
    onSubmit(formData as CustomerBody);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {customer ? 'Edit Customer' : 'Create New Customer'}
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <Input
                  isRequired
                  label="Customer Name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                />
                <Textarea
                  label="Public Notes"
                  name="public_notes"
                  value={formData.public_notes ?? ''}
                  onChange={handleChange}
                />
                <Textarea
                  label="Private Notes"
                  name="private_notes"
                  value={formData.private_notes ?? ''}
                  onChange={handleChange}
                />
                <Switch
                  name="is_vip"
                  isSelected={formData.is_vip}
                  onValueChange={handleSwitchChange}
                >
                  VIP Customer
                </Switch>
                {/* 
                  Adding/Editing contacts and locations is complex and would require
                  dedicated UI components. Keeping this form simple for now.
                */}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" type="submit">
                  {customer ? 'Save Changes' : 'Create Customer'}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 