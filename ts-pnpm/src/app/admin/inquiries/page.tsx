'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  DropdownSection,
  SortDescriptor,
  Selection,
} from '@nextui-org/react';
import toast from 'react-hot-toast';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { SearchIcon } from '@/components/icons/SearchIcon';
import { Inquiry, InquiryStatus } from '@prisma/client';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const statusColorMap: Record<InquiryStatus, 'primary' | 'warning' | 'success' | 'default'> = {
  NEW: 'primary',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'default',
};

const statusOptions = [
  { name: 'New', uid: 'NEW' },
  { name: 'In Progress', uid: 'IN_PROGRESS' },
  { name: 'Completed', uid: 'COMPLETED' },
  { name: 'Archived', uid: 'ARCHIVED' },
];

function formatInquiryStatus(status: InquiryStatus) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const INITIAL_VISIBLE_COLUMNS = ["name", "service", "status", "received", "actions"];

export default function InquiryManagementPage() {
  const { data: inquiries, error, mutate } = useSWR<Inquiry[]>('/api/admin/inquiries', fetcher);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredInquiries = inquiries || [];

    if (hasSearchFilter) {
      filteredInquiries = filteredInquiries.filter((inquiry) =>
        inquiry.customerName.toLowerCase().includes(filterValue.toLowerCase()) ||
        inquiry.customerEmail.toLowerCase().includes(filterValue.toLowerCase()) ||
        inquiry.serviceNeeded?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
      filteredInquiries = filteredInquiries.filter((inquiry) =>
        Array.from(statusFilter).includes(inquiry.status)
      );
    }

    return filteredInquiries;
  }, [inquiries, filterValue, statusFilter, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const onSearchChange = (value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  };

  const onClear = () => {
    setFilterValue("");
    setPage(1);
  };

  const handleUpdateStatus = async (inquiryId: string, status: InquiryStatus) => {
    const toastId = toast.loading('Updating status...');
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status.');
      
      toast.success('Status updated successfully!', { id: toastId });
      mutate(); // Re-fetch data
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status.', { id: toastId });
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;

    const toastId = toast.loading('Deleting inquiry...');
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete inquiry.');
      
      toast.success('Inquiry deleted successfully!', { id: toastId });
      mutate(); // Re-fetch data
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete inquiry.', { id: toastId });
    }
  };

  const handleOpenModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    onOpen();
  };

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name, email, or service..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }, [filterValue, statusFilter, onSearchChange, onClear]);

  if (error) return <div>Failed to load inquiries</div>;
  if (!inquiries) return <div>Loading...</div>;

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Inquiry Management</h1>
        <Table 
            aria-label="Inquiries table"
            topContent={topContent}
            topContentPlacement="outside"
            bottomContent={
                pages > 1 ? (
                    <div className="flex w-full justify-center">
                    <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={page}
                        total={pages}
                        onChange={(page) => setPage(page)}
                    />
                    </div>
                ) : null
            }
        >
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>SERVICE</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>RECEIVED</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody items={items} emptyContent={"No inquiries found"}>
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <User name={item.customerName} description={item.customerEmail} />
                </TableCell>
                <TableCell>{item.serviceNeeded}</TableCell>
                <TableCell>
                  <Chip color={statusColorMap[item.status]} size="sm" variant="flat">
                    {formatInquiryStatus(item.status)}
                  </Chip>
                </TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                   <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <ChevronDownIcon className="text-default-500" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Inquiry Actions">
                      <DropdownItem key="view" onPress={() => handleOpenModal(item)}>
                        View Details
                      </DropdownItem>
                       <DropdownSection title="Change Status">
                        {statusOptions
                          .filter(opt => opt.uid !== item.status)
                          .map((status) => (
                            <DropdownItem
                              key={status.uid}
                              onPress={() => handleUpdateStatus(item.id, status.uid as InquiryStatus)}
                            >
                              Mark as {status.name}
                            </DropdownItem>
                          ))}
                      </DropdownSection>
                      <DropdownItem key="delete" color="danger" onPress={() => handleDelete(item.id)}>
                        Delete Inquiry
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Inquiry from {selectedInquiry?.customerName}
              </ModalHeader>
              <ModalBody>
                <p><strong>Email:</strong> {selectedInquiry?.customerEmail}</p>
                <p><strong>Phone:</strong> {selectedInquiry?.customerPhone || 'N/A'}</p>
                <p><strong>Service Needed:</strong> {selectedInquiry?.serviceNeeded || 'N/A'}</p>
                <p><strong>Received:</strong> {selectedInquiry ? new Date(selectedInquiry.createdAt).toLocaleString() : 'N/A'}</p>
                <p><strong>Message:</strong></p>
                <p className="whitespace-pre-wrap">{selectedInquiry?.message}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
} 