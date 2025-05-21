"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).optional().or(z.literal('')),
  service: z.string().optional(),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type FormData = z.infer<typeof formSchema>;

export default function ContactForm() {
  const [apiResponseMessage, setApiResponseMessage] = useState<string | null>(null);
  const [isApiError, setIsApiError] = useState<boolean>(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      service: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setApiResponseMessage(null);
    setIsApiError(false);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setIsApiError(true);
        if (result.errors) {
          let errorMessages = "Please correct the following errors:";
          for (const field in result.errors) {
            errorMessages += `\n- ${field}: ${result.errors[field].join(', ')}`;
          }
          setApiResponseMessage(errorMessages);
        } else {
          setApiResponseMessage(result.message || "An error occurred.");
        }
      } else {
        setApiResponseMessage(result.message || "Form submitted successfully!");
        form.reset();
      }
    } catch (error) {
      setIsApiError(true);
      setApiResponseMessage("Failed to submit the form. Please try again later.");
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          {...form.register("name")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...form.register("email")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number (Optional)
        </label>
        <input
          id="phone"
          type="tel"
          {...form.register("phone")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {form.formState.errors.phone && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium text-gray-700">
          Service Needed (Optional)
        </label>
        <select
          id="service"
          {...form.register("service")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select a service</option>
          <option value="carpentry">Carpentry</option>
          <option value="concrete">Concrete</option>
          <option value="concrete_repair">Concrete Repair</option>
          <option value="demolition">Demolition</option>
          <option value="door_installation_repair">Door Installation/Repair</option>
          <option value="drywall_repair_texture">Drywall Repair/Texture</option>
          <option value="fence_repair_replacement">Fence Repair/Replacement</option>
          <option value="fixture_installation_repair">Fixture Installation/Repair</option>
          <option value="flooring_repair_replacement">Flooring Repair/Replacement</option>
          <option value="foundation_repair">Foundation Repair</option>
          <option value="framing">Framing</option>
          <option value="general_maintenance">General Maintenance</option>
          <option value="gutter_cleaning_repair">Gutter Cleaning/Repair</option>
          <option value="hvac_repair_maintenance">HVAC Repair/Maintenance</option>
          <option value="insulation_installation">Insulation Installation</option>
          <option value="landscaping_yard_work">Landscaping/Yard Work</option>
          <option value="painting_interior_exterior">Painting (Interior/Exterior)</option>
          <option value="plumbing_repair_installation">Plumbing Repair/Installation</option>
          <option value="pressure_washing">Pressure Washing</option>
          <option value="roof_repair_maintenance">Roof Repair/Maintenance</option>
          <option value="siding_repair_installation">Siding Repair/Installation</option>
          <option value="tile_installation_repair">Tile Installation/Repair</option>
          <option value="window_installation_repair">Window Installation/Repair</option>
          <option value="other">Other</option>
        </select>
        {form.formState.errors.service && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.service.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          {...form.register("message")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {form.formState.errors.message && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.message.message}</p>
        )}
      </div>

      {apiResponseMessage && (
        <div className={`p-4 rounded-md ${isApiError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <p style={{ whiteSpace: 'pre-line' }}>{apiResponseMessage}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {form.formState.isSubmitting ? "Submitting..." : "Send Message"}
        </button>
      </div>
    </form>
  );
} 