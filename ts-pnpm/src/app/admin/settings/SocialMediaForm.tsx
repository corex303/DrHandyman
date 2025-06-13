'use client';

import { Input, Button } from "@nextui-org/react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSWR from 'swr';
import toast from 'react-hot-toast';

const urlSchema = z.string().url('Invalid URL').or(z.literal(''));

const formSchema = z.object({
  socialFacebook: urlSchema,
  socialTwitter: urlSchema,
  socialInstagram: urlSchema,
  socialLinkedin: urlSchema,
  socialYoutube: urlSchema,
});

type FormData = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SocialMediaForm() {
  const { data: settings, error, mutate } = useSWR('/api/admin/settings/site', fetcher);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    values: {
      socialFacebook: settings?.socialFacebook || '',
      socialTwitter: settings?.socialTwitter || '',
      socialInstagram: settings?.socialInstagram || '',
      socialLinkedin: settings?.socialLinkedin || '',
      socialYoutube: settings?.socialYoutube || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await fetch('/api/admin/settings/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await mutate();
      toast.success('Social media links saved!');
    } catch (error) {
      toast.error('Failed to save social media links.');
    }
  };

  if (error) return <div>Failed to load settings.</div>;
  if (!settings) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-lg font-semibold">Social Media Links</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          {...register('socialFacebook')}
          label="Facebook URL"
          isInvalid={!!errors.socialFacebook}
          errorMessage={errors.socialFacebook?.message}
        />
        <Input
          {...register('socialTwitter')}
          label="Twitter URL"
          isInvalid={!!errors.socialTwitter}
          errorMessage={errors.socialTwitter?.message}
        />
        <Input
          {...register('socialInstagram')}
          label="Instagram URL"
          isInvalid={!!errors.socialInstagram}
          errorMessage={errors.socialInstagram?.message}
        />
        <Input
          {...register('socialLinkedin')}
          label="LinkedIn URL"
          isInvalid={!!errors.socialLinkedin}
          errorMessage={errors.socialLinkedin?.message}
        />
        <Input
          {...register('socialYoutube')}
          label="YouTube URL"
          isInvalid={!!errors.socialYoutube}
          errorMessage={errors.socialYoutube?.message}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          Save Social Media Links
        </Button>
      </div>
    </form>
  );
} 