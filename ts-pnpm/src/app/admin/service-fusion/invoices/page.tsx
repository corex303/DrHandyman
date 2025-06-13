'use client';

import React, { useEffect, useState } from 'react';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
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
  Select,
  SelectItem,
} from '@nextui-org/react';
import { InvoiceView, InvoiceBody, CustomerView } from 'service-fusion';

export default function ServiceFusionInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceView | null>(null);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const invoicesData = await getInvoices();
      setInvoices(invoicesData || []);
    } catch (err) {
      setError('Failed to fetch invoices.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreate = () => {
    setSelectedInvoice(null);
    onOpen();
  };

  const handleEdit = (invoice: InvoiceView) => {
    setSelectedInvoice(invoice);
    onOpen();
  };

  const handleDelete = async (invoiceId: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(invoiceId);
        fetchInvoices(); // Refresh list
      } catch (err) {
        alert('Failed to delete invoice.');
        console.error(err);
      }
    }
  };
  
  const handleFormSubmit = async (formData: InvoiceBody) => {
    try {
      if (selectedInvoice) {
        await updateInvoice(selectedInvoice.id, formData);
      } else {
        await createInvoice(formData);
      }
      fetchInvoices();
      onOpenChange(); // Close modal
    } catch (err) {
      alert(`Failed to ${selectedInvoice ? 'update' : 'create'} invoice.`);
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Fusion Invoices</h1>
          <Button color="primary" onClick={handleCreate}>
            Create Invoice
          </Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center">
              <Spinner label="Loading invoices..." />
            </div>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <Table aria-label="Service Fusion Invoices Table">
              <TableHeader>
                <TableColumn>INVOICE #</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>BALANCE</TableColumn>
                <TableColumn>TOTAL</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={invoices}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.invoice_number}</TableCell>
                    <TableCell>{item.customer?.customer_name || 'N/A'}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>${item.balance.toFixed(2)}</TableCell>
                    <TableCell>${item.total.toFixed(2)}</TableCell>
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
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <InvoiceFormModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        invoice={selectedInvoice}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

// Form Modal
interface InvoiceFormModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  invoice: InvoiceView | null;
  onSubmit: (data: InvoiceBody) => void;
}

function InvoiceFormModal({
  isOpen,
  onOpenChange,
  invoice,
  onSubmit,
}: InvoiceFormModalProps) {
  const [formData, setFormData] = useState<Partial<InvoiceBody>>({});
  const [customers, setCustomers] = useState<CustomerView[]>([]);

  useEffect(() => {
    getCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    if (invoice) {
      setFormData({
        customer_id: invoice.customer_id,
        // Add other fields from invoice to edit if available in InvoiceBody
      });
    } else {
      setFormData({
        customer_id: undefined,
      });
    }
  }, [invoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (value: any) => {
    setFormData({ ...formData, customer_id: Number(value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      alert('Please select a customer.');
      return;
    }
    // InvoiceBody is simple, so we can cast it.
    // For more complex bodies, add validation.
    onSubmit(formData as InvoiceBody);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {invoice ? 'Edit Invoice' : 'Create New Invoice'}
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <Select
                  isRequired
                  label="Customer"
                  placeholder="Select a customer"
                  selectedKeys={formData.customer_id ? [String(formData.customer_id)] : []}
                  onChange={(e) => handleSelectChange(e.target.value)}
                  isDisabled={!!invoice} // Disable customer change on edit for simplicity
                >
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.customer_name}
                    </SelectItem>
                  ))}
                </Select>
                {/* 
                  Invoice creation via API might be limited. 
                  Typically, invoices are generated from Jobs or Estimates 
                  and then line items are added.
                  This form is kept simple for direct creation.
                */}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" type="submit">
                  {invoice ? 'Save Changes' : 'Create Invoice'}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 