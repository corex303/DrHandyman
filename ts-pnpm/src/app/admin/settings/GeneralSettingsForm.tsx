'use client';

import { Input, Button } from "@nextui-org/react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSWR from 'swr';
import toast from 'react-hot-toast';

const formSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  adminEmail: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function GeneralSettingsForm() {
  const { data: settings, error, mutate } = useSWR('/api/admin/settings/site', fetcher);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    values: {
      siteName: settings?.siteName || '',
      adminEmail: settings?.adminEmail || '',
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/admin/settings/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      await mutate(); // Re-fetch data
      toast.success('General settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };

  if (error) return <div>Failed to load settings.</div>
  if (!settings) return <div>Loading...</div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-lg font-semibold">General Site Settings</h3>
      <Input
        {...register('siteName')}
        label="Site Name"
        isInvalid={!!errors.siteName}
        errorMessage={errors.siteName?.message}
        fullWidth
      />
      <Input
        {...register('adminEmail')}
        label="Admin Contact Email"
        type="email"
        isInvalid={!!errors.adminEmail}
        errorMessage={errors.adminEmail?.message}
        fullWidth
      />
      <div className="flex justify-end">
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          Save General Settings
        </Button>
      </div>
    </form>
  );
} 