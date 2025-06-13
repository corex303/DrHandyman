'use client';

import { Input, Textarea, Button } from "@nextui-org/react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSWR from 'swr';
import toast from 'react-hot-toast';

const formSchema = z.object({
  seoMetaTitle: z.string().min(1, 'Meta title is required').max(60, 'Title should be 60 characters or less'),
  seoMetaDesc: z.string().min(1, 'Meta description is required').max(160, 'Description should be 160 characters or less'),
  seoMetaKeywords: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SeoSettingsForm() {
  const { data: settings, error, mutate } = useSWR('/api/admin/settings/site', fetcher);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    values: {
      seoMetaTitle: settings?.seoMetaTitle || '',
      seoMetaDesc: settings?.seoMetaDesc || '',
      seoMetaKeywords: settings?.seoMetaKeywords || '',
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
      toast.success('SEO settings saved!');
    } catch (error) {
      toast.error('Failed to save SEO settings.');
    }
  };

  if (error) return <div>Failed to load settings.</div>;
  if (!settings) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-lg font-semibold">Default SEO Metadata</h3>
      <Input
        {...register('seoMetaTitle')}
        label="Default Meta Title"
        isInvalid={!!errors.seoMetaTitle}
        errorMessage={errors.seoMetaTitle?.message}
        fullWidth
      />
      <Textarea
        {...register('seoMetaDesc')}
        label="Default Meta Description"
        isInvalid={!!errors.seoMetaDesc}
        errorMessage={errors.seoMetaDesc?.message}
        fullWidth
      />
      <Textarea
        {...register('seoMetaKeywords')}
        label="Meta Keywords (comma-separated)"
        description="Enter keywords separated by commas. e.g., handyman, home repair"
        fullWidth
      />
      <div className="flex justify-end">
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          Save SEO Settings
        </Button>
      </div>
    </form>
  );
} 