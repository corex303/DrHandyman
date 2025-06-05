'use client';

import { loadStripe, PaymentIntent,Stripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

// Load Stripe.js with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Define an interface for PaymentIntent with expected metadata structure
interface CustomPaymentIntent extends PaymentIntent {
  metadata: {
    invoiceNumber?: string;
    // Add other expected metadata properties here if any
  };
}

// New component to handle logic depending on useSearchParams
function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    stripePromise.then(stripeInstance => {
      setStripe(stripeInstance);
    });
  }, []);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = searchParams.get('payment_intent_client_secret');

    if (!clientSecret) {
      setMessage('Error: Payment intent client secret not found in URL.');
      setIsLoading(false);
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      setIsLoading(false);
      if (!paymentIntent) {
        setMessage('Error: Could not retrieve payment intent details.');
        return;
      }

      // Cast to our custom type
      const customPaymentIntent = paymentIntent as CustomPaymentIntent;

      setPaymentStatus(customPaymentIntent.status);

      switch (customPaymentIntent.status) {
        case 'succeeded':
          setMessage(
            `Payment successful! Thank you for your payment. Your invoice number was: ${customPaymentIntent.metadata.invoiceNumber || 'N/A'}.`
          );
          // TODO: Here you would typically:
          // 1. Update your database with the successful payment.
          // 2. Send a confirmation email/receipt.
          break;
        case 'processing':
          setMessage(
            "Payment processing. We'll update you when payment is complete."
          );
          break;
        case 'requires_payment_method':
          setMessage(
            'Payment failed. Please try another payment method.'
          );
          break;
        default:
          setMessage('Something went wrong with your payment.');
          break;
      }
    }).catch(error => {
        setIsLoading(false);
        console.error("Error retrieving payment intent:", error);
        setMessage("Error retrieving payment details. Please contact support.");
    });
  }, [stripe, searchParams]);

  // This rendering logic was part of the original PaymentConfirmationPage
  if (isLoading) {
    return <p className="text-center text-lg">Loading payment status...</p>;
  }

  return (
    <div className="text-center p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">
        {paymentStatus === 'succeeded' ? 'Payment Successful!' : 
         paymentStatus === 'processing' ? 'Payment Processing' : 'Payment Status'}
      </h1>
      {message && (
        <p 
          className={`text-md mb-6 ${paymentStatus === 'succeeded' ? 'text-green-600' : paymentStatus === 'processing' ? 'text-blue-600' : 'text-red-600'}`}
        >
          {message}
        </p>
      )}
      {paymentStatus === 'succeeded' && (
          <p className="text-sm text-gray-600 mb-4">A confirmation receipt will be sent to your email if provided.</p>
      )}
      <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
        Go to Homepage
      </Link>
      {paymentStatus !== 'succeeded' && paymentStatus !== 'processing' && (
          <Link href="/payment" className="ml-4 text-indigo-600 hover:text-indigo-800 font-medium">
              Try Payment Again
          </Link>
      )}
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <div className="container mx-auto mt-10 p-4 flex justify-center items-center min-h-[60vh]">
      <Suspense fallback={<p className="text-center text-lg">Loading payment details...</p>}>
        <PaymentConfirmationContent />
      </Suspense>
    </div>
  );
} 