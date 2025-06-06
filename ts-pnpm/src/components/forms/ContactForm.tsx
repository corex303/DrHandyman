"use client";

import { useCallback, useRef, useState } from 'react';
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });

  const [apiResponseMessage, setApiResponseMessage] = useState<string | null>(null);
  const [isApiError, setIsApiError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (value: string) => {
    setFormData(prev => ({ ...prev, service: value }));
  };
  
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiResponseMessage(null);
    setIsApiError(false);

    const token = await handleRecaptchaVerify();
    if (!token) {
      return;
    }

    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formPayload.append(key, value);
    });
    formPayload.append("g-recaptcha-response", token);

    if (fileInputRef.current?.files) {
      Array.from(fileInputRef.current.files).forEach((file) => {
        formPayload.append("attachments", file);
      });
    }

    try {
      const response = await fetch('/api/service-inquiry', {
        method: 'POST',
        body: formPayload,
      });

      const result = await response.json();

      if (!response.ok) {
        setIsApiError(true);
        // Assuming result.message contains the error details
        setApiResponseMessage(result.message || "An error occurred.");
      } else {
        setApiResponseMessage(result.message || "Form submitted successfully!");
        // Reset form state
        setFormData({ name: '', email: '', phone: '', service: '', message: '' });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="john.doe@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="(123) 456-7890"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="service">Service Needed (Optional)</Label>
        <Select name="service" onValueChange={handleServiceChange} value={formData.service}>
          <SelectTrigger id="service">
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roofing">Roofing</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="painting">Painting</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="flooring">Flooring</SelectItem>
            <SelectItem value="exterior-work">Exterior Work</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="general-repairs">General Repairs</SelectItem>
            <SelectItem value="carpentry">Carpentry</SelectItem>
            <SelectItem value="concrete-repair">Concrete Repair</SelectItem>
            <SelectItem value="deck-building-repair">Deck Building / Repair</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message / Description of Work</Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Please describe the issue or service you need in detail."
          className="resize-none"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="attachments">Attachments (Optional)</Label>
        <Input
          id="attachments"
          name="attachments"
          type="file"
          ref={fileInputRef}
          multiple
        />
      </div>

      {apiResponseMessage && (
        <div className={`mt-4 text-sm ${isApiError ? 'text-red-500' : 'text-green-500'}`}>
          {apiResponseMessage}
        </div>
      )}

      <Button type="submit" className="w-full">
        Submit Inquiry
      </Button>
    </form>
  );
} 