import React from 'react';
import { FaQuoteLeft } from 'react-icons/fa';

interface TestimonialCardProps {
  quote: string;
  author: string;
  title?: string;
  company?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, author, title, company }) => {
  return (
    <div className='bg-primary-navy text-text-light p-8 rounded-lg shadow-lg flex flex-col'>
      <FaQuoteLeft className='text-accent-gold text-3xl mb-6' />
      <p className='text-lg italic text-secondary-gray-light mb-6 flex-grow'>
        {quote}
      </p>
      <div>
        <p className='font-serif text-xl font-semibold text-white'>{author}</p>
        {(title || company) && (
          <p className='text-sm text-secondary-gray-light'>
            {title}{title && company ? ', ' : ''}{company}
          </p>
        )}
      </div>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      quote: 'The maintenance staff is really responsive and nice to work with. Their handymen can handle most repairs without charging you an arm and a leg. Living in NY, I could always count on Dr. Handyman to take care of everything without concern.',
      author: 'Charles Engelberg',
    },
    {
      quote: 'Dr. Handyman is truly excellent: Excellent customer service, excellent knocking out repairs, excellent results. Wonderful company, I would recommend friends and family to this company, easily.',
      author: 'Fred Lee',
    },
    {
      quote: "It makes no difference which group you work with; maintenance, administrative support or their management staff. They are always ready, willing and able to resolve whatever issue you may have. Their maintenance technicians are very knowledgeable and ready to go the extra mile to ensure any situation is resolved to my satisfaction.",
      author: 'Thomas J. Casey',
    },
  ];

  return (
    <section className='bg-background-light py-20 md:py-28'>
      <div className='layout container mx-auto'>
        <div className='text-center mb-16'>
          <h2 className='font-serif text-3xl md:text-4xl font-bold text-primary-navy mb-4'>
            What Our Customers Are Saying
          </h2>
          <p className='text-lg md:text-xl text-secondary-gray max-w-2xl mx-auto'>
            We build lasting relationships with our clients through quality work and dependable service. Here's what they have to say.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-10'>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 