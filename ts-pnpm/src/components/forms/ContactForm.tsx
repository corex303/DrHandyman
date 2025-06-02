"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).optional().or(z.literal('')),
  service: z.string().optional(),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type FormDataFields = z.infer<typeof formSchema>;

export default function ContactForm() {
  const [apiResponseMessage, setApiResponseMessage] = useState<string | null>(null);
  const [isApiError, setIsApiError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const form = useForm<FormDataFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      service: "",
      message: "",
    },
  });

  const handleRecaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      console.log("Execute recaptcha not yet available");
      setIsApiError(true);
      setApiResponseMessage("ReCAPTCHA not ready. Please try again in a moment.");
      return null;
    }
    try {
      const token = await executeRecaptcha('contactFormSubmit');
      return token;
    } catch (error) {
      console.error("Error executing reCAPTCHA:", error);
      setIsApiError(true);
      setApiResponseMessage("Failed to verify reCAPTCHA. Please try again.");
      return null;
    }
  }, [executeRecaptcha]);

  const onSubmit = async (data: FormDataFields) => {
    setApiResponseMessage(null);
    setIsApiError(false);

    const token = await handleRecaptchaVerify();
    if (!token) {
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append("g-recaptcha-response", token);

    if (fileInputRef.current?.files) {
      Array.from(fileInputRef.current.files).forEach((file) => {
        formData.append("attachments", file);
      });
    }

    try {
      const response = await fetch('/api/service-inquiry', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setIsApiError(true);
        if (result.errors) {
          let errorMessages = "Please correct the following errors:";
          for (const field in result.errors) {
            const errorsArray = Array.isArray(result.errors[field]) ? result.errors[field] : [result.errors[field]];
            errorMessages += `\n- ${field}: ${errorsArray.join(', ')}`;
          }
          setApiResponseMessage(errorMessages);
        } else {
          setApiResponseMessage(result.message || "An error occurred.");
        }
      } else {
        setApiResponseMessage(result.message || "Form submitted successfully!");
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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
          <option value="roofing">Roofing</option>
          <option value="plumbing">Plumbing</option>
          <option value="painting">Painting</option>
          <option value="hvac">HVAC</option>
          <option value="flooring">Flooring</option>
          <option value="exterior-work">Exterior Work</option>
          <option value="electrical">Electrical</option>
          <option value="general-repairs">General Repairs</option>
          <option value="carpentry">Carpentry</option>
          <option value="concrete-repair">Concrete Repair</option>
          <option value="deck-building-repair">Deck Building / Repair</option>
          <option value="other">Other</option>
        </select>
        {form.formState.errors.service && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.service.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message / Description of Work
        </label>
        <textarea
          id="message"
          rows={4}
          {...form.register("message")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Please describe the issue or service you need in detail."
        />
        {form.formState.errors.message && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.message.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
          Upload Photos (Optional)
        </label>
        <input
          id="attachments"
          type="file"
          multiple
          ref={fileInputRef}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          accept="image/png, image/jpeg, image/gif, image/webp"
        />
        <p className="mt-1 text-xs text-gray-500">You can upload multiple images (PNG, JPG, GIF, WEBP).</p>
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
          {form.formState.isSubmitting ? "Submitting Inquiry..." : "Send Inquiry"}
        </button>
      </div>
    </form>
  );
} 