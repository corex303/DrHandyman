"use client";

import { ChangeEvent, FormEvent, useEffect,useState } from "react";

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

// Type for Maintenance Worker
interface MaintenanceWorker {
  id: string;
  name: string;
}

// --- Reusable Form Field Components ---

interface ImageUploadFieldProps {
  id: string;
  label: string;
  images: File[];
  onImagesChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ id, label, images, onImagesChange }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      id={id}
      type="file"
      accept="image/*"
      multiple
      onChange={onImagesChange}
      required
      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
    {images.length > 0 && (
      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((file, index) => (
          <img
            key={index}
            src={URL.createObjectURL(file)}
            alt={`${label.toLowerCase().replace(" ", "-")}-preview-${index}`}
            className="max-h-40 rounded-md object-contain border"
          />
        ))}
      </div>
    )}
  </div>
);

interface MaintenanceWorkerSelectProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  workers: MaintenanceWorker[];
  isLoading: boolean;
}

const MaintenanceWorkerSelect: React.FC<MaintenanceWorkerSelectProps> = ({ value, onChange, workers, isLoading }) => (
  <div className="space-y-2">
    <label htmlFor="maintenanceWorkerId" className="block text-sm font-medium text-gray-700 mb-1">
      Maintenance Staff
    </label>
    <select
      id="maintenanceWorker"
      value={value}
      onChange={onChange}
      required
      disabled={isLoading || workers.length === 0}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100"
    >
      <option value="" disabled>{isLoading ? "Loading staff..." : workers.length === 0 ? "No active staff found" : "Select your name"}</option>
      {workers.map((worker) => (
        <option key={worker.id} value={worker.id}>
          {worker.name}
        </option>
      ))}
    </select>
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
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [selectedMaintenanceWorkerId, setSelectedMaintenanceWorkerId] = useState<string>("");
  const [maintenanceWorkers, setMaintenanceWorkers] = useState<MaintenanceWorker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState<boolean>(true);
  const [serviceCategory, setServiceCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      setIsLoadingWorkers(true);
      try {
        const response = await fetch("/api/maintenance/workers/active");
        if (!response.ok) {
          throw new Error("Failed to fetch maintenance workers");
        }
        const data: MaintenanceWorker[] = await response.json();
        setMaintenanceWorkers(data);
      } catch (error) {
        console.error("Error fetching maintenance workers:", error);
        alert("Failed to load maintenance workers. Please try refreshing the page.");
        setMaintenanceWorkers([]); // Ensure it's an empty array on error
      } finally {
        setIsLoadingWorkers(false);
      }
    };
    fetchWorkers();
  }, []);

  const handleBeforeImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBeforeImages(Array.from(e.target.files));
    }
  };

  const handleAfterImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAfterImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (beforeImages.length === 0 || afterImages.length === 0) {
      alert("Missing Images\nPlease upload at least one 'before' and one 'after' image.");
      setIsLoading(false);
      return;
    }

    if (!selectedMaintenanceWorkerId) {
      alert("Missing Worker Selection\nPlease select the maintenance worker who performed the job.");
      setIsLoading(false);
      return;
    }

    if (!serviceCategory) {
      alert("Missing Service Category\nPlease select a service category.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    beforeImages.forEach((file, index) => {
      formData.append("beforeImages", file);
    });
    afterImages.forEach((file, index) => {
      formData.append("afterImages", file);
    });
    formData.append("maintenanceWorkerId", selectedMaintenanceWorkerId);
    formData.append("serviceCategory", serviceCategory);
    formData.append("description", description);

    try {
      const response = await fetch("/api/maintenance/photos", {
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
      setBeforeImages([]);
      setAfterImages([]);
      setSelectedMaintenanceWorkerId("");
      setServiceCategory("");
      setDescription("");
      const beforeInput = document.getElementById("beforeImage") as HTMLInputElement;
      if (beforeInput) beforeInput.value = "";
      const afterInput = document.getElementById("afterImage") as HTMLInputElement;
      if (afterInput) afterInput.value = "";
      // Reset select for maintenance worker if it's a controlled component that needs it
      const workerSelect = document.getElementById("maintenanceWorker") as HTMLSelectElement;
      if (workerSelect) workerSelect.value = "";

    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload Failed\n${error instanceof Error ? error.message : "An unknown error occurred."}`);
    } finally {
      setIsLoading(false);
    }
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
                label="Before Image(s)"
                images={beforeImages}
                onImagesChange={handleBeforeImagesChange}
              />
              <ImageUploadField
                id="afterImage"
                label="After Image(s)"
                images={afterImages}
                onImagesChange={handleAfterImagesChange}
              />
            </div>

            <MaintenanceWorkerSelect
              value={selectedMaintenanceWorkerId}
              onChange={(e) => setSelectedMaintenanceWorkerId(e.target.value)}
              workers={maintenanceWorkers}
              isLoading={isLoadingWorkers}
            />

            <ServiceCategorySelect
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              categories={serviceCategories}
            />

            <DescriptionTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button type="submit" className="w-full" disabled={isLoading || isLoadingWorkers}>
              {isLoading ? "Uploading..." : isLoadingWorkers ? "Loading data..." : "Submit for Approval"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 