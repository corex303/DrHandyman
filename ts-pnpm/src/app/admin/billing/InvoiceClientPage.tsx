'use client';

import React, { useState, useEffect } from 'react';
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Spinner,
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Input,
	Select,
	SelectItem
} from '@nextui-org/react';
import {
	Invoice,
	InvoiceLineItem,
	User
} from '@prisma/client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoices/InvoicePDF';

type InvoiceWithRelations = Invoice & {
	customer: User;
	lineItems: InvoiceLineItem[];
};

const InvoiceClientPage = () => {
	const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
	const [customers, setCustomers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [sendingEmail, setSendingEmail] = useState<string | null>(null);
	const [newInvoice, setNewInvoice] = useState({
		customerId: '',
		dueDate: '',
		status: 'DRAFT',
		lineItems: [{ description: '', quantity: 1, unitPrice: 0 }]
	});
	const [statusFilter, setStatusFilter] = useState('');
	const [customerFilter, setCustomerFilter] = useState('');

	useEffect(() => {
		fetchInvoices();
		fetchCustomers();
	}, [statusFilter, customerFilter]);

	const fetchInvoices = async () => {
		setIsLoading(true);
		const query = new URLSearchParams({
			status: statusFilter,
			customerId: customerFilter,
		}).toString();

		try {
			const res = await fetch(`/api/admin/invoices?${query}`);
			if (res.ok) {
				const data = await res.json();
				setInvoices(data);
			}
		} catch (error) {
			console.error('Failed to fetch invoices', error);
		}
		setIsLoading(false);
	};

	const fetchCustomers = async () => {
		const mockCustomers: User[] = [
			{ id: '1', name: 'John Doe', email: 'john@example.com', role: 'CUSTOMER', emailVerified: null, image: null, hashedPassword: null, lastSeenAt: null, createdAt: new Date(), updatedAt: new Date(), maintenanceWorkerId: null, password: null },
			{ id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'CUSTOMER', emailVerified: null, image: null, hashedPassword: null, lastSeenAt: null, createdAt: new Date(), updatedAt: new Date(), maintenanceWorkerId: null, password: null },
		];
		setCustomers(mockCustomers);
	};

	const handleCreateInvoice = async () => {
		try {
			const res = await fetch('/api/admin/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newInvoice),
			});
			if (res.ok) {
				fetchInvoices();
				setIsModalOpen(false);
			} else {
				console.error('Failed to create invoice');
			}
		} catch (error) {
			console.error('Failed to create invoice', error);
		}
	};

	const handleSendEmail = async (invoiceId: string) => {
		setSendingEmail(invoiceId);
		try {
			const res = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
				method: 'POST',
			});
			if (res.ok) {
				fetchInvoices();
			} else {
				console.error('Failed to send invoice email');
			}
		} catch (error) {
			console.error('Failed to send invoice email', error);
		}
		setSendingEmail(null);
	};

	const handleAddLineItem = () => {
		setNewInvoice(prev => ({
			...prev,
			lineItems: [...prev.lineItems, { description: '', quantity: 1, unitPrice: 0 }]
		}));
	};

	if (isLoading) {
		return <Spinner label="Loading invoices..." />;
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">Invoices</h1>
				<Button onClick={() => setIsModalOpen(true)} color="primary">Create Invoice</Button>
			</div>

			<div className="flex gap-4 mb-4">
				<Select
					label="Filter by Status"
					placeholder="All"
					onChange={(e) => setStatusFilter(e.target.value)}
					className="max-w-xs"
				>
					<SelectItem key="DRAFT" value="DRAFT">Draft</SelectItem>
					<SelectItem key="SENT" value="SENT">Sent</SelectItem>
					<SelectItem key="PAID" value="PAID">Paid</SelectItem>
					<SelectItem key="OVERDUE" value="OVERDUE">Overdue</SelectItem>
					<SelectItem key="VOID" value="VOID">Void</SelectItem>
				</Select>
				<Select
					label="Filter by Customer"
					placeholder="All"
					onChange={(e) => setCustomerFilter(e.target.value)}
					className="max-w-xs"
				>
					{customers.map((customer) => (
						<SelectItem key={customer.id} value={customer.id} children={customer.name} />
					))}
				</Select>
			</div>

			<Table aria-label="Invoices Table">
				<TableHeader>
					<TableColumn>Customer</TableColumn>
					<TableColumn>Status</TableColumn>
					<TableColumn>Due Date</TableColumn>
					<TableColumn>Total</TableColumn>
					<TableColumn>Actions</TableColumn>
				</TableHeader>
				<TableBody items={invoices}>
					{(item) => (
						<TableRow key={item.id}>
							<TableCell children={item.customer.name} />
							<TableCell children={item.status} />
							<TableCell children={new Date(item.dueDate).toLocaleDateString()} />
							<TableCell children={item.lineItems.reduce((acc, li) => acc + li.totalPrice, 0)} />
							<TableCell>
								<div className="flex gap-2">
									<PDFDownloadLink document={<InvoicePDF invoice={item} />} fileName={`invoice-${item.id}.pdf`}>
										{({ blob, url, loading, error }) =>
											loading ? 'Loading...' : <Button size="sm">Download PDF</Button>
										}
									</PDFDownloadLink>
									<Button
										size="sm"
										color="secondary"
										onClick={() => handleSendEmail(item.id)}
										isLoading={sendingEmail === item.id}
									>
										{sendingEmail === item.id ? 'Sending...' : 'Send Email'}
									</Button>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} size="2xl">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>Create New Invoice</ModalHeader>
							<ModalBody>
								<Select
									label="Customer"
									placeholder="Select a customer"
									onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
								>
									{customers.map((customer) => (
										<SelectItem key={customer.id} value={customer.id} children={customer.name} />
									))}
								</Select>
								<Input
									type="date"
									label="Due Date"
									onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
								/>
								{newInvoice.lineItems.map((item, index) => (
									<div key={index} className="flex gap-2 items-center">
										<Input label="Description" value={item.description} onChange={(e) => {
											const updatedLineItems = [...newInvoice.lineItems];
											updatedLineItems[index].description = e.target.value;
											setNewInvoice({...newInvoice, lineItems: updatedLineItems});
										}} />
										<Input type="number" label="Quantity" value={String(item.quantity)} onChange={(e) => {
											const updatedLineItems = [...newInvoice.lineItems];
											updatedLineItems[index].quantity = Number(e.target.value);
											setNewInvoice({...newInvoice, lineItems: updatedLineItems});
										}}/>
										<Input type="number" label="Unit Price" value={String(item.unitPrice)} onChange={(e) => {
											const updatedLineItems = [...newInvoice.lineItems];
											updatedLineItems[index].unitPrice = Number(e.target.value);
											setNewInvoice({...newInvoice, lineItems: updatedLineItems});
										}}/>
									</div>
								))}
								<Button onClick={handleAddLineItem} size="sm">Add Line Item</Button>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onClick={onClose}>Close</Button>
								<Button color="primary" onClick={handleCreateInvoice}>Create</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
};

export default InvoiceClientPage; 