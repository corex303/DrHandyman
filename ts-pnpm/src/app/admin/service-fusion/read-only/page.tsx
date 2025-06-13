'use client';

import React, { useEffect, useState } from 'react';
import {
  getJobCategories,
  getJobStatuses,
  getPaymentTypes,
  getSources,
  getTechs,
} from '@/lib/service-fusion/client';
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Tabs,
  Tab,
} from '@nextui-org/react';
import { JobCategory, JobStatus, PaymentType, Source, Tech } from 'service-fusion';

type ResourceType = 'categories' | 'statuses' | 'paymentTypes' | 'sources' | 'techs';

interface Resource<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
}

export default function ServiceFusionReadOnlyPage() {
  const [resources, setResources] = useState<{
    categories: Resource<JobCategory>;
    statuses: Resource<JobStatus>;
    paymentTypes: Resource<PaymentType>;
    sources: Resource<Source>;
    techs: Resource<Tech>;
  }>({
    categories: { data: [], isLoading: true, error: null },
    statuses: { data: [], isLoading: true, error: null },
    paymentTypes: { data: [], isLoading: true, error: null },
    sources: { data: [], isLoading: true, error: null },
    techs: { data: [], isLoading: true, error: null },
  });

  const fetchResource = async (type: ResourceType, fetcher: () => Promise<any[]>) => {
    try {
      const data = await fetcher();
      setResources((prev) => ({
        ...prev,
        [type]: { data, isLoading: false, error: null },
      }));
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
      setResources((prev) => ({
        ...prev,
        [type]: { ...prev[type], isLoading: false, error: `Failed to fetch ${type}.` },
      }));
    }
  };

  useEffect(() => {
    fetchResource('categories', getJobCategories);
    fetchResource('statuses', getJobStatuses);
    fetchResource('paymentTypes', getPaymentTypes);
    fetchResource('sources', getSources);
    fetchResource('techs', getTechs);
  }, []);

  const renderTable = (resource: Resource<any>, title: string) => {
    if (resource.isLoading) {
      return <Spinner label={`Loading ${title}...`} />;
    }
    if (resource.error) {
      return <p className="text-danger">{resource.error}</p>;
    }
    if (!resource.data || resource.data.length === 0) {
        return <p>No data available.</p>;
    }
    return (
      <Table aria-label={`${title} Table`}>
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>NAME</TableColumn>
        </TableHeader>
        <TableBody items={resource.data}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Service Fusion Read-Only Resources</h1>
        </CardHeader>
        <CardBody>
          <Tabs aria-label="Read-Only Resources">
            <Tab key="categories" title="Job Categories">
              {renderTable(resources.categories, 'Job Categories')}
            </Tab>
            <Tab key="statuses" title="Job Statuses">
              {renderTable(resources.statuses, 'Job Statuses')}
            </Tab>
            <Tab key="paymentTypes" title="Payment Types">
              {renderTable(resources.paymentTypes, 'Payment Types')}
            </Tab>
            <Tab key="sources" title="Sources">
              {renderTable(resources.sources, 'Sources')}
            </Tab>
            <Tab key="techs" title="Technicians">
              {renderTable(resources.techs, 'Technicians')}
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
} 