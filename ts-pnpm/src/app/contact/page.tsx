import ContactForm from '@/components/forms/ContactForm';
import PageHeader from '@/components/layout/PageHeader';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Contact Us"
        description="We'd love to hear from you! Please fill out the form below to get in touch."
      />
      <section className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Get a Free Quote</h2>
            <ContactForm />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Information</h2>
            <div className="space-y-4">
              <p>
                <strong>Phone:</strong> (123) 456-7890
              </p>
              <p>
                <strong>Email:</strong> contact@drhandyman.com
              </p>
              <p>
                <strong>Service Area:</strong> Your City, State
              </p>
              <p>
                <strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM
              </p>
              {/* Optional: Add social media links or a map here */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 