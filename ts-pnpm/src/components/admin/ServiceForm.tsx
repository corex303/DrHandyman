'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Textarea, Button, Select, SelectItem, Image, Progress, Chip, Switch } from '@nextui-org/react';
import { toast } from 'sonner';
import type { Service } from '.prisma/client';
import { UploadCloudIcon, XIcon } from 'lucide-react'; // Assuming lucide-react for icons
import { useRouter } from 'next/navigation';

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
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setValue('imageUrl', ''); // Clear existing imageUrl if a new file is selected
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue('imageUrl', null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

    setUploadProgress(50); 
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      
      setUploadProgress(100);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(errorData.error?.message || 'Image upload failed');
      }
      const data = await response.json();
      setUploadProgress(0);
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Image upload failed');
      setUploadProgress(0);
      return null;
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    let finalImageUrl = data.imageUrl; // Use existing URL if no new file

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        if (!service?.imageUrl) { 
            toast.error('Image upload failed. Please try again or remove the image.');
            setIsSubmitting(false);
            return;
        }
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      ...data,
      imageUrl: finalImageUrl,
      slug: data.slug || generatedSlug, // Ensure slug is included
    };

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
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Service Name"
            placeholder="e.g., Carpentry, Concrete Repair"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            isRequired
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            label="Description"
            placeholder="Detailed description of the service..."
            isInvalid={!!errors.description}
            errorMessage={errors.description?.message}
            isRequired
            minRows={3}
          />
        )}
      />

      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="URL Slug"
            placeholder="e.g., carpentry-services (auto-generated or custom)"
            description={serviceName && !service?.slug && field.value !== generatedSlug ? <span className='text-tiny text-warning-500'>Slug automatically generated. You can customize it.</span> : "Unique identifier for the URL. Lowercase, numbers, and hyphens only."}
            isInvalid={!!errors.slug}
            errorMessage={errors.slug?.message}
            isRequired
          />
        )}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Image (Optional)</label>
        <div className="mt-1 flex items-center">
          {imagePreview ? (
            <div className="relative mr-4">
              <Image src={imagePreview} alt="Service preview" width={100} height={100} className="rounded-md object-cover" />
              <Button 
                isIconOnly 
                variant="light" 
                color="danger" 
                size="sm"
                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 rounded-full p-1 bg-danger-50 hover:bg-danger-100"
                onPress={removeImage}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center mr-4">
              <UploadCloudIcon className="h-10 w-10 text-gray-400" />
            </div>
          )}
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <Button as="label" htmlFor="imageUpload" variant="flat" disabled={isSubmitting}>
            {imagePreview ? 'Change Image' : 'Upload Image'}
          </Button>
        </div>
        {uploadProgress > 0 && (
          <Progress value={uploadProgress} color="primary" size="sm" className="mt-2" aria-label="Uploading image..."/>
        )}
        {errors.imageUrl && <p className="mt-2 text-sm text-danger-500">{errors.imageUrl.message}</p>}
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