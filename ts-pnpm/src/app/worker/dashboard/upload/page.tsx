"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Button from "@/components/buttons/Button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/components/ui/use-toast";

// TODO: Fetch these from the database or a central config
const serviceCategories = [
  "Carpentry",
  "Concrete",
  "Concrete Repair",
  "Drywall",
  "Electrical",
  "Fencing",
  "Flooring",
  "General Maintenance",
  "Landscaping",
  "Painting",
  "Plumbing",
  "Pressure Washing",
  "Roofing",
  "Tiling",
  "Window & Door",
];

// --- Reusable Form Field Components ---

interface ImageUploadFieldProps {
  id: string;
  label: string;
  image: File | null;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ id, label, image, onImageChange }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      id={id}
      type="file"
      accept="image/*"
      onChange={onImageChange}
      required
      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
    {image && (
      <div className="mt-2">
        <img
          src={URL.createObjectURL(image)}
          alt={`${label.toLowerCase().replace(" ", "-")}-preview`}
          className="max-h-40 rounded-md object-contain border"
        />
      </div>
    )}
  </div>
);

interface ServiceCategorySelectProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  categories: string[];
}

const ServiceCategorySelect: React.FC<ServiceCategorySelectProps> = ({ value, onChange, categories }) => (
  <div className="space-y-2">
    <label htmlFor="serviceCategory" className="block text-sm font-medium text-gray-700">Service Category</label>
    <select
      id="serviceCategory"
      value={value}
      onChange={onChange}
      required
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
    >
      <option value="" disabled>Select a category</option>
      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  </div>
);

interface DescriptionTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const DescriptionTextarea: React.FC<DescriptionTextareaProps> = ({ value, onChange }) => (
  <div className="space-y-2">
    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
    <textarea
      id="description"
      value={value}
      onChange={onChange}
      placeholder="Add any notes or details about the job..."
      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      rows={3}
    />
  </div>
);

// --- Main Page Component ---

export default function WorkerPhotoUploadPage() {
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [serviceCategory, setServiceCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const { toast } = useToast(); // Using alert for now

  const handleBeforeImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBeforeImage(e.target.files[0]);
    }
  };

  const handleAfterImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAfterImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!beforeImage || !afterImage) {
      alert("Missing Images\nPlease upload both 'before' and 'after' images.");
      setIsLoading(false);
      return;
    }

    if (!serviceCategory) {
      alert("Missing Service Category\nPlease select a service category.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("beforeImage", beforeImage);
    formData.append("afterImage", afterImage);
    formData.append("serviceCategory", serviceCategory);
    formData.append("description", description);

    try {
      const response = await fetch("/api/worker/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload photos");
      }

      const result = await response.json();
      console.log("Upload result:", result);

      alert("Upload Successful!\nYour photos have been submitted for approval.");
      setBeforeImage(null);
      setAfterImage(null);
      setServiceCategory("");
      setDescription("");
      const beforeInput = document.getElementById("beforeImage") as HTMLInputElement;
      if (beforeInput) beforeInput.value = "";
      const afterInput = document.getElementById("afterImage") as HTMLInputElement;
      if (afterInput) afterInput.value = "";

    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload Failed\n${error instanceof Error ? error.message : "An unknown error occurred."}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // For the Select component to work with the placeholder, its onValueChange needs to be adapted.
  // This is a simplified placeholder implementation.
  const handleSelectCategory = (value: string) => {
    setServiceCategory(value);
    // Here you might also want to close the conceptual dropdown
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto border rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold">Upload Work Photos</h1>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadField
                id="beforeImage"
                label="Before Image"
                image={beforeImage}
                onImageChange={handleBeforeImageChange}
              />
              <ImageUploadField
                id="afterImage"
                label="After Image"
                image={afterImage}
                onImageChange={handleAfterImageChange}
              />
            </div>

            <ServiceCategorySelect
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              categories={serviceCategories}
            />

            <DescriptionTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Uploading..." : "Submit for Approval"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 