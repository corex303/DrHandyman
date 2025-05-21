'use client';

import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/forms/CheckoutForm';
import React, { useState, useEffect, useCallback } from 'react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// Ensure your publishable key is set in your .env file
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function PaymentPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [amountForIntent, setAmountForIntent] = useState<number | null>(null);
  const [invoiceForIntent, setInvoiceForIntent] = useState<string>('');
  const [emailForIntent, setEmailForIntent] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async () => {
    if (amountForIntent === null || amountForIntent <= 0) {
      setClientSecret(''); // Clear previous client secret if amount is invalid
      return;
    }
    setErrorMessage(null);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountForIntent, // Send amount in dollars
          invoiceNumber: invoiceForIntent,
          email: emailForIntent,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PaymentIntent');
      }
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error("Failed to create PaymentIntent:", error);
      setErrorMessage(error.message || 'Could not initialize payment.');
      setClientSecret('');
    }
  }, [amountForIntent, invoiceForIntent, emailForIntent]);

  // This useEffect will trigger the payment intent creation when
  // amountForIntent is valid. In a real app, you might trigger this on a button click
  // or a specific user action before showing the payment element.
  useEffect(() => {
    if (amountForIntent && amountForIntent > 0) {
      createPaymentIntent();
    }
  }, [amountForIntent, createPaymentIntent]);

  const options: StripeElementsOptions = clientSecret ? {
    clientSecret,
    // Fully customizable with appearance API.
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '4px',
        // See all possible variables below
      }
    },
  } : {}; // Pass empty options if clientSecret is not yet available

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Make a Payment</h1>
      
      {/* Inputs for amount, invoice, email - these will trigger clientSecret fetch */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="pageInvoiceNumber" className="block text-sm font-medium text-gray-700">
            Invoice Number
          </label>
          <input
            type="text"
            id="pageInvoiceNumber"
            value={invoiceForIntent}
            onChange={(e) => setInvoiceForIntent(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="pageAmount" className="block text-sm font-medium text-gray-700">
            Amount (USD)
          </label>
          <input
            type="number"
            id="pageAmount"
            value={amountForIntent ?? ''} // Handle null state for input
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setAmountForIntent(isNaN(val) ? null : val);
            }}
            required
            placeholder="e.g., 10.00"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="pageEmail" className="block text-sm font-medium text-gray-700">
            Email (for receipt, optional)
          </label>
          <input
            type="email"
            id="pageEmail"
            value={emailForIntent}
            onChange={(e) => setEmailForIntent(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {errorMessage}
        </div>
      )}

      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm 
            invoiceNumber={invoiceForIntent} 
            amount={amountForIntent ?? 0} // Pass amount and invoice to pre-fill or use in CheckoutForm
            email={emailForIntent}
          />
        </Elements>
      ) : (
        <div className="text-center p-4">
          {amountForIntent && amountForIntent > 0 && !errorMessage ? (
            <p>Initializing payment form...</p>
          ) : (
            <p>Please enter a valid amount to proceed with payment.</p>
          )}
        </div>
      )}
    </div>
  );
} 