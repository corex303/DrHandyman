'use client';

import React, { useEffect, useState } from 'react';
import { getMe } from '@/lib/service-fusion/client';
import { Me } from 'service-fusion';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Spinner,
  Listbox,
  ListboxItem,
  Chip
} from '@nextui-org/react';

export default function ServiceFusionDashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setIsLoading(true);
        const meData = await getMe();
        setMe(meData);
      } catch (err) {
        setError('Failed to fetch user information.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Service Fusion Dashboard</h1>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Spinner label="Loading user info..." />
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : me ? (
            <Card className="max-w-md">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Authenticated User</h2>
                <Chip color="success" variant="flat">Connected</Chip>
              </CardHeader>
              <CardBody>
                <Listbox aria-label="User Information">
                  <ListboxItem key="id" textValue={`ID: ${me.id}`}>
                    <div className="flex justify-between w-full">
                      <strong>ID:</strong>
                      <span>{me.id}</span>
                    </div>
                  </ListboxItem>
                  <ListboxItem key="name" textValue={`Name: ${me.fname} ${me.lname}`}>
                     <div className="flex justify-between w-full">
                      <strong>Name:</strong>
                      <span>{me.fname} {me.lname}</span>
                    </div>
                  </ListboxItem>
                  <ListboxItem key="email" textValue={`Email: ${me.email}`}>
                     <div className="flex justify-between w-full">
                      <strong>Email:</strong>
                      <span>{me.email}</span>
                    </div>
                  </ListboxItem>
                </Listbox>
              </CardBody>
            </Card>
          ) : (
            <p>No user information available.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
} 