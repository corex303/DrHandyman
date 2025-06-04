'use client';

import { Button, Image, Input, Progress,Textarea } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadCloudIcon, XIcon } from 'lucide-react'; // Assuming lucide-react for icons
import React, {useEffect, useState } from 'react';
import { Controller,useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import type { Service } from '../../../generated/prisma-client';

// Zod schema for service form validation
const serviceFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric, and hyphenated (e.g., concrete-repair)')
    .transform(value => value.toLowerCase().replace(/\s+/g, '-')),
  imageUrl: z.string().url('Invalid URL format for image').optional().nullable(),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  service?: Service | null;
  onSuccess: (data: Service) => void;
  onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(service?.imageUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0); // Kept for potential future use with XHR/axios
  const [generatedSlug, setGeneratedSlug] = useState(service?.slug || '');

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      slug: service?.slug || '',
      imageUrl: service?.imageUrl || null,
    },
  });

  const serviceName = watch('name');

  useEffect(() => {
    if (serviceName && !service?.slug) { // Only auto-generate slug for new services or if slug is empty
      const slug = serviceName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphens and spaces
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
      setGeneratedSlug(slug);
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [serviceName, setValue, service?.slug]);
  
  useEffect(() => {
    if (service) {
        setValue('name', service.name);
        setValue('description', service.description);
        setValue('slug', service.slug);
        setValue('imageUrl', service.imageUrl || null);
        setImagePreview(service.imageUrl || null);
        setGeneratedSlug(service.slug);
    }
}, [service, setValue]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('Image preview data URL:', result); // Debugging line
        setImagePreview(result); // For visual preview
      };
      reader.readAsDataURL(file);
      // When a new file is selected for preview, the actual imageUrl in the form
      // should be considered null until a successful upload provides a real URL.
      setValue('imageUrl', null, { shouldValidate: true }); 
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue('imageUrl', null, { shouldValidate: true });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    // No longer sending upload_preset directly, backend handles it.

    setUploadProgress(50); // Indicate client-side part of upload initiation
    try {
      // Post to our backend API route
      const response = await fetch('/api/admin/services/upload-image', {
        method: 'POST',
        body: formData,
        // No 'Content-Type' header needed here; browser sets it for FormData
      });
      
      setUploadProgress(100); // Indicate backend processing might be done

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend image upload error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Image upload via backend failed');
      }

      const result = await response.json();
      setUploadProgress(0);
      return result.secure_url; // Our backend route returns { secure_url: ... }

    } catch (error) {
      console.error('Upload error (via backend):', error);
      toast.error(error instanceof Error ? error.message : 'Image upload failed');
      setUploadProgress(0);
      return null;
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    // Initialize with null. It will be populated by a new upload or existing URL.
    let finalImageUrlForPayload: string | null = null; 

    if (imageFile) { // A new image file has been selected
      const uploadedCloudinaryUrl = await uploadImage(imageFile);
      console.log('Uploaded URL from backend:', uploadedCloudinaryUrl); // Log the result
      if (uploadedCloudinaryUrl) {
        finalImageUrlForPayload = uploadedCloudinaryUrl;
      } else {
        // Toast error for upload failure is handled in uploadImage function
        setIsSubmitting(false);
        return; // Stop submission if new image upload failed
      }
    } else {
      // No new file was selected. 
      // If editing an existing service, and imagePreview (which might be original URL or null if removed)
      // indicates the original image should be kept or removed.
      if (service && imagePreview === service.imageUrl) {
        finalImageUrlForPayload = service.imageUrl; // Keep existing image
      } else if (imagePreview === null) {
        finalImageUrlForPayload = null; // Image was removed or never set
      }
      // If imagePreview is a base64 string here (meaning a file was selected then deselected without clearing properly)
      // AND imageFile is null, this logic correctly defaults to null or existing, not base64.
    }

    // The `data` from useForm already contains name, description, slug.
    // We just need to ensure imageUrl is correctly set.
    const payload = {
      ...data,
      name: data.name,
      description: data.description,
      slug: data.slug || generatedSlug, 
      imageUrl: finalImageUrlForPayload, // Use the determined URL
    };

    // Defensive check for slug (already present, but kept for safety)
    if (!payload.slug && generatedSlug) {
      payload.slug = generatedSlug;
    }
    
    // Ensure slug is not undefined if it's required by backend but optional in form due to auto-generation
    if (!payload.slug) {
        // This case should ideally be caught by Zod validation if slug is non-optional there
        // For now, let's use a transformed name if slug is truly empty.
        payload.slug = data.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        if (!payload.slug) { // If name was also empty or all special chars
            toast.error('Service name and slug cannot be empty or only special characters.');
            setIsSubmitting(false);
            return;
        }
    }

    try {
      const response = await fetch(
        service ? `/api/admin/services/${service.id}` : '/api/admin/services',
        {
          method: service ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (service ? 'Failed to update service' : 'Failed to create service'));
      }

      const result = await response.json();
      toast.success(service ? 'Service updated successfully!' : 'Service created successfully!');
      onSuccess(result);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Service Name
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="name"
              placeholder="e.g., Carpentry, Concrete Repair"
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message}
              isRequired
            />
          )}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Description
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="description"
              placeholder="Detailed description of the service..."
              isInvalid={!!errors.description}
              errorMessage={errors.description?.message}
              isRequired
              rows={4}
            />
          )}
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Slug
        </label>
        <Controller
          name="slug"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="slug"
              onValueChange={(value) => {
                const manualSlug = value
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-');
                setGeneratedSlug(manualSlug);
                setValue('slug', manualSlug, { shouldValidate: true });
              }}
              placeholder="e.g., concrete-repair (auto-generated or manual)"
              isInvalid={!!errors.slug}
              errorMessage={errors.slug?.message}
              isRequired
            />
          )}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Service Image
        </label>
        <div className="mt-1 flex flex-col items-center space-y-4">
          {imagePreview ? (
            <div className="relative group">
              {/* <Image 
                src={imagePreview} 
                alt="Service image preview" 
                width={200} 
                height={200} 
                className="rounded-md object-cover h-48 w-48" 
              /> */}
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="Service image preview" 
                  style={{ width: '12rem', height: '12rem', objectFit: 'cover', borderRadius: '0.375rem' }} // Equivalent to w-48, h-48, object-cover, rounded-md
                />
              )}
              <Button 
                isIconOnly 
                variant="light" 
                color="danger" 
                size="sm"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={removeImage}
                aria-label="Remove image"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center items-center w-48 h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-md">
              <UploadCloudIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-500" />
            </div>
          )}
           {uploadProgress > 0 && <Progress value={uploadProgress} color="primary" className="w-full" />}
          <input
            type="file"
            id="imageUrl"
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only" // Hide default input, trigger with button/label
          />
          <label
            htmlFor="imageUrl"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            {imagePreview ? 'Change Image' : 'Upload Image'}
          </label>
        </div>
        <Controller
            name="imageUrl"
            control={control}
            render={({ field: { onChange, onBlur, name, ref, value: fieldValue } }) => (
                <input
                    type="hidden"
                    onChange={onChange}
                    onBlur={onBlur}
                    name={name}
                    ref={ref}
                    value={fieldValue ?? ''}
                />
            )}
        />
        {errors.imageUrl && (
            <p className="mt-2 text-sm text-danger-600 dark:text-danger-500">{errors.imageUrl.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="flat" onPress={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? (service ? 'Saving...' : 'Creating...') : (service ? 'Save Changes' : 'Create Service')}
        </Button>
      </div>
    </form>
  );
};

export default ServiceForm; 