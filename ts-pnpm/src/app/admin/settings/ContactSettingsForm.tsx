'use client';

import { Input, Textarea, Button } from "@nextui-org/react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSWR from 'swr';
import toast from 'react-hot-toast';

const formSchema = z.object({
  contactPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  contactEmail: z.string().email('Invalid email address'),
  contactAddress: z.string().min(1, 'Address is required'),
});

type FormData = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ContactSettingsForm() {
  const { data: settings, error, mutate } = useSWR('/api/admin/settings/site', fetcher);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    values: {
      contactPhone: settings?.contactPhone || '',
      contactEmail: settings?.contactEmail || '',
      contactAddress: settings?.contactAddress || '',
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await fetch('/api/admin/settings/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await mutate();
      toast.success('Contact settings saved!');
    } catch (error) {
      toast.error('Failed to save contact settings.');
    }
  };

  if (error) return <div>Failed to load settings.</div>;
  if (!settings) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <Input
        {...register('contactPhone')}
        label="Public Phone Number"
        isInvalid={!!errors.contactPhone}
        errorMessage={errors.contactPhone?.message}
        fullWidth
      />
      <Input
        {...register('contactEmail')}
        label="Public Contact Email"
        type="email"
        isInvalid={!!errors.contactEmail}
        errorMessage={errors.contactEmail?.message}
        fullWidth
      />
      <Textarea
        {...register('contactAddress')}
        label="Business Address"
        isInvalid={!!errors.contactAddress}
        errorMessage={errors.contactAddress?.message}
        fullWidth
      />
      <div className="flex justify-end">
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          Save Contact Info
        </Button>
      </div>
    </form>
  );
} 